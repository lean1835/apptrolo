import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../styles/Theme';
import { MoneyIcon, SendIcon, CheckIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Badge, Button } from '../components/Common';
import { useFocusEffect } from 'expo-router';

const DebtScreen = ({ navigation }) => {
  const [debtRooms, setDebtRooms] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchDebt = useCallback(async () => {
    try {
      const [roomsRes, billsRes] = await Promise.all([
         axiosInstance.get('/rooms'),
         axiosInstance.get('/bills')
      ]);
      
      const rooms = roomsRes.data || [];
      const bills = billsRes.data || [];
      
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      // Find all rooms with unpaid bills OR status 'debt'
      const debtData = rooms.map(room => {
        const roomBills = bills.filter(b => b.roomId === room.id);
        const unpaidBills = roomBills.filter(b => !b.collected);
        const currentMonthBill = roomBills.find(b => new Date(b.date).getMonth() === thisMonth && new Date(b.date).getFullYear() === thisYear);
        
        return {
          ...room,
          unpaidCount: unpaidBills.length,
          totalDebt: unpaidBills.reduce((s, b) => s + (Number(b.total) || 0), 0),
          isSent: currentMonthBill?.sent || false,
          currentBillId: currentMonthBill?.id
        };
      }).filter(r => r.unpaidCount > 0 || r.status === 'debt' || r.status === 'Debt');

      setDebtRooms(debtData);
    } catch (err) {
      console.error('Fetch debt error:', err);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDebt();
    setRefreshing(false);
  }, [fetchDebt]);

  useFocusEffect(
    useCallback(() => {
      fetchDebt();
    }, [fetchDebt])
  );

  const totalDebtValue = debtRooms.reduce((sum, r) => sum + r.totalDebt, 0);
  const sentCount = debtRooms.filter(r => r.isSent).length;

  const renderDebtItem = ({ item }) => {
    const isSent = item.isSent; 
    const debtMonths = item.unpaidCount;
    const debtLabel = 'T3/2026'; // Should ideally be from bill date

    return (
      <View style={[styles.dcard, debtMonths >= 2 && styles.dcardOv]}>
        <View style={styles.dcol1}>
           <Text style={styles.droomLbl}>{item.name}</Text>
           <Badge label={debtMonths >= 2 ? `Nợ ${debtMonths} th` : debtLabel} type={debtMonths >= 2 ? 'rose' : 'gray'} />
        </View>
        <View style={styles.dinfo}>
           <Text style={styles.dtname}>{item.tenant || 'Khách thuê'}</Text>
           <Text style={styles.damount}>{Number(item.totalDebt).toLocaleString('vi')} đ</Text>
           <Text style={styles.dmeta}>{isSent ? 'Đã gửi hóa đơn' : 'Chưa gửi hóa đơn'}</Text>
        </View>
        <View style={styles.dcol3}>
           {isSent ? (
             <TouchableOpacity style={[styles.dsend, { backgroundColor: COLORS.pr }]} onPress={() => {}}>
               <Text style={styles.dsendTxt}>Thu tiền</Text>
             </TouchableOpacity>
           ) : (
             <TouchableOpacity style={styles.dsend} onPress={() => {}}>
               <Text style={styles.dsendTxt}>Gửi bill</Text>
             </TouchableOpacity>
           )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
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
              <TouchableOpacity style={[styles.seg, styles.segOn]}><Text style={[styles.segTxt, styles.segTxtOn]}>Tất cả ({debtRooms.length})</Text></TouchableOpacity>
              <TouchableOpacity style={styles.seg}><Text style={styles.segTxt}>Chưa gửi ({debtRooms.length - sentCount})</Text></TouchableOpacity>
              <TouchableOpacity style={styles.seg}><Text style={styles.segTxt}>Đã gửi ({sentCount})</Text></TouchableOpacity>
            </View>
            <View style={styles.dlist}>
               {debtRooms.map(item => <View key={item.id}>{renderDebtItem({ item })}</View>)}
            </View>
            <Button title={`Gửi tất cả hóa đơn (${debtRooms.length - sentCount})`} icon={SendIcon} onPress={() => {}} full style={{ marginTop: 4 }} />
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
