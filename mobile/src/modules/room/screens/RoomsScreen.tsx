// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../../../styles/Theme';
import { PlusIcon, DoorIcon, ChevronIcon, AlertIcon, SearchIcon } from '../../../assets/Icons';
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
  const [refreshing, setRefreshing] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [highlightedRooms, setHighlightedRooms] = useState(new Set());
 
  const fetchRooms = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  }, [highlightNeedsBill]);
 
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRooms(false);
    setRefreshing(false);
  }, [fetchRooms]);
 
  useFocusEffect(
    useCallback(() => {
      fetchRooms();
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

    let iconBgColor = 'rgba(22, 163, 74, 0.12)';
    let iconColor = COLORS.pr;
    if (item.status === 'empty') {
      iconBgColor = 'rgba(148, 163, 184, 0.12)';
      iconColor = '#64748b';
    } else if (item.status === 'debt') {
      iconBgColor = 'rgba(225, 29, 72, 0.12)';
      iconColor = COLORS.rose;
    } else if (item.status === 'maintenance') {
      iconBgColor = 'rgba(217, 119, 6, 0.12)';
      iconColor = COLORS.amber;
    }
    
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
      router.push({ pathname: '/room-detail', params: { id: item.id } });
    };

    return (
      <TouchableOpacity 
        style={[styles.rcard, item.status === 'empty' && styles.rcardEmpty]} 
        onPress={handlePress}
      >
        <View style={[styles.rcardIco, { backgroundColor: iconBgColor }]}>
          <DoorIcon size={14} color={iconColor} />
        </View>
        <Text style={styles.rnum}>{item.name}</Text>
        <Text style={styles.rname} numberOfLines={1}>{item.status === 'empty' ? '— Trống —' : item.tenant}</Text>
        <Text style={styles.rprice}>Giá: {Number(item.price).toLocaleString('vi')} đ</Text>
        <View style={styles.badgeRow}>
          <Badge 
            label={item.status === 'occupied' ? 'Có khách' : item.status === 'empty' ? 'Trống' : item.status === 'debt' ? 'Nợ tiền' : 'Bảo trì'} 
            type={item.status === 'occupied' ? 'pr' : item.status === 'empty' ? 'gray' : item.status === 'debt' ? 'rose' : 'amber'} 
          />
          {showEarlyWarning && (
            <Badge label="Chưa đến ngày" type="amber" />
          )}
          {showReminderTag && (
            <Badge label="Cần ghi số" type="amber" />
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
             <AlertIcon size={10} color="#e11d48" strokeWidth={3} />
             <Text style={styles.highlightTxt}>CHƯA GỬI</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  if (loading && rooms.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.pr} />
        <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + 10, 24) }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.tbtitle}>Danh sách phòng</Text>
        </View>
        
        <View style={styles.searchSection}>
          <View style={styles.searchBarContainer}>
            <SearchIcon size={16} color={COLORS.g3} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Tìm phòng, tên khách..." 
              placeholderTextColor={COLORS.g4}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.pr]} />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    backgroundColor: COLORS.white,
    ...SHADOWS.sh,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTopRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  tbtitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.g1,
    letterSpacing: -0.3,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 14,
    color: COLORS.g1,
  },
  statusFilters: {
    paddingBottom: 12,
  },
  statusFiltersScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: COLORS.pr,
    borderColor: COLORS.pr,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  list: {
    paddingVertical: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  rcard: {
    backgroundColor: COLORS.white,
    width: '48%',
    borderRadius: 16,
    padding: 14,
    ...SHADOWS.sh,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    position: 'relative',
    gap: 4,
  },
  rcardEmpty: {
    backgroundColor: '#f8fafc',
  },
  rcardIco: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  rnum: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.g1,
  },
  rname: {
    fontSize: 12,
    color: COLORS.g3,
    fontWeight: '600',
  },
  rprice: {
    fontSize: 11,
    color: COLORS.g2,
    fontWeight: '700',
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  highlightBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ffe4e6',
    borderColor: '#f43f5e',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    ...SHADOWS.sh,
  },
  highlightTxt: {
    color: '#be123c',
    fontSize: 8,
    fontWeight: '900',
  },
  rcardAdd: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.25)',
    backgroundColor: 'rgba(22, 163, 74, 0.02)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  raddIcoWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.15)',
    marginBottom: 6,
  },
  raddTxtGrid: {
    fontSize: 12,
    color: COLORS.pr,
    fontWeight: '800',
  },
  overdueBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.rose,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    ...SHADOWS.sh,
  },
  overdueTxt: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
});

export default RoomsScreen;

