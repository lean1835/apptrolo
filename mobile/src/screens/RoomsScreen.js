import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { COLORS, SHADOWS, SIZES } from '../styles/Theme';
import { PlusIcon, DoorIcon, ChevronIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Badge } from '../components/Common';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const RoomsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const highlightNeedsBill = params.highlightNeedsBill === 'true';
  
  const [rooms, setRooms] = useState([]);
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
        highlightNeedsBill ? axiosInstance.get('/bills').catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);
      const data = roomsRes.data;
      const bills = billsRes.data || [];

      if (highlightNeedsBill) {
         setShowHighlight(true);
         const now = new Date();
         const thisMonth = now.getMonth();
         const thisYear = now.getFullYear();
         const roomsWithBill = new Set(bills.filter(b => new Date(b.date).getMonth() === thisMonth && new Date(b.date).getFullYear() === thisYear).map(b => b.roomId));
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
         setTimeout(() => setShowHighlight(false), 3000);
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
    }, [fetchRooms])
  );

  useEffect(() => {
    const applyFilter = () => {
      let filtered = rooms.filter(r => 
        r.name.toLowerCase().includes(search.toLowerCase()) || 
        (r.tenant && r.tenant.toLowerCase().includes(search.toLowerCase()))
      );
      if (filter !== 'all') {
        filtered = filtered.filter(r => r.status === filter);
      }
      // Add "Add Room" placeholder at the end
      setFilteredRooms([...filtered, { id: 'add', isAdd: true }]);
    };
    applyFilter();
  }, [search, filter, rooms]);

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
    
    return (
      <TouchableOpacity 
        style={[styles.rcard, statusCls]} 
        onPress={() => router.push({ pathname: '/room-detail', params: { id: item.id } })}
      >
        <View style={[styles.rcardIco, { backgroundColor: iconBg }]}>
          <DoorIcon size={16} color="#fff" />
        </View>
        <Text style={styles.rnum}>{item.name}</Text>
        <Text style={styles.rname} numberOfLines={1}>{item.status === 'empty' ? '— Trống —' : item.tenant}</Text>
        <Text style={styles.rprice}>{Number(item.price).toLocaleString('vi')} đ/th</Text>
        <View style={{ marginTop: 5 }}>
          <Badge 
            label={item.status === 'occupied' ? 'Có khách' : item.status === 'empty' ? 'Trống' : item.status === 'debt' ? 'Nợ tiền' : 'Bảo trì'} 
            type={item.status === 'occupied' ? 'pr' : item.status === 'empty' ? 'gray' : item.status === 'debt' ? 'rose' : 'amber'} 
          />
        </View>
        {showHighlight && highlightedRooms.has(item.id) && (
          <View style={styles.highlightBadge}>
             <Text style={styles.highlightTxt}>!</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
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
        <TouchableOpacity style={styles.filterBtn}>
           <Text style={styles.filterText}>{filter === 'all' ? 'Tất cả' : filter}</Text>
        </TouchableOpacity>
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
    width: 22,
    height: 22,
    backgroundColor: '#ef4444',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#ef4444',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3
  },
  highlightTxt: {
    color: '#fff',
    fontSize: 12,
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
});

export default RoomsScreen;
