import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../../../styles/Theme';
import { BackIcon, DownloadIcon, ShareIcon, AlertTriangleIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Button } from '../../../components/Common';
import { CaptureView, captureRef } from '../../../utils/capture';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useLanguage } from '../../../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Bill {
  id?: string;
  _id?: string;
  date: string;
  total: number;
  collected: boolean;
  sent: boolean;
}

interface MeterReading {
  date: string;
  elec: number;
  water: number;
}

interface Room {
  id?: string;
  _id?: string;
  name: string;
  status: string;
  checkin?: string;
  createdAt?: string;
  price: string | number;
  ep?: number;
  wp?: number;
  contractPrepaid: number;
  bills?: Bill[];
  meterReadings?: MeterReading[];
}

interface UtilityPrices {
  elec?: number;
  water?: number;
  waterMode?: 'fixed' | 'measured';
  waterFixed?: number;
  wifi?: number;
  garbage?: number;
}

interface Lodge {
  name?: string;
  bank?: string;
  bankName?: string;
}

// Pure date parsing function extracted outside the component to prevent recreation on every render
const parseDate = (dateStr: any): Date => {
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

const BillScreen: React.FC = () => {
  const { id, action } = useLocalSearchParams();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  const [room, setRoom] = useState<Room | null>(null);
  const [prices, setPrices] = useState<UtilityPrices | null>(null);
  const [lodge, setLodge] = useState<Lodge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const viewRef = useRef<any>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const resRoom = await axiosInstance.get(`/rooms/${id}`);
        setRoom(resRoom.data);
        
        const resPrices = await axiosInstance.get(`/utility-prices`);
        setPrices(resPrices.data);

        const resLodge = await axiosInstance.get(`/lodge`);
        setLodge(resLodge.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    if (!permissionResponse || permissionResponse.status !== 'granted') {
      requestPermission();
    }
  }, [id]);

  const now = useMemo(() => new Date(), []);

  // 1. Calculate Early Warning Info (Bọc useMemo để tối ưu hóa hiệu năng)
  const earlyWarningInfo = useMemo(() => {
    if (!room) {
      return { isEarly: false, expectedDate: null as Date | null, targetMonth: now.getMonth(), targetYear: now.getFullYear() };
    }
    
    const checkinDateStr = room.checkin || '';
    const filteredBills = (room.bills || []).filter(b => !checkinDateStr || b.date >= checkinDateStr);
    const filteredReadings = (room.meterReadings || []).filter(r => !checkinDateStr || r.date >= checkinDateStr);
    
    const hasUnpaidBills = filteredBills.some(b => !b.collected);
    if (room.status === 'debt' || room.status === 'Debt' || hasUnpaidBills) {
      return { isEarly: false, expectedDate: null, targetMonth: now.getMonth(), targetYear: now.getFullYear() };
    }
    
    if (room.createdAt) {
      const createdDate = parseDate(room.createdAt);
      const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (todayDateOnly < createdDateOnly) {
        return { isEarly: true, expectedDate: createdDate, targetMonth: createdDate.getMonth(), targetYear: createdDate.getFullYear() };
      }
    }
    
    if (!room.checkin) return { isEarly: false, expectedDate: null, targetMonth: now.getMonth(), targetYear: now.getFullYear() };
    const checkinDate = parseDate(room.checkin);
    if (isNaN(checkinDate.getTime())) return { isEarly: false, expectedDate: null, targetMonth: now.getMonth(), targetYear: now.getFullYear() };
    
    const unpaidBills = filteredBills.filter(b => !b.collected);
    let targetDate = new Date();
    if (unpaidBills.length > 0) {
      const sorted = [...unpaidBills].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
      targetDate = parseDate(sorted[sorted.length - 1].date);
    } else if (filteredReadings && filteredReadings.length > 0) {
      const allSorted = [...filteredReadings].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
      targetDate = parseDate(allSorted[allSorted.length - 1].date);
    }
    
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    const checkinYear = checkinDate.getFullYear();
    const checkinMonth = checkinDate.getMonth();
    const checkinDay = checkinDate.getDate();
    
    const diffMonths = (targetYear - checkinYear) * 12 + (targetMonth - checkinMonth);
    const monthsToAdd = diffMonths <= 0 ? 1 : diffMonths;
    
    const expectedDate = new Date(checkinYear, checkinMonth + monthsToAdd, checkinDay);
    const allowedStart = new Date(expectedDate);
    allowedStart.setDate(allowedStart.getDate() - 3);
    
    const isEarly = now < allowedStart;
    
    return { isEarly, expectedDate, targetMonth, targetYear };
  }, [room, now]);

  const { isEarly, expectedDate, targetMonth, targetYear } = earlyWarningInfo;

  // 2. Calculate Stats (Bọc useMemo để tối ưu hóa hiệu năng)
  const stats = useMemo(() => {
    if (!room || !prices) {
      return { 
        eUse: 0, wUse: 0, eAmt: 0, wAmt: 0, total: 0, rent: 0, prepaid: 0, fees: 0, 
        cElec: 0, cWater: 0, pElecValue: 0, pWaterValue: 0, debtMonths: 1
      };
    }
    
    const checkinDateStr = room.checkin || '';
    const filteredReadings = (room.meterReadings || []).filter(r => !checkinDateStr || r.date >= checkinDateStr);
    const allSorted = [...filteredReadings].sort((a, b) => a.date.localeCompare(b.date));
    
    // Find all unpaid bills up to targetMonth/targetYear
    const roomBills = room.bills || [];
    const unpaidBills = roomBills.filter(b => {
      if (b.collected) return false;
      const parts = b.date.split('-');
      if (parts.length !== 3) return false;
      const by = parseInt(parts[0], 10);
      const bm = parseInt(parts[1], 10);
      return by < targetYear || (by === targetYear && bm <= (targetMonth + 1));
    });

    // Determine debtMonths (number of unpaid months starting from checkin up to target billing month)
    let debtMonths = 1;
    if (room.checkin) {
      const checkinDate = parseDate(room.checkin);
      if (!isNaN(checkinDate.getTime())) {
        const checkinYear = checkinDate.getFullYear();
        const checkinMonth = checkinDate.getMonth() + 1;
        debtMonths = Math.max(1, (targetYear - checkinYear) * 12 + ((targetMonth + 1) - checkinMonth));
      }
    }

    // Earliest unpaid bill date to find prior reading
    let earliestUnpaidDate = null;
    if (unpaidBills.length > 0) {
      const sortedUnpaid = [...unpaidBills].sort((a, b) => a.date.localeCompare(b.date));
      earliestUnpaidDate = sortedUnpaid[0].date;
    }

    // Find prior readings (before the earliest unpaid bill month)
    let priorReading = null;
    if (earliestUnpaidDate) {
      const earliestParts = earliestUnpaidDate.split('-');
      const earliestY = parseInt(earliestParts[0], 10);
      const earliestM = parseInt(earliestParts[1], 10);
      priorReading = [...allSorted]
        .reverse()
        .find(r => {
          const parts = r.date.split('-');
          const ry = parseInt(parts[0], 10);
          const rm = parseInt(parts[1], 10);
          return ry < earliestY || (ry === earliestY && rm < earliestM);
        });
    }

    const pElecValue = priorReading ? priorReading.elec : (room.ep || 0);
    const pWaterValue = priorReading ? priorReading.water : (room.wp || 0);
    
    // Find latest reading for targetMonth/targetYear
    const thisMonthReadings = allSorted.find(r => {
      const [y, m] = r.date.split('-');
      return parseInt(y, 10) === targetYear && parseInt(m, 10) === (targetMonth + 1);
    });
    
    const latestReading = thisMonthReadings || (allSorted.length > 0 ? allSorted[allSorted.length - 1] : null);
    const cElec = latestReading ? latestReading.elec : pElecValue;
    const cWater = latestReading ? latestReading.water : pWaterValue;

    const eUse = Math.max(0, cElec - pElecValue);
    const wUse = Math.max(0, cWater - pWaterValue);
    
    const eAmt = eUse * (prices.elec || 0);
    const rent = parseFloat(room.price as string) || 0;
    const fees = (prices.wifi || 0) + (prices.garbage || 0);
    const wAmt = prices.waterMode === 'fixed' ? (prices.waterFixed || 0) : (wUse * (prices.water || 0));
    const prepaid = room.contractPrepaid > 0 ? rent : 0;
    
    // Calculate total cumulatively
    const total = rent * debtMonths + eAmt + wAmt * (prices.waterMode === 'fixed' ? debtMonths : 1) + fees * debtMonths - prepaid * debtMonths;

    return { eUse, wUse, eAmt, wAmt, total, rent, prepaid, fees, cElec, cWater, pElecValue, pWaterValue, debtMonths };
  }, [room, prices, targetMonth, targetYear]);

  // 3. Calculate Debt Info
  const debtMonths = stats.debtMonths;
  const priorDebt = 0;
  const finalTotal = stats.total;

  // 4. Calculate bank and QR URL (Bọc useMemo để tối ưu hóa hiệu năng)
  const qrUrl = useMemo(() => {
    if (!lodge || !room) return '';
    const bankNameFormatted = (lodge.bankName || '').replace(/\s+/g, '');
    if (lodge.bankName && lodge.bank) {
      return `https://img.vietqr.io/image/${bankNameFormatted}-${lodge.bank}-qr_only.png?amount=${finalTotal}&addInfo=${encodeURIComponent(room.name + ' Thang ' + (targetMonth + 1))}&accountName=${encodeURIComponent(lodge.name || '')}`;
    }
    return '';
  }, [lodge, room, finalTotal, targetMonth]);

  // 5. Actions (Bọc useCallback để tối ưu hóa hiệu năng)
  const markBillAsSent = useCallback(async () => {
    if (!room) return;
    try {
      const thisMonthBill = (room.bills || []).find(b => {
        const billDate = new Date(b.date);
        return billDate.getMonth() === now.getMonth() && billDate.getFullYear() === now.getFullYear();
      });

      if (thisMonthBill) {
        await axiosInstance.put(`/bills/${thisMonthBill.id || thisMonthBill._id}`, { sent: true });
      } else {
        await axiosInstance.post(`/rooms/${id}/bills`, {
          total: stats.total,
          date: now.toISOString().split('T')[0],
          sent: true,
          collected: false
        });
      }
    } catch (err) {
      console.error('Failed to mark bill as sent:', err);
    }
  }, [room, now, id, stats.total]);

  const handleSaveBill = useCallback(async () => {
    setSaving(true);
    try {
      await axiosInstance.post(`/rooms/${id}/bills`, {
        total: stats.total,
        date: new Date().toISOString().split('T')[0],
        sent: false,
        collected: false
      });
      Alert.alert(t('success'), t('billSaveSystemSuccess'), [
        { text: "OK", onPress: () => router.push('/' as any) }
      ]);
    } catch (err) {
      Alert.alert(t('error'), t('billSaveSystemFailed'));
    } finally {
      setSaving(false);
    }
  }, [id, stats.total, router, t]);

  const handleCapture = useCallback(async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 0.9,
      });
      
      if (permissionResponse?.status !== 'granted') {
        await requestPermission();
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      await markBillAsSent();
      Alert.alert(t('success'), t('billSaveSuccess'));
    } catch (err) {
      console.error(err);
      Alert.alert(t('error'), t('billSaveFailed'));
    }
  }, [permissionResponse, requestPermission, markBillAsSent, t]);

  const handleShare = useCallback(async () => {
    try {
      const uri = await captureRef(viewRef, {
        format: "png",
        quality: 0.8,
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('shareImage'),
        UTI: 'public.png'
      });
      await markBillAsSent();
    } catch (err) {
      Alert.alert(t('error'), t('billShareFailed'));
    }
  }, [markBillAsSent, t]);

  useEffect(() => {
    if (!loading && action && room && prices && lodge) {
      const timer = setTimeout(() => {
        if (action === 'save') {
          handleCapture();
        } else if (action === 'share') {
          handleShare();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, action, room, prices, lodge, handleCapture, handleShare]);

  const formattedExpectedDate = useMemo(() => {
    if (!expectedDate) return '';
    return `${expectedDate.getDate().toString().padStart(2, '0')}/${(expectedDate.getMonth() + 1).toString().padStart(2, '0')}/${expectedDate.getFullYear()}`;
  }, [expectedDate]);

  if (loading) return <View style={styles.loading}><Text>{t('loading')}</Text></View>;
  if (!room || !prices || !lodge) return <View style={styles.loading}><Text>{t('loadingData')}</Text></View>;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.topbar, { paddingTop: Math.max(insets.top + 10, 24) }]}>
        <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
          <BackIcon size={24} color={COLORS.g2} />
        </TouchableOpacity>
        <Text style={styles.tbtitle}>{t('invoice')} · {room.name}</Text>
        
        {/* Premium bilingual switch button on topbar */}
        <TouchableOpacity 
          style={styles.langBtn} 
          onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          activeOpacity={0.7}
        >
          <Text style={styles.langBtnTxt}>{language === 'vi' ? 'EN' : 'VI'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {isEarly && (
          <View style={styles.earlyWarning}>
            <AlertTriangleIcon size={16} color="#d97706" style={{ marginTop: 1 }} />
            <Text style={styles.earlyWarningTxt}>
              {t('earlyWarning', { date: formattedExpectedDate })}
            </Text>
          </View>
        )}
        
        <CaptureView ref={viewRef} options={{ format: "png", quality: 0.9 }}>
          <View style={styles.captureArea}>
            <View style={styles.receiptPaper}>
              {/* Header */}
              <View style={styles.billHeader}>
                <Text style={styles.bhLodge}>{lodge.name || 'RentHub'}</Text>
                <Text style={styles.bhTitle}>{t('invoiceTitle')}</Text>
                <View style={styles.bhRow}>
                  <Text style={styles.bhRoom}>{t('room')}: {room.name}</Text>
                  <View style={styles.bhDot} />
                  <Text style={styles.bhDate}>{t('month')} {targetMonth + 1}/{targetYear}</Text>
                </View>
              </View>

              <View style={styles.dashLine} />

              {/* QR Section */}
              {!!qrUrl && (
                <View style={styles.qrSection}>
                  <View style={styles.qrBox}>
                    <Image source={{ uri: qrUrl }} style={styles.qrBig} />
                  </View>
                </View>
              )}

              {/* Bank Details */}
              <View style={styles.bankSide}>
                <View style={styles.bankRowCol}>
                  <Text style={styles.bLblMini}>{t('bankAccount')}</Text>
                  <Text style={styles.bValHigh}>{lodge.bank}</Text>
                </View>
                <View style={styles.bankRowCol}>
                  <Text style={styles.bLblMini}>{t('bankName')}</Text>
                  <Text style={styles.bValMini}>{lodge.bankName}</Text>
                </View>
                <View style={styles.bankRowCol}>
                  <Text style={styles.bLblMini}>{t('bankOwner')}</Text>
                  <Text style={styles.bValMini}>{lodge.name}</Text>
                </View>
                <View style={[styles.bankRowCol, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.bLblMini}>{t('transferDetails')}</Text>
                  <Text style={styles.bValHigh}>{room.name} Thang {(targetMonth + 1)}</Text>
                </View>
              </View>

              <View style={styles.dashLine} />

              {/* Total Amount */}
              <View style={styles.totalSection}>
                <Text style={[styles.tcLbl, { color: '#64748b' }]}>{t('totalDue')}</Text>
                <Text style={[styles.tcVal, { color: COLORS.pr }]}>{finalTotal.toLocaleString('vi')} đ</Text>
                <Text style={[styles.tcDate, { color: '#94a3b8' }]}>{t('dueDate')}: {formattedExpectedDate}</Text>
              </View>

              <View style={styles.dashLine} />

              {/* Details */}
              <Text style={styles.secTit}>{t('serviceDetails')}</Text>
              <View style={styles.detailRow}>
                <Text style={[styles.dLbl, debtMonths >= 2 && { color: COLORS.rose }]}>
                  {t('rent')} {debtMonths >= 2 ? t('rentMonths', { count: debtMonths }) : ''}
                </Text>
                <Text style={[styles.dVal, debtMonths >= 2 && { color: COLORS.rose }]}>
                  {((stats.rent * (debtMonths >= 2 ? debtMonths : 1))).toLocaleString('vi')} đ
                </Text>
              </View>
              <View style={styles.detailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dLbl}>{t('electricity')} ({stats.eUse} kWh)</Text>
                  <Text style={styles.dSub}>{t('electricityDetail', { prior: stats.pElecValue, current: stats.cElec })}</Text>
                </View>
                <Text style={styles.dVal}>{stats.eAmt.toLocaleString('vi')} đ</Text>
              </View>
              <View style={styles.detailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.dLbl, 
                    (prices.waterMode === 'fixed' && debtMonths >= 2) && { color: COLORS.rose }
                  ]}>
                    {t('water')} {prices.waterMode === 'fixed' ? t('waterFixed') : `(${stats.wUse} m³)`}
                    {(prices.waterMode === 'fixed' && debtMonths >= 2) ? ` ${t('rentMonths', { count: debtMonths })}` : ''}
                  </Text>
                  {prices.waterMode !== 'fixed' && (
                    <Text style={styles.dSub}>{t('electricityDetail', { prior: stats.pWaterValue, current: stats.cWater })}</Text>
                  )}
                </View>
                <Text style={[
                  styles.dVal, 
                  (prices.waterMode === 'fixed' && debtMonths >= 2) && { color: COLORS.rose }
                ]}>
                  {((stats.wAmt * (prices.waterMode === 'fixed' && debtMonths >= 2 ? debtMonths : 1))).toLocaleString('vi')} đ
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.dLbl, debtMonths >= 2 && { color: COLORS.rose }]}>
                  {t('wifiGarbage')} {debtMonths >= 2 ? t('rentMonths', { count: debtMonths }) : ''}
                </Text>
                <Text style={[styles.dVal, debtMonths >= 2 && { color: COLORS.rose }]}>
                  {((stats.fees * (debtMonths >= 2 ? debtMonths : 1))).toLocaleString('vi')} đ
                </Text>
              </View>
              {stats.prepaid > 0 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.dLbl, { color: COLORS.sky }]}>{t('prepaidDeduct')}</Text>
                  <Text style={[styles.dVal, { color: COLORS.sky }]}>-{stats.prepaid.toLocaleString('vi')} đ</Text>
                </View>
              )}

              {room.contractPrepaid > 0 && (
                <View style={[styles.infoPill, { marginTop: 15 }]}>
                  <View style={styles.pillIcon}>
                    <Text style={{ color: '#166534', fontWeight: 'bold' }}>ⓘ</Text>
                  </View>
                  <Text style={styles.pillTxt}>
                    {t('prepaidContractNote', { count: room.contractPrepaid })}
                  </Text>
                </View>
              )}

              <Text style={styles.footerNote}>{t('thankYou')}</Text>
            </View>
          </View>
        </CaptureView>

        <View style={[styles.brow, { marginTop: 20 }]}>
          <Button 
            title={t('shareImage')} 
            type="sky" 
            icon={ShareIcon}
            onPress={handleShare} 
            full
            style={{ flex: 1 }}
          />
          <Button 
            title={t('saveBillImage')} 
            type="green"
            icon={DownloadIcon}
            onPress={handleCapture} 
            full 
            style={{ flex: 1 }}
          />
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topbar: {
    backgroundColor: COLORS.white,
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tbback: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.g6,
    borderRadius: 11,
  },
  tbtitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '900', color: COLORS.g1 },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.pr,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  langBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  scroll: { padding: 14, gap: 12 },
  infoPill: {
    backgroundColor: '#dcfce7',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  pillIcon: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    backgroundColor: 'rgba(22,101,52,0.1)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pillTxt: { flex: 1, fontSize: 11, color: '#165030', fontWeight: '600', lineHeight: 16 },
  tcLbl: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  tcVal: { fontSize: 28, fontWeight: '900', marginTop: 2 },
  tcDate: { fontSize: 10, marginTop: 2, fontWeight: '700' },
  secTit: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
  brow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  captureArea: { backgroundColor: '#f0fdf4', padding: 10 },
  receiptPaper: { backgroundColor: COLORS.white, borderRadius: 16, padding: 12, ...SHADOWS.sh2 },
  billHeader: { alignItems: 'center', marginBottom: 4 },
  bhLodge: { fontSize: 10, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  bhTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginVertical: 2, letterSpacing: 0.5 },
  bhRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bhRoom: { fontSize: 12, fontWeight: '800', color: COLORS.pr },
  bhDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#94a3b8' },
  bhDate: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  qrSection: { alignItems: 'center', marginVertical: 4 },
  qrBox: { padding: 6, borderRadius: 12, borderWidth: 4, borderColor: COLORS.pr, backgroundColor: '#fff' },
  qrBig: { width: 150, height: 150 },
  dashLine: { 
    height: 1, 
    backgroundColor: 'transparent', 
    marginVertical: 6, 
    borderStyle: 'dashed', 
    borderWidth: 1, 
    borderColor: '#cbd5e1', 
    borderRadius: 1 
  },
  bankSide: { width: '100%' },
  bankRowCol: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  bLblMini: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  bValMini: { fontSize: 12, color: '#0f172a', fontWeight: '800', textAlign: 'right', flex: 1, marginLeft: 15 },
  bValHigh: { fontSize: 13, color: COLORS.pr, fontWeight: '900', textAlign: 'right', flex: 1, marginLeft: 15 },
  totalSection: { alignItems: 'center', paddingVertical: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  dLbl: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  dVal: { fontSize: 12, color: '#0f172a', fontWeight: '800' },
  dSub: { fontSize: 9, color: '#94a3b8', fontStyle: 'italic', marginTop: 1 },
  footerNote: { textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 10, marginBottom: 0, fontWeight: '600' },
  earlyWarning: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  earlyWarningTxt: {
    color: '#b45309',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    flex: 1,
  },
});

export default BillScreen;
