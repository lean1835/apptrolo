import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SIZES } from '../styles/Theme';
import { BellIcon, BoltIcon, SendIcon, MoneyIcon, CheckIcon, DoorIcon, PlusIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { useFocusEffect, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [data, setData] = useState({
    lodge: { name: 'Đang tải...' },
    stats: { occ: 0, unc: 0, emp: 0 },
    revenue: 0,
    activities: [],
    notifications: [],
    onboardingDone: true,
    roomsNeedBill: 0,
  });
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff/60000)}p trước`;
    if (date.toDateString() === now.toDateString()) return 'Hôm nay';
    return date.toLocaleDateString('vi', { day: '2-digit', month: '2-digit' });
  };

  const fetchData = useCallback(async () => {
    try {
      const getLodge = axiosInstance.get('/lodge').catch(() => ({ data: { name: 'Nhà trọ' } }));
      const getRooms = axiosInstance.get('/rooms').catch(() => ({ data: [] }));
      const getBills = axiosInstance.get('/bills').catch(() => ({ data: [] }));
      const getActivities = axiosInstance.get('/activities').catch(() => ({ data: [] }));

      const [lodgeRes, roomsRes, billsRes, actRes] = await Promise.all([getLodge, getRooms, getBills, getActivities]);
      
      const rooms = roomsRes.data || [];
      const bills = billsRes.data || [];
      
      const occ = rooms.filter(r => r.status === 'occupied' || r.status === 'Occupied').length;
      const emp = rooms.filter(r => r.status === 'empty' || r.status === 'Empty').length;
      const debt = rooms.filter(r => r.status === 'debt' || r.status === 'Debt').length;
      
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const collectedThisMonth = bills
        .filter(b => b.collected && new Date(b.date).getMonth() === thisMonth && new Date(b.date).getFullYear() === thisYear)
        .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

      const pendingBillsCount = bills.filter(b => !b.collected).length;
      
      const roomsWithBill = new Set(bills.filter(b => new Date(b.date).getMonth() === thisMonth).map(b => b.roomId));
      const roomsWithReading = new Set();
      rooms.forEach(r => {
        if (r.meterReadings?.some(m => new Date(m.date).getMonth() === thisMonth)) {
          roomsWithReading.add(r.id);
        }
      });
      
      const occRooms = rooms.filter(r => r.status === 'occupied' || r.status === 'Occupied');
      const roomsNeedMeter = occRooms.filter(r => !roomsWithReading.has(r.id)).length;
      const roomsNeedBill = occRooms.filter(r => roomsWithReading.has(r.id) && !roomsWithBill.has(r.id)).length;

      const realActivities = (actRes.data || []).map(act => ({
          txt: act.txt,
          type: act.type,
          collected: act.collected,
          time: getTimeAgo(new Date(act.time))
      }));

      setData({
        lodge: lodgeRes.data,
        stats: { occ, unc: debt, emp },
        revenue: collectedThisMonth,
        pendingBills: pendingBillsCount,
        roomsNeedMeter: roomsNeedMeter,
        roomsNeedBill: roomsNeedBill,
        activities: realActivities,
        notifications: [],
        onboardingDone: true
      });
    } catch (err) {
      console.error('Fetch home data error:', err);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      const interval = setInterval(fetchData, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }, [fetchData])
  );

  const formatCurrency = (val) => Number(val).toLocaleString('vi') + ' đ';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#166534', '#16a34a', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroHeader}>
          <Text style={styles.hlodge}>{data.lodge.name}</Text>
          <TouchableOpacity style={styles.bellBtn} onPress={() => {}}>
            <BellIcon size={24} color="#fff" />
            {data.notifications.length > 0 && <View style={styles.bellDot}><Text style={styles.bellTxt}>{data.notifications.length}</Text></View>}
          </TouchableOpacity>
        </View>
        <Text style={styles.hmonth}>Tháng 3 / 2026</Text>
        <Text style={styles.hamount}>{formatCurrency(data.revenue)}</Text>
        <Text style={styles.hlabel}>Tổng đã thu tháng này</Text>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statrow}>
          <View style={[styles.statbox, styles.statboxGrn]}>
            <Text style={styles.sval}>{data.stats.occ}</Text>
            <Text style={styles.slbl2}>Có khách</Text>
          </View>
          <View style={[styles.statbox, styles.statboxRose]}>
            <Text style={styles.sval}>{data.stats.unc}</Text>
            <Text style={styles.slbl2}>Chưa thu</Text>
          </View>
          <View style={[styles.statbox, styles.statboxAmb]}>
            <Text style={styles.sval}>{data.stats.emp}</Text>
            <Text style={styles.slbl2}>Trống</Text>
          </View>
        </View>

        <View style={styles.actionCards}>
          <ActionCard 
            icon={BoltIcon} 
            bg="#16a34a" 
            title="Ghi chỉ số điện nước" 
            sub={data.roomsNeedMeter === 0 ? "Tất cả đã ghi ✓" : `Còn ${data.roomsNeedMeter} phòng chưa ghi`} 
            badge={data.roomsNeedMeter === 0 ? "Xong" : `${data.roomsNeedMeter} p`} 
            badgeBg={data.roomsNeedMeter === 0 ? "#dcfce7" : "#fee2e2"} 
            badgeColor={data.roomsNeedMeter === 0 ? "#15803d" : "#b91c1c"} 
            onPress={() => router.navigate({ pathname: '/rooms', params: { highlightNeedsMeter: 'true' } })}
          />
          <ActionCard 
            icon={SendIcon} 
            bg="#0284c7" 
            title="Gửi hóa đơn" 
            sub={data.roomsNeedBill === 0 ? "Chưa có hóa đơn mới" : `Có ${data.roomsNeedBill} phòng chờ gửi`} 
            badge={data.roomsNeedBill === 0 ? "Xong" : `${data.roomsNeedBill} p`} 
            badgeBg={data.roomsNeedBill === 0 ? "#e0f2fe" : "#e0f2fe"} 
            badgeColor={data.roomsNeedBill === 0 ? "#075985" : "#0284c7"} 
            onPress={() => router.navigate({ pathname: '/rooms', params: { highlightNeedsBill: 'true' } })}
          />
          <ActionCard 
            icon={MoneyIcon} 
            bg="#d97706" 
            title="Thu tiền" 
            sub={data.pendingBills === 0 ? "Đã thu hết tháng này ✓" : `Cần thu ${data.pendingBills} hoá đơn`} 
            badge={data.pendingBills === 0 ? "Xong" : `${data.pendingBills} bill`} 
            badgeBg={data.pendingBills === 0 ? "#fef3c7" : "#ffedd5"} 
            badgeColor={data.pendingBills === 0 ? "#92400e" : "#ea580c"} 
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectit}>Hoạt động gần đây</Text>
          {data.activities.length > 0 ? data.activities.map((act, idx) => {
             let IconCmp = CheckIcon;
             let bgStr = "#f3f4f6";
             let colStr = "#6b7280";
             if (act.type === 'bill') {
               IconCmp = MoneyIcon; bgStr = "#fef3c7"; colStr = "#d97706";
             } else if (act.type === 'meter') {
               IconCmp = BoltIcon; bgStr = "#dcfce7"; colStr = "#16a34a";
             } else if (act.type === 'member') {
               IconCmp = PlusIcon; bgStr = "#f3e8ff"; colStr = "#a855f7";
             } else if (act.type === 'room') {
               IconCmp = DoorIcon; bgStr = "#e0f2fe"; colStr = "#0284c7";
             }
             return (
               <ActivityItem 
                  key={idx} 
                  icon={IconCmp} 
                  bg={bgStr} 
                  color={colStr} 
                  txt={act.txt} 
                  time={act.time} 
               />
             );
          }) : <Text style={styles.asub}>Chưa có hoạt động nào</Text>}
        </View>
      </ScrollView>
    </View>
  );
};

const ActionCard = ({ icon: Icon, bg, title, sub, badge, badgeBg, badgeColor, onPress }) => (
  <TouchableOpacity style={styles.acard} onPress={onPress}>
    <View style={[styles.acardIcon, { backgroundColor: bg }]}>
      <Icon size={22} color="#fff" />
    </View>
    <View style={styles.abody}>
      <Text style={styles.atitle}>{title}</Text>
      <Text style={styles.asub}>{sub}</Text>
    </View>
    <View style={[styles.abadge, { backgroundColor: badgeBg }]}>
      <Text style={[styles.abadgeTxt, { color: badgeColor }]}>{badge}</Text>
    </View>
  </TouchableOpacity>
);

const ActivityItem = ({ icon: Icon, bg, color, txt, time }) => (
  <View style={styles.actitem}>
    <View style={[styles.actdot, { backgroundColor: bg, color: color }]}>
       <Icon size={14} color={color} />
    </View>
    <Text style={styles.acttxt}>{txt}</Text>
    <Text style={styles.acttime}>{time}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  hero: {
    paddingTop: 50,
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  hlodge: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bellBtn: {
    width: 38,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    backgroundColor: '#ef4444',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#15803d',
  },
  bellTxt: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },
  hmonth: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginTop: 3,
  },
  hamount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  hlabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
    fontWeight: '600',
  },
  scroll: {
    padding: 14,
    gap: 12,
  },
  statrow: {
    flexDirection: 'row',
    gap: 8,
  },
  statbox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    paddingBottom: 10,
    ...SHADOWS.sh,
    position: 'relative',
    borderBottomWidth: 3,
  },
  statboxGrn: { borderBottomColor: COLORS.pr },
  statboxRose: { borderBottomColor: COLORS.rose },
  statboxAmb: { borderBottomColor: COLORS.amber },
  sval: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.g1,
  },
  slbl2: {
    fontSize: 10,
    color: COLORS.g3,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  actionCards: {
    gap: 9,
  },
  acard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    ...SHADOWS.sh,
  },
  acardIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abody: {
    flex: 1,
  },
  atitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.g1,
  },
  asub: {
    fontSize: 12,
    color: COLORS.g3,
    marginTop: 1,
    fontWeight: '600',
  },
  abadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 11,
  },
  abadgeTxt: {
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    ...SHADOWS.sh,
  },
  sectit: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.g1,
    marginBottom: 11,
  },
  actitem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.g6,
  },
  actdot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acttxt: {
    flex: 1,
    fontSize: 12,
    color: COLORS.g2,
    fontWeight: '600',
  },
  acttime: {
    fontSize: 10,
    color: COLORS.g4,
    fontWeight: '600',
  },
});

export default HomeScreen;
