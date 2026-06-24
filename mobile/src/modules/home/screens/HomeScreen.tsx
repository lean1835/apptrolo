// @ts-nocheck
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, RefreshControl, Modal, Animated, Platform, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, SIZES } from '../../../styles/Theme';
import { BellIcon, BoltIcon, SendIcon, MoneyIcon, CheckIcon, DoorIcon, PlusIcon, CalculatorIcon, ChevronIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  if (typeof dateStr !== 'string') return new Date(dateStr);
  if (dateStr.includes('T')) {
    return new Date(dateStr);
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
};

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState({
    lodge: { name: 'Đang tải...' },
    stats: { occ: 0, unc: 0, emp: 0 },
    revenue: 0,
    unpaidSum: 0,
    activities: [],
    notifications: [],
    onboardingDone: true,
    roomsNeedBill: 0,
    pendingBills: 0,
    roomsNeedMeter: 0,
  });
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const notiAnim = useRef(new Animated.Value(0)).current;
  const lastScheduledDataRef = useRef('');

  const scheduleFutureNotifications = useCallback(async (rooms, bills) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const today = new Date();
      const thisMonth = today.getMonth();
      const thisYear = today.getFullYear();
      const thisMonthLabel = thisMonth + 1;

      for (const room of rooms) {
        const checkinDateStr = room.checkin || '';
        const isOcc = room.status === 'occupied' || room.status === 'Occupied' || room.status === 'debt' || room.status === 'Debt';
        if (!isOcc) continue;

        const hasReading = room.meterReadings?.some(m => {
          const d = parseDate(m.date);
          return (!checkinDateStr || m.date >= checkinDateStr) && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });

        if (hasReading) continue;

        if (!room.checkin) continue;
        const checkinDate = parseDate(room.checkin);
        if (isNaN(checkinDate.getTime())) continue;

        let latestDate = new Date(checkinDate);
        if (room.meterReadings && room.meterReadings.length > 0) {
          room.meterReadings.forEach(r => {
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
        allowedStart.setHours(8, 0, 0, 0);

        const secondsUntilDue = Math.floor((allowedStart.getTime() - today.getTime()) / 1000);
        if (secondsUntilDue > 0) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Đến hạn ghi điện nước',
              body: `Phòng ${room.name} sắp đến hạn ghi chỉ số điện nước Tháng ${thisMonthLabel}.`,
              sound: true,
              priority: Notifications.AndroidNotificationPriority.HIGH,
              channelId: 'default',
            },
            trigger: { seconds: secondsUntilDue },
          });
        }
      }
    } catch (err) {
      console.error('Error scheduling future notifications:', err);
    }
  }, []);

  const requestNotificationPermission = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }
    return finalStatus === 'granted';
  };

  const triggerLocalNotification = async (title, body, notiId) => {
    try {
      const notifiedStr = await AsyncStorage.getItem('notified_noti_ids');
      const notified = notifiedStr ? JSON.parse(notifiedStr) : [];
      if (notified.includes(notiId)) return;

      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId: 'default',
        },
        trigger: null,
      });

      notified.push(notiId);
      await AsyncStorage.setItem('notified_noti_ids', JSON.stringify(notified));
    } catch (err) {
      console.error('Trigger notification error:', err);
    }
  };

  useEffect(() => {
    const setupNotifications = async () => {
      await requestNotificationPermission();
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Mặc định',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#16a34a',
          sound: 'default',
        });
      }
    };
    setupNotifications();
  }, []);

  const openNotiModal = () => {
    setShowNotificationModal(true);
    Animated.spring(notiAnim, {
      toValue: 1,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const closeNotiModal = () => {
    Animated.timing(notiAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setShowNotificationModal(false);
    });
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff/60000)}p trước`;
    if (diff < 86400000 && now.getDate() === date.getDate()) {
      return `${Math.floor(diff/3600000)}h trước`;
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month} ${hours}:${minutes}`;
  };

  const fetchData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const getLodge = axiosInstance.get('/lodge').catch(() => ({ data: { name: 'Nhà trọ' } }));
      const getRooms = axiosInstance.get('/rooms').catch(() => ({ data: [] }));
      const getBills = axiosInstance.get('/bills').catch(() => ({ data: [] }));
      const getActivities = axiosInstance.get('/activities').catch(() => ({ data: [] }));
      const getPrices = axiosInstance.get('/utility-prices').catch(() => ({ data: { elec: 3500, water: 15000, wifi: 100000, garbage: 20000, waterMode: 'meter', waterFixed: 150000 } }));

      const [lodgeRes, roomsRes, billsRes, actRes, pricesRes] = await Promise.all([getLodge, getRooms, getBills, getActivities, getPrices]);
      
      const rooms = roomsRes.data || [];
      const bills = billsRes.data || [];
      const prices = pricesRes.data || { wifi: 0, garbage: 0 };

      const occ = rooms.filter(r => r.status === 'occupied' || r.status === 'Occupied' || r.status === 'debt' || r.status === 'Debt').length;
      const emp = rooms.filter(r => r.status === 'empty' || r.status === 'Empty').length;
      
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      
      const collectedThisMonth = bills
        .filter(b => {
          if (!b.collected) return false;
          const parts = (b.date || '').split('-');
          if (parts.length < 2) return false;
          return parseInt(parts[0], 10) === thisYear && (parseInt(parts[1], 10) - 1) === thisMonth;
        })
        .reduce((sum, b) => sum + (Number(b.total) || 0), 0);

      const pendingBills = bills.filter(b => {
        if (b.collected) return false;
        // Only count bills for the current month
        const parts = (b.date || '').split('-');
        if (parts.length < 2) return false;
        if (parseInt(parts[0], 10) !== thisYear || (parseInt(parts[1], 10) - 1) !== thisMonth) return false;
        const r = rooms.find(room => room.id === b.roomId || room.id === b.room);
        if (!r) return false;
        const isOcc = r.status === 'occupied' || r.status === 'Occupied' || r.status === 'debt' || r.status === 'Debt';
        if (!isOcc) return false;
        const checkinDateStr = r.checkin || '';
        return !checkinDateStr || b.date >= checkinDateStr;
      });
      
      const pendingBillsCount = pendingBills.length;
      
      let unpaidSum = 0;
      pendingBills.forEach(b => {
        const r = rooms.find(room => room.id === b.roomId || room.id === b.room);
        if (!r) return;
        
        // Find unpaid bills up to the current month/year
        const roomBills = bills.filter(bill => bill.roomId === r.id || bill.room === r.id);
        const unpaidBillsUpToSelected = roomBills.filter(bill => {
          if (bill.collected) return false;
          const parts = bill.date.split('-');
          if (parts.length !== 3) return false;
          const by = parseInt(parts[0], 10);
          const bm = parseInt(parts[1], 10);
          return by < thisYear || (by === thisYear && bm <= (thisMonth + 1));
        });

        // Determine debtMonths (number of unpaid months starting from checkin up to current billing month)
        let debtMonths = 1;
        if (r.checkin) {
          const checkinDate = parseDate(r.checkin);
          if (!isNaN(checkinDate.getTime())) {
            const checkinYear = checkinDate.getFullYear();
            const checkinMonth = checkinDate.getMonth() + 1;
            debtMonths = Math.max(1, (thisYear - checkinYear) * 12 + ((thisMonth + 1) - checkinMonth));
          }
        }

        // Find prior readings (before the earliest unpaid bill month)
        const checkinDateStr = r.checkin || '';
        const filteredReadings = (r.meterReadings || []).filter(mr => !checkinDateStr || mr.date >= checkinDateStr);
        const allSorted = [...filteredReadings].sort((a, b) => a.date.localeCompare(b.date));

        let earliestUnpaidDate = null;
        if (unpaidBillsUpToSelected.length > 0) {
          const sortedUnpaid = [...unpaidBillsUpToSelected].sort((a, b) => a.date.localeCompare(b.date));
          earliestUnpaidDate = sortedUnpaid[0].date;
        }

        let priorReading = null;
        if (earliestUnpaidDate) {
          const earliestParts = earliestUnpaidDate.split('-');
          const earliestY = parseInt(earliestParts[0], 10);
          const earliestM = parseInt(earliestParts[1], 10);
          priorReading = [...allSorted]
            .reverse()
            .find(mr => {
              const parts = mr.date.split('-');
              const ry = parseInt(parts[0], 10);
              const rm = parseInt(parts[1], 10);
              return ry < earliestY || (ry === earliestY && rm < earliestM);
            });
        }

        const pElecValue = priorReading ? priorReading.elec : (r.ep || 0);
        const pWaterValue = priorReading ? priorReading.water : (r.wp || 0);

        const thisMonthReadings = allSorted.find(mr => {
          const [y, m] = mr.date.split('-');
          return parseInt(y, 10) === thisYear && parseInt(m, 10) === (thisMonth + 1);
        });

        const latestReading = thisMonthReadings || (allSorted.length > 0 ? allSorted[allSorted.length - 1] : null);
        const cElec = latestReading ? latestReading.elec : pElecValue;
        const cWater = latestReading ? latestReading.water : pWaterValue;

        const eUse = Math.max(0, cElec - pElecValue);
        const wUse = Math.max(0, cWater - pWaterValue);

        const eAmt = eUse * (prices.elec || 0);
        const rent = (parseFloat(r.price) || 0) * debtMonths;
        const fees = ((prices.wifi || 0) + (prices.garbage || 0)) * debtMonths;
        const wAmt = prices.waterMode === 'fixed' ? (prices.waterFixed || 0) * debtMonths : (wUse * (prices.water || 0));
        const prepaid = r.contractPrepaid > 0 ? rent : 0;

        const calculatedTotal = rent + eAmt + wAmt + fees - prepaid;
        unpaidSum += calculatedTotal;
      });
      
      const roomsWithBill = new Set();
      bills.forEach(b => {
        const r = rooms.find(room => room.id === b.roomId || room.id === b.room);
        const checkinDateStr = r?.checkin || '';
        if (new Date(b.date).getMonth() === thisMonth && (!checkinDateStr || b.date >= checkinDateStr)) {
          roomsWithBill.add(b.roomId || b.room);
        }
      });



      const isMeterReadingDue = (room) => {
        if (!room.checkin) return false;
        const checkinDate = parseDate(room.checkin);
        if (isNaN(checkinDate.getTime())) return false;
        
        let latestDate = new Date(checkinDate);
        if (room.meterReadings && room.meterReadings.length > 0) {
          room.meterReadings.forEach(r => {
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
        return today >= allowedStart;
      };

      const occRooms = rooms.filter(r => r.status === 'occupied' || r.status === 'Occupied' || r.status === 'debt' || r.status === 'Debt');
      const roomsNeedMeter = occRooms.filter(r => {
        const hasReading = r.meterReadings?.some(m => {
          const d = parseDate(m.date);
          const checkinDateStr = r.checkin || '';
          return (!checkinDateStr || m.date >= checkinDateStr) && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });
        return !hasReading && isMeterReadingDue(r);
      }).length;

      const roomsWithReading = new Set();
      rooms.forEach(r => {
        const checkinDateStr = r.checkin || '';
        if (r.meterReadings?.some(m => new Date(m.date).getMonth() === thisMonth && (!checkinDateStr || m.date >= checkinDateStr))) {
          roomsWithReading.add(r.id);
        }
      });
      const roomsNeedBill = occRooms.filter(r => roomsWithReading.has(r.id) && !roomsWithBill.has(r.id)).length;

      const realActivities = (actRes.data || []).map(act => ({
          txt: act.txt,
          type: act.type,
          collected: act.collected,
          time: getTimeAgo(parseDate(act.time))
      }));

      const generatedNotifications = [];
      const thisMonthLabel = thisMonth + 1;

      // 1. Meter reading warnings
      rooms.forEach(room => {
        const checkinDateStr = room.checkin || '';
        const isOcc = room.status === 'occupied' || room.status === 'Occupied' || room.status === 'debt' || room.status === 'Debt';
        if (!isOcc) return;

        const hasReading = room.meterReadings?.some(m => {
          const d = parseDate(m.date);
          return (!checkinDateStr || m.date >= checkinDateStr) && d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });

        if (!hasReading && isMeterReadingDue(room)) {
          const notiId = `meter_${room.id}_${thisYear}_${thisMonth}`;
          generatedNotifications.push({
            id: `meter_${room.id}`,
            title: `Đến hạn ghi điện nước`,
            desc: `Phòng ${room.name} chưa ghi chỉ số điện nước Tháng ${thisMonthLabel}.`,
            type: 'meter',
            roomId: room.id
          });
          
          triggerLocalNotification(
            `Đến hạn ghi điện nước`,
            `Phòng ${room.name} chưa ghi chỉ số điện nước Tháng ${thisMonthLabel}.`,
            notiId
          );
        }
      });

      // 2. Unpaid bill warnings
      pendingBills.forEach(bill => {
        const room = rooms.find(r => r.id === bill.roomId || r.id === bill.room);
        if (room) {
          const notiId = `bill_${bill.id || bill._id}`;
          generatedNotifications.push({
            id: `bill_${bill.id || bill._id}`,
            title: `Đến hạn thu tiền`,
            desc: `Phòng ${room.name} có hóa đơn chờ thu: ${Number(bill.total).toLocaleString('vi')} đ.`,
            type: 'bill',
            roomId: room.id
          });

          triggerLocalNotification(
            `Đến hạn thu tiền`,
            `Phòng ${room.name} có hóa đơn chờ thu: ${Number(bill.total).toLocaleString('vi')} đ.`,
            notiId
          );
        }
      });

      setData({
        lodge: lodgeRes.data,
        stats: { occ, unc: pendingBillsCount, emp },
        revenue: collectedThisMonth,
        unpaidSum: unpaidSum,
        pendingBills: pendingBillsCount,
        roomsNeedMeter: roomsNeedMeter,
        roomsNeedBill: roomsNeedBill,
        activities: realActivities,
        notifications: generatedNotifications,
        onboardingDone: true
      });

      const currentDataStr = JSON.stringify({ rooms, bills });
      if (currentDataStr !== lastScheduledDataRef.current) {
        lastScheduledDataRef.current = currentDataStr;
        scheduleFutureNotifications(rooms, bills);
      }
    } catch (err) {
      console.error('Fetch home data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(false);
    setRefreshing(false);
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData(false);
    }, [fetchData])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.pr} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  const formatCurrency = (val) => Number(val).toLocaleString('vi') + ' đ';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#14532d', '#15803d', '#16a34a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: Math.max(insets.top + 12, 28) }]}
      >
        <View style={styles.heroHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.hlodge}>{data.lodge.name.toUpperCase()}</Text>
            <Text style={styles.hTitle}>Trang chủ</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={openNotiModal}>
            <BellIcon size={22} color="#fff" />
            {data.notifications.length > 0 && (
              <View style={styles.bellDot}>
                <Text style={styles.bellTxt}>{data.notifications.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Floating summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>ĐÃ THU THÁNG NÀY</Text>
            <Text style={[styles.summaryValue, { color: COLORS.pr }]}>
              {formatCurrency(data.revenue)}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>CHỜ THU ({data.pendingBills})</Text>
            <Text style={[styles.summaryValue, { color: COLORS.rose }]}>
              {formatCurrency(data.unpaidSum)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics section */}
        <View style={styles.statrow}>
          <View style={[styles.statbox, { backgroundColor: COLORS['pr-l'] }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.sval, { color: COLORS['pr-d'] }]}>{data.stats.occ}</Text>
              <View style={[styles.statIconBadge, { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}>
                <DoorIcon size={14} color={COLORS['pr-d']} />
              </View>
            </View>
            <Text style={[styles.slbl2, { color: COLORS['pr-d'] }]}>Có khách</Text>
          </View>

          <View style={[styles.statbox, { backgroundColor: COLORS['rose-l'] }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.sval, { color: COLORS.rose }]}>{data.stats.unc}</Text>
              <View style={[styles.statIconBadge, { backgroundColor: 'rgba(225, 29, 72, 0.12)' }]}>
                <MoneyIcon size={14} color={COLORS.rose} />
              </View>
            </View>
            <Text style={[styles.slbl2, { color: COLORS.rose }]}>Chưa thu</Text>
          </View>

          <View style={[styles.statbox, { backgroundColor: '#f1f5f9' }]}>
            <View style={styles.statHeader}>
              <Text style={[styles.sval, { color: '#475569' }]}>{data.stats.emp}</Text>
              <View style={[styles.statIconBadge, { backgroundColor: 'rgba(71, 85, 105, 0.12)' }]}>
                <DoorIcon size={14} color="#475569" />
              </View>
            </View>
            <Text style={[styles.slbl2, { color: '#475569' }]}>Trống</Text>
          </View>
        </View>

        {/* Todo tasks card */}
        <View style={styles.todoCard}>
          <Text style={styles.todoTitle}>VIỆC CẦN LÀM THÁNG NÀY</Text>
          <Text style={styles.todoSub}>{`Hóa đơn Tháng ${new Date().getMonth() + 1}/${new Date().getFullYear()}`}</Text>
          <View style={styles.todoList}>
            <TouchableOpacity 
              style={styles.todoItem} 
              onPress={() => router.navigate({ pathname: '/debt', params: { filter: 'unsent' } })}
            >
              <View style={[styles.todoIconContainer, { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                <CalculatorIcon size={20} color={COLORS.pr} />
              </View>
              <View style={styles.todoItemContent}>
                <Text style={styles.todoItemTitle}>Chốt số & Lập bill</Text>
                <Text style={styles.todoItemSub}>
                  {data.roomsNeedMeter === 0 ? "Tất cả đã ghi ✓" : `Còn ${data.roomsNeedMeter} phòng cần chốt`}
                </Text>
              </View>
              <ChevronIcon size={16} color={COLORS.g4} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.todoItem} 
              onPress={() => router.navigate({ pathname: '/debt', params: { filter: 'sent' } })}
            >
              <View style={[styles.todoIconContainer, { backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
                <SendIcon size={20} color={COLORS.sky} />
              </View>
              <View style={styles.todoItemContent}>
                <Text style={styles.todoItemTitle}>Gửi hóa đơn</Text>
                <Text style={styles.todoItemSub}>
                  {data.roomsNeedBill === 0 ? "Đã gửi hết ✓" : `Còn ${data.roomsNeedBill} phòng chưa gửi`}
                </Text>
              </View>
              <ChevronIcon size={16} color={COLORS.g4} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.todoItem} 
              onPress={() => router.navigate({ pathname: '/debt', params: { filter: 'sent' } })}
            >
              <View style={[styles.todoIconContainer, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                <MoneyIcon size={20} color={COLORS.amber} />
              </View>
              <View style={styles.todoItemContent}>
                <Text style={styles.todoItemTitle}>Thu tiền phòng</Text>
                <Text style={styles.todoItemSub}>
                  {data.pendingBills === 0 ? "Đã thu hết ✓" : `Còn ${data.pendingBills} hóa đơn chờ thu`}
                </Text>
              </View>
              <ChevronIcon size={16} color={COLORS.g4} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent activities section */}
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
                  isLast={idx === data.activities.length - 1}
               />
             );
          }) : <Text style={styles.asub}>Chưa có hoạt động nào</Text>}
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        visible={showNotificationModal}
        animationType="none"
        transparent
        onRequestClose={closeNotiModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalBackdrop,
              {
                opacity: notiAnim,
              }
            ]}
          >
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={closeNotiModal} 
            />
          </Animated.View>

          <Animated.View 
            style={[
              styles.notiPanel,
              {
                opacity: notiAnim,
                transform: [
                  { scale: notiAnim },
                  {
                    translateX: notiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [150, 0],
                    }),
                  },
                  {
                    translateY: notiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-120, 0],
                    }),
                  },
                ],
              }
            ]}
          >
            <View style={styles.notiHeader}>
              <Text style={styles.notiTitle}>Thông báo</Text>
              <Text style={styles.notiSubtitle}>
                Bạn có {data.notifications.length} thông báo mới
              </Text>
            </View>
            <View style={styles.notiDivider} />

            {data.notifications.length > 0 ? (
              <ScrollView style={styles.notiScroll} showsVerticalScrollIndicator={false}>
                {data.notifications.map((noti) => {
                  const isMeter = noti.type === 'meter';
                  return (
                    <TouchableOpacity
                      key={noti.id}
                      style={styles.notiItemRow}
                      onPress={() => {
                        closeNotiModal();
                        if (isMeter) {
                          router.push({ pathname: '/meter', params: { id: noti.roomId } });
                        } else {
                          router.push({ pathname: '/debt', params: { filter: 'sent' } });
                        }
                      }}
                    >
                      <View style={[styles.notiIconBg, { backgroundColor: isMeter ? '#fffbeb' : '#ffe4e6' }]}>
                        {isMeter ? (
                          <BoltIcon size={16} color="#d97706" />
                        ) : (
                          <MoneyIcon size={16} color="#e11d48" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notiItemTitle}>{noti.title}</Text>
                        <Text style={styles.notiItemDesc}>{noti.desc}</Text>
                      </View>
                      <ChevronIcon size={14} color={COLORS.g4} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.notiEmpty}>
                <Text style={styles.notiEmptyTxt}>✓ Không có thông báo nào mới.</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.notiCloseBtn}
              onPress={closeNotiModal}
            >
              <Text style={styles.notiCloseBtnTxt}>Đóng</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};


const ActivityItem = ({ icon: Icon, bg, color, txt, time, isLast }) => (
  <View style={styles.actitem}>
    <View style={styles.actLeftCol}>
      <View style={[styles.actdot, { backgroundColor: bg }]}>
         <Icon size={14} color={color} />
      </View>
      {!isLast && <View style={styles.actLine} />}
    </View>
    <View style={styles.actContent}>
      <Text style={styles.acttxt}>{txt}</Text>
      <Text style={styles.acttime}>{time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  hero: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  hlodge: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  bellBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    backgroundColor: COLORS.rose,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#15803d',
  },
  bellTxt: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 12,
    ...SHADOWS.sh,
    marginTop: 16,
    marginBottom: -56,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    zIndex: 10,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  summaryDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
    backgroundColor: '#e2e8f0',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  statrow: {
    flexDirection: 'row',
    gap: 8,
  },
  statbox: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    ...SHADOWS.sh,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sval: {
    fontSize: 22,
    fontWeight: '900',
  },
  statIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slbl2: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  todoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.sh,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  todoTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.g1,
    letterSpacing: 0.5,
  },
  todoSub: {
    fontSize: 11,
    color: COLORS.g3,
    marginTop: 2,
    marginBottom: 14,
    fontWeight: '600',
  },
  todoList: {
    gap: 10,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...SHADOWS.sh,
  },
  todoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  todoItemContent: {
    flex: 1,
  },
  todoItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.g1,
  },
  todoItemSub: {
    fontSize: 12,
    color: COLORS.g3,
    marginTop: 2,
    fontWeight: '600',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.sh,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectit: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.g1,
    marginBottom: 16,
  },
  asub: {
    fontSize: 13,
    color: COLORS.g4,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
  actitem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  actLeftCol: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  actdot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  actLine: {
    position: 'absolute',
    top: 32,
    bottom: -16,
    width: 2,
    backgroundColor: '#cbd5e1',
    zIndex: 1,
  },
  actContent: {
    flex: 1,
    paddingBottom: 16,
  },
  acttxt: {
    fontSize: 13,
    color: COLORS.g2,
    fontWeight: '700',
    lineHeight: 18,
  },
  acttime: {
    fontSize: 10,
    color: COLORS.g4,
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  notiPanel: {
    position: 'absolute',
    top: Math.max(Dimensions.get('window').height * 0.08, 76),
    right: 16,
    width: Dimensions.get('window').width - 32,
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOWS.sh2,
    zIndex: 1001,
  },
  notiHeader: {
    marginBottom: 8,
  },
  notiTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  notiSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  notiDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
  },
  notiScroll: {
    maxHeight: 280,
  },
  notiItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  notiIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notiItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  notiItemDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  notiEmpty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  notiEmptyTxt: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
  notiCloseBtn: {
    backgroundColor: COLORS.g6,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  notiCloseBtnTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
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

export default HomeScreen;

