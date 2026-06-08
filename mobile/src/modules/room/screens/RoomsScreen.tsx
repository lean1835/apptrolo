// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../../../styles/Theme';
import { PlusIcon, DoorIcon, ChevronIcon, AlertIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Badge } from '../../../components/Common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const RoomsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const highlightNeedsBill = params.highlightNeedsBill === 'true';
  
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [highlightedRooms, setHighlightedRooms] = useState(new Set());

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, billsRes] = await Promise.all([
        axiosInstance.get('/rooms'),
        axiosInstance.get('/bills').catch(() => ({ data: [] }))
      ]);
      const data = roomsRes.data;
      const fetchedBills = billsRes.data || [];
      setBills(fetchedBills);

      if (highlightNeedsBill) {
         setShowHighlight(true);
         const now = new Date();
         const thisMonth = now.getMonth();
         const thisYear = now.getFullYear();
         const roomsWithBill = new Set(fetchedBills.filter(b => new Date(b.date).getMonth() === thisMonth && new Date(b.date).getFullYear() === thisYear).map(b => b.roomId));
         const roomsWithReading = new Set();
         data.forEach(r => {
            if (r.meterReadings?.some(m => new Date(m.date).getMonth() === thisMonth && new Date(m.date).getFullYear() === thisYear)) {
               roomsWithReading.add(r.id);
            }
         });

         const toHighlight = new Set();
         data.forEach(r => {
            if ((r.status === 'occupied' || r.status === 'Occupied') && roomsWithReading.has(r.id) && !roomsWithBill.has(r.id)) {
               toHighlight.add(r.id);
            }
         });
         setHighlightedRooms(toHighlight);
      }

      setRooms(data);
      setFilteredRooms(data);
    } catch (err) {
      console.error('Fetch rooms error:', err);
    } finally {
      setLoading(false);
    }
  }, [highlightNeedsBill]);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
      const interval = setInterval(fetchRooms, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }, [fetchRooms])
  );

  useEffect(() => {
    const applyFilter = () => {
      let filtered = rooms.filter(r => 
        r.name.toLowerCase().includes(search.toLowerCase()) || 
        (r.tenant && r.tenant.toLowerCase().includes(search.toLowerCase()))
      );
      if (filter !== 'all') {
        if (filter === 'debt') {
          filtered = filtered.filter(r => {
            const checkinDateStr = r.checkin || '';
            const roomBills = bills.filter(b => b.roomId === r.id && (!checkinDateStr || b.date >= checkinDateStr));
            const unpaidCount = roomBills.filter(b => !b.collected).length;
            return unpaidCount > 0 || (r.status || '').toLowerCase() === 'debt';
          });
        } else {
          filtered = filtered.filter(r => (r.status || '').toLowerCase() === filter.toLowerCase());
        }
      }
      // Add "Add Room" placeholder at the end
      setFilteredRooms([...filtered, { id: 'add', isAdd: true }]);
    };
    applyFilter();
  }, [search, filter, rooms, bills]);

  const renderRoom = ({ item }) => {
    if (item.isAdd) {
      return (
        <TouchableOpacity style={[styles.rcard, styles.rcardAdd]} onPress={() => router.push('/add-room')}>
          <View style={styles.raddIcoWrap}>
            <PlusIcon size={24} color={COLORS.pr} />
          </View>
          <Text style={styles.raddTxtGrid}>Thêm phòng</Text>
        </TouchableOpacity>
      );
    }

    const statusCls = styles[`rcard-${item.status}`] || styles['rcard-emp'];
    const iconBg = item.status === 'empty' ? COLORS.g4 : item.status === 'debt' ? COLORS.rose : COLORS.pr;
    
    const checkinDateStr = item.checkin || '';
    const roomBills = bills.filter(b => b.roomId === item.id && (!checkinDateStr || b.date >= checkinDateStr));
    const unpaidCount = roomBills.filter(b => !b.collected).length;
    
    let isDebt = false;
    let unpaidMonths = 0;
    const isOccupied = item.status === 'occupied' || item.status === 'Occupied' || item.status === 'debt' || item.status === 'Debt';
    if (isOccupied && item.checkin && unpaidCount > 0) {
      const checkinDate = new Date(item.checkin);
      const now = new Date();
      if (!isNaN(checkinDate.getTime())) {
        const diffTime = Math.abs(now - checkinDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        unpaidMonths = Math.floor(diffDays / 30);
        if (unpaidMonths >= 1) {
          isDebt = true;
        }
      }
    }

    const parseDate = (dateStr) => {
        if (!dateStr) return new Date();
        if (typeof dateStr !== 'string') return new Date(dateStr);
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            return new Date(y, m, d);
        }
        return new Date(dateStr);
    };

    const getEarlyWarningInfo = () => {
        if (!item.checkin) return { isEarly: false, expectedDate: null };
        const checkinDate = parseDate(item.checkin);
        if (isNaN(checkinDate.getTime())) return { isEarly: false, expectedDate: null };
        
        let latestDate = new Date(checkinDate);
        if (item.meterReadings && item.meterReadings.length > 0) {
            item.meterReadings.forEach(r => {
                const d = parseDate(r.date);
                if (!isNaN(d.getTime()) && d > latestDate) {
                    latestDate = d;
                }
            });
        }
        
        const expectedDate = new Date(latestDate);
        expectedDate.setMonth(expectedDate.getMonth() + 1);
        expectedDate.setDate(checkinDate.getDate());
        
        const allowedStart = new Date(expectedDate);
        allowedStart.setDate(allowedStart.getDate() - 3);
        
        const today = new Date();
        const isEarly = today < allowedStart;
        
        return { isEarly, expectedDate };
    };
    const { isEarly } = getEarlyWarningInfo();
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const hasReading = item.meterReadings?.some(m => {
      const d = parseDate(m.date);
      return (!checkinDateStr || m.date >= checkinDateStr) && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    
    const isOccupiedVal = item.status === 'occupied' || item.status === 'Occupied';
    const showEarlyWarning = isOccupiedVal && isEarly && !hasReading;

    const unpaidBills = roomBills.filter(b => !b.collected);
    const inDebtStatus = item.status === 'debt' || item.status === 'Debt' || unpaidBills.length > 0;
    
    let showReminderTag = false;
    if (isOccupiedVal && item.checkin && !hasReading && !inDebtStatus) {
        const { expectedDate } = getEarlyWarningInfo();
        if (expectedDate) {
            const today = new Date();
            const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const expDate = new Date(expectedDate.getFullYear(), expectedDate.getMonth(), expectedDate.getDate());
            
            const diffTime = expDate.getTime() - todayDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 3) {
                showReminderTag = true;
            }
        }
    }

    const isHighlighted = showHighlight && highlightedRooms.has(item.id);
    const handlePress = () => {
      if (isHighlighted) {
        router.push({ pathname: '/bill', params: { id: item.id } });
      } else {
        router.push({ pathname: '/room-detail', params: { id: item.id } });
      }
    };

    return (
      <TouchableOpacity 
        style={[styles.rcard, statusCls]} 
        onPress={handlePress}
      >
        <View style={[styles.rcardIco, { backgroundColor: iconBg }]}>
          <DoorIcon size={16} color="#fff" />
        </View>
        <Text style={styles.rnum}>{item.name}</Text>
        <Text style={styles.rname} numberOfLines={1}>{item.status === 'empty' ? '— Trống —' : item.tenant}</Text>
        <Text style={styles.rprice}>{Number(item.price).toLocaleString('vi')} đ/th</Text>
        <View style={{ marginTop: 5, flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
          <Badge 
            label={item.status === 'occupied' ? 'Có khách' : item.status === 'empty' ? 'Trống' : item.status === 'debt' ? 'Nợ tiền' : 'Bảo trì'} 
            type={item.status === 'occupied' ? 'pr' : item.status === 'empty' ? 'gray' : item.status === 'debt' ? 'rose' : 'amber'} 
          />
          {showEarlyWarning && (
            <Badge label="Chưa đến ngày ghi" type="amber" />
          )}
          {showReminderTag && (
            <Badge label="Nhắc ghi điện nước" type="amber" />
          )}
        </View>
        {isDebt ? (
          <View style={styles.overdueBadge}>
             <Text style={styles.overdueTxt}>
                {unpaidMonths === 1 ? 'Đang nợ' : `Nợ ${unpaidMonths} th`}
             </Text>
          </View>
        ) : isHighlighted ? (
          <View style={styles.highlightBadge}>
             <AlertIcon size={11} color="#ef4444" strokeWidth={3} />
             <Text style={styles.highlightTxt}>CHƯA GỬI</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topbar, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.tbtitle}>Danh sách phòng</Text>
      </View>
      
      <View style={styles.filterSection}>
        <View style={styles.searchWrap}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Tìm phòng, tên khách..." 
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
      
      <View style={styles.statusFilters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusFiltersScroll}>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'occupied', label: 'Có khách' },
            { id: 'empty', label: 'Trống' },
            { id: 'debt', label: 'Nợ tiền' },
            { id: 'maintenance', label: 'Bảo trì' }
          ].map(opt => (
            <TouchableOpacity 
              key={opt.id}
              style={[styles.filterChip, filter === opt.id && styles.filterChipActive]}
              onPress={() => setFilter(opt.id)}
            >
              <Text style={[styles.filterChipText, filter === opt.id && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredRooms}
        renderItem={renderRoom}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          loading ? <ActivityIndicator color={COLORS.pr} style={{ marginVertical: 20 }} /> : null
        }
      />
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
  filterSection: {
    padding: 8,
    paddingHorizontal: 13,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.g5,
    flexDirection: 'row',
    gap: 8,
  },
  searchWrap: {
    flex: 1,
  },
  searchInput: {
    borderWidth: 1.5,
    borderColor: COLORS.g5,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 11,
    fontSize: 14,
    backgroundColor: COLORS.g6,
  },
  filterBtn: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.g5,
    borderRadius: 10,
    backgroundColor: COLORS.g6,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.g1,
    fontWeight: '600',
  },
  list: {
    paddingVertical: 14,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  rcard: {
    backgroundColor: COLORS.white,
    width: '47%',
    borderRadius: 14,
    padding: 12,
    ...SHADOWS.sh,
    borderTopWidth: 3,
    position: 'relative',
  },
  'rcard-occupied': { borderTopColor: COLORS.pr },
  'rcard-empty': { borderTopColor: COLORS.g5 },
  'rcard-debt': { borderTopColor: COLORS.rose },
  'rcard-maintenance': { borderTopColor: COLORS.amber },
  rcardIco: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  rnum: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.g1,
  },
  rname: {
    fontSize: 11,
    color: COLORS.g3,
    marginTop: 2,
    fontWeight: '600',
  },
  rprice: {
    fontSize: 11,
    color: COLORS.g2,
    fontWeight: '700',
    marginTop: 4,
  },
  highlightBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    borderWidth: 1.2,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    elevation: 3,
    shadowColor: '#ef4444',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2
  },
  highlightTxt: {
    color: '#b91c1c',
    fontSize: 8.5,
    fontWeight: '900',
  },
  rcardAdd: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS['pr-l'],
    backgroundColor: COLORS['pr-ll'],
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2, // Overriding the 3px border from rcard
  },
  raddIcoWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS['pr-l'],
    marginBottom: 8,
  },
  raddTxtGrid: {
    fontSize: 12,
    color: COLORS.pr,
    fontWeight: '800',
  },
  statusFilters: {
    backgroundColor: COLORS.white,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.g5,
  },
  statusFiltersScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.g6,
    borderWidth: 1,
    borderColor: COLORS.g5,
  },
  filterChipActive: {
    backgroundColor: COLORS['pr-ll'],
    borderColor: COLORS.pr,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.g3,
  },
  filterChipTextActive: {
    color: COLORS.pr,
  },
  overdueBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#ef4444',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3
  },
  overdueTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase'
  },
});

export default RoomsScreen;

