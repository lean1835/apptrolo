// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl, Alert, Platform } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../../../styles/Theme';
import { MoneyIcon, SendIcon, CheckIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Badge, Button } from '../../../components/Common';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const addMonthsStr = (dateStr, n) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  let year = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10); // 1-12
  const day = parseInt(parts[2], 10);
  
  month += n;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  
  const yStr = year.toString();
  const mStr = month.toString().padStart(2, '0');
  const dStr = day.toString().padStart(2, '0');
  
  return `${yStr}-${mStr}-${dStr}`;
};

const DebtScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [debtRooms, setDebtRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [prices, setPrices] = useState({ wifi: 0, garbage: 0, waterMode: 'meter', waterFixed: 0 });
  const params = useLocalSearchParams();
  const router = useRouter();

  const fetchDebt = useCallback(async () => {
    try {
      const [roomsRes, billsRes, pricesRes] = await Promise.all([
         axiosInstance.get('/rooms'),
         axiosInstance.get('/bills'),
         axiosInstance.get('/utility-prices')
      ]);
      
      const rooms = roomsRes.data || [];
      const bills = billsRes.data || [];
      const pricesData = pricesRes.data || { wifi: 0, garbage: 0 };
      setPrices(pricesData);
      
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // Find all rooms with unpaid bills OR status 'debt'
      const debtData = rooms.map(room => {
        const checkinDateStr = room.checkin || '';
        const roomBills = bills.filter(b => b.roomId === room.id && (!checkinDateStr || b.date >= checkinDateStr));
        const unpaidBills = roomBills.filter(b => !b.collected);
        
        // Sort unpaid bills so the oldest is first
        const sortedUnpaidBills = [...unpaidBills].sort((a, b) => new Date(a.date) - new Date(b.date));
        const currentMonthBill = roomBills.find(b => new Date(b.date).getMonth() === thisMonth && new Date(b.date).getFullYear() === thisYear);
        
        let debtLabel = 'Đang nợ';
        if (sortedUnpaidBills.length > 0) {
          const bDate = new Date(sortedUnpaidBills[0].date);
          debtLabel = `T${bDate.getMonth() + 1}/${bDate.getFullYear()}`;
        }

        let debtMonths = unpaidBills.length;
        if (room.checkin) {
          const checkinDate = new Date(room.checkin);
          const now = new Date();
          if (!isNaN(checkinDate.getTime())) {
            const diffTime = Math.abs(now - checkinDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const calculatedMonths = Math.floor(diffDays / 30);
            if (calculatedMonths >= 1) {
              debtMonths = calculatedMonths;
            }
          }
        }
        
        const rent = parseFloat(room.price) || 0;
        const waterCost = pricesData.waterMode === 'fixed' ? (pricesData.waterFixed || 0) : 0;
        const wifiGarbage = (pricesData.wifi || 0) + (pricesData.garbage || 0);
        const fixedMonthlyCost = rent + wifiGarbage + waterCost;
        
        const dbUnpaidSum = unpaidBills.reduce((s, b) => s + (Number(b.total) || 0), 0);
        const ungeneratedCount = Math.max(0, debtMonths - unpaidBills.length);
        const totalDebt = dbUnpaidSum + ungeneratedCount * fixedMonthlyCost;

        return {
          ...room,
          debtMonths: debtMonths,
          unpaidCount: unpaidBills.length,
          unpaidBills: sortedUnpaidBills,
          totalDebt: totalDebt,
          isSent: currentMonthBill?.sent || false,
          currentBillId: currentMonthBill?.id || (sortedUnpaidBills.length > 0 ? sortedUnpaidBills[sortedUnpaidBills.length - 1].id : undefined),
          debtLabel: debtLabel
        };
      }).filter(r => r.unpaidCount > 0 || r.status === 'debt' || r.status === 'Debt');

      setDebtRooms(debtData);
    } catch (err) {
      console.error('Fetch debt error:', err);
    }
  }, []);

  const performCollectDebt = async (item) => {
    const unpaidBills = item.unpaidBills || [];
    
    const rent = parseFloat(item.price) || 0;
    const waterCost = prices.waterMode === 'fixed' ? (prices.waterFixed || 0) : 0;
    const wifiGarbage = (prices.wifi || 0) + (prices.garbage || 0);
    const fixedMonthlyCost = rent + wifiGarbage + waterCost;
    
    const billsToUpdate = [];
    const billsToCreate = [];
    
    if (item.checkin && item.debtMonths > 0) {
      for (let i = 0; i < item.debtMonths; i++) {
        const cycleDate = addMonthsStr(item.checkin, i);
        if (i < unpaidBills.length) {
          billsToUpdate.push(unpaidBills[i]);
        } else {
          billsToCreate.push({
            date: cycleDate,
            total: fixedMonthlyCost,
          });
        }
      }
    } else {
      billsToUpdate.push(...unpaidBills);
    }
    
    // 1. Update existing bills to collected
    if (billsToUpdate.length > 0) {
      await Promise.all(
        billsToUpdate.map(b => axiosInstance.put(`/bills/${b.id || b._id}`, { collected: true }))
      );
    }
    
    // 2. Create missing bills as collected so they are counted towards revenue
    if (billsToCreate.length > 0) {
      await Promise.all(
        billsToCreate.map(b => axiosInstance.post(`/rooms/${item.id || item._id}/bills`, {
          total: b.total,
          date: b.date,
          sent: true,
          collected: true,
        }))
      );
    }
    
    // 3. Advance checkin date and clear status if room has debtMonths
    if (item.checkin && item.debtMonths > 0) {
      const targetCheckin = addMonthsStr(item.checkin, item.debtMonths);
      await axiosInstance.put(`/rooms/${item.id || item._id}`, {
        name: item.name,
        price: item.price,
        status: item.status === 'debt' || item.status === 'Debt' ? 'occupied' : item.status,
        checkin: targetCheckin,
      });
    } else if (!item.checkin && item.status === 'debt') {
      await axiosInstance.put(`/rooms/${item.id || item._id}`, {
        name: item.name,
        price: item.price,
        status: 'occupied',
      });
    }
  };

  const handleCollectMoneyWithConfirm = (item) => {
    const confirmMsg = item.debtMonths >= 2
      ? `Xác nhận khách ${item.tenant || 'thuê'} ở phòng ${item.name} đã trả toàn bộ tiền thuê trọ nợ ${item.debtMonths} tháng?`
      : `Xác nhận khách ${item.tenant || 'thuê'} ở phòng ${item.name} đã trả tiền thuê trọ tháng này?`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMsg);
      if (confirmed) {
        (async () => {
          try {
            await performCollectDebt(item);
            alert("Đã thu tiền phòng trọ thành công!");
            fetchDebt();
          } catch (err) {
            alert("Lỗi: Không thể thu tiền phòng trọ");
          }
        })();
      }
      return;
    }

    Alert.alert(
      "Xác nhận thu tiền",
      confirmMsg,
      [
        {
          text: "Hủy",
          style: "cancel"
        },
        {
          text: "Xác nhận",
          onPress: async () => {
            try {
              await performCollectDebt(item);
              Alert.alert("Thành công", "Đã thu tiền phòng trọ thành công!");
              fetchDebt();
            } catch (err) {
              Alert.alert("Lỗi", "Không thể thu tiền phòng trọ");
            }
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDebt();
    setRefreshing(false);
  }, [fetchDebt]);

  useFocusEffect(
    useCallback(() => {
      fetchDebt();
      if (params.filter) {
        setFilter(params.filter);
      }
      const interval = setInterval(fetchDebt, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }, [fetchDebt, params.filter])
  );

  const totalDebtValue = debtRooms.reduce((sum, r) => sum + r.totalDebt, 0);
  const sentCount = debtRooms.filter(r => r.isSent).length;

  const renderDebtItem = ({ item }) => {
    const isSent = item.isSent; 
    const debtMonths = item.debtMonths !== undefined ? item.debtMonths : item.unpaidCount;
    const debtLabel = item.debtLabel;

    return (
      <TouchableOpacity 
        style={[styles.dcard, debtMonths >= 2 && styles.dcardOv]}
        onPress={() => router.push({ pathname: '/bill', params: { id: item.id } })}
      >
        <View style={styles.dcol1}>
           <Text style={styles.droomLbl}>{item.name}</Text>
           <Badge label={debtMonths >= 2 ? `Nợ ${debtMonths} th` : debtLabel} type={debtMonths >= 2 ? 'rose' : 'gray'} />
        </View>
        <View style={styles.dinfo}>
           <Text style={styles.dtname}>{item.tenant || 'Khách thuê'}</Text>
           <Text style={styles.damount}>{Number(item.totalDebt).toLocaleString('vi')} đ</Text>
           <Text style={styles.dmeta}>
              {debtMonths >= 2 
                ? (isSent ? 'Đã gửi hóa đơn (Nợ cộng dồn)' : 'Chưa gửi hóa đơn (Nợ cộng dồn)') 
                : 'Đang nợ tiền'
              }
           </Text>
        </View>
        <View style={styles.dcol3}>
           <TouchableOpacity 
             style={[styles.dsend, { backgroundColor: COLORS.pr }]} 
             onPress={() => handleCollectMoneyWithConfirm(item)}
           >
             <Text style={styles.dsendTxt}>Đã thu tiền</Text>
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topbar, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.tbtitle}>Công nợ</Text>
      </View>
      
      <View style={styles.sumbar}>
        <View style={styles.sbrow}>
          <Text style={styles.sblbl}>Phòng chưa thu tiền</Text>
          <Text style={styles.sbval}>{debtRooms.length} phòng</Text>
        </View>
        <View style={styles.sbrow}>
          <Text style={styles.sblbl}>Đã gửi hóa đơn</Text>
          <Text style={[styles.sbval, { color: COLORS.sky }]}>{sentCount} phòng</Text>
        </View>
        <View style={styles.sbrow}>
          <Text style={styles.sblbl}>Tổng cần thu</Text>
          <Text style={styles.sbval}>{Number(totalDebtValue).toLocaleString('vi')} đ</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {debtRooms.length === 0 ? (
          <View style={styles.empty}>
             <View style={styles.emptyicon}><CheckIcon size={32} color={COLORS.pr} /></View>
             <Text style={styles.emptytxt}>Tuyệt vời! Tất cả phòng đã thu tiền tháng này.</Text>
          </View>
        ) : (
          <>
            <View style={styles.segwrap}>
              <TouchableOpacity 
                style={[styles.seg, filter === 'all' && styles.segOn]} 
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.segTxt, filter === 'all' && styles.segTxtOn]}>Tất cả ({debtRooms.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.seg, filter === 'unsent' && styles.segOn]} 
                onPress={() => setFilter('unsent')}
              >
                <Text style={[styles.segTxt, filter === 'unsent' && styles.segTxtOn]}>Chưa gửi ({debtRooms.length - sentCount})</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.seg, filter === 'sent' && styles.segOn]} 
                onPress={() => setFilter('sent')}
              >
                <Text style={[styles.segTxt, filter === 'sent' && styles.segTxtOn]}>Đã gửi ({sentCount})</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dlist}>
               {debtRooms
                 .filter(r => {
                   if (filter === 'sent') return r.isSent;
                   if (filter === 'unsent') return !r.isSent;
                   return true;
                 })
                 .map(item => <View key={item.id}>{renderDebtItem({ item })}</View>)
               }
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topbar: {
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 14,
    ...SHADOWS.sh,
  },
  tbtitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.g1,
  },
  sumbar: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.g5,
  },
  sbrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  sblbl: {
    fontSize: 12,
    color: COLORS.g3,
    fontWeight: '600',
  },
  sbval: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.rose,
  },
  scroll: {
    padding: 14,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
    gap: 14,
  },
  emptyicon: {
    width: 64,
    height: 64,
    backgroundColor: COLORS['pr-l'],
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptytxt: {
    fontSize: 14,
    color: COLORS.g3,
    textAlign: 'center',
    fontWeight: '600',
  },
  segwrap: {
    flexDirection: 'row',
    backgroundColor: COLORS.g6,
    borderRadius: 11,
    padding: 3,
    gap: 2,
    marginBottom: 10,
  },
  seg: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segOn: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sh,
  },
  segTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.g4,
  },
  segTxtOn: {
    color: COLORS.pr,
  },
  dlist: {
    gap: 9,
    marginBottom: 10,
  },
  dcard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...SHADOWS.sh,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.g5,
  },
  dcardOv: { borderLeftColor: COLORS.rose },
  dcol1: {
    minWidth: 46,
    gap: 4,
  },
  droomLbl: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.g1,
  },
  dinfo: {
    flex: 1,
  },
  dtname: {
    fontSize: 12,
    color: COLORS.g2,
    fontWeight: '600',
  },
  damount: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.rose,
    marginTop: 1,
  },
  dmeta: {
    fontSize: 10,
    color: COLORS.g4,
    marginTop: 1,
    fontWeight: '600',
  },
  dcol3: {
    gap: 5,
  },
  dsend: {
    backgroundColor: COLORS.pr,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  dsendTxt: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  dsent: {
    backgroundColor: COLORS['pr-l'],
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 11,
    alignItems: 'center',
  },
  dsentTxt: {
    color: COLORS['pr-d'],
    fontSize: 11,
    fontWeight: '800',
  },
});

export default DebtScreen;

