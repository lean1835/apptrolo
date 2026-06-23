// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Alert, 
  Platform, 
  Modal, 
  TextInput,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../../../styles/Theme';
import { 
  MoneyIcon, 
  SendIcon, 
  CheckIcon, 
  ChevronIcon, 
  AlertTriangleIcon, 
  ShareIcon, 
  DownloadIcon, 
  ReceiptIcon, 
  UserIcon 
} from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CaptureView, captureRef } from '../../../utils/capture';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useLanguage } from '../../../context/LanguageContext';

const getMonthChoices = () => {
  const choices = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    choices.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: `T${d.getMonth() + 1}/${d.getFullYear()}`
    });
  }
  return choices;
};

const formatNumberWithCommas = (val) => {
  if (val === undefined || val === null || val === '') return '';
  const clean = val.toString().replace(/\D/g, '');
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseFormattedNumber = (val) => {
  if (!val) return 0;
  const clean = val.toString().replace(/\D/g, '');
  return parseFloat(clean) || 0;
};

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

const DebtScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { language, setLanguage, t } = useLanguage();
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allRooms, setAllRooms] = useState([]);
  const [allBills, setAllBills] = useState([]);
  const [prices, setPrices] = useState({ wifi: 0, garbage: 0, waterMode: 'meter', waterFixed: 0 });
  const [lodge, setLodge] = useState(null);

  // Date filtering state
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Tab state: 'draft' | 'unpaid' | 'paid' | 'debt'
  const [activeTab, setActiveTab] = useState('unpaid');

  // Collect modal states
  const [isCollectModalVisible, setIsCollectModalVisible] = useState(false);
  const [selectedRoomForCollect, setSelectedRoomForCollect] = useState(null);
  const [collectAmountPaid, setCollectAmountPaid] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);

  // Invoice choice modal states
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [selectedRoomForInvoice, setSelectedRoomForInvoice] = useState(null);

  // Background capture states
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [invoiceStatusText, setInvoiceStatusText] = useState('');
  const invoiceViewRef = useRef(null);

  useEffect(() => {
    if (!permissionResponse || permissionResponse.status !== 'granted') {
      requestPermission();
    }
  }, []);

  const fetchDebt = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [roomsRes, billsRes, pricesRes, lodgeRes] = await Promise.all([
         axiosInstance.get('/rooms'),
         axiosInstance.get('/bills'),
         axiosInstance.get('/utility-prices'),
         axiosInstance.get('/lodge').catch(() => ({ data: null }))
      ]);
      
      setAllRooms(roomsRes.data || []);
      setAllBills(billsRes.data || []);
      setPrices(pricesRes.data || { wifi: 0, garbage: 0 });
      setLodge(lodgeRes ? lodgeRes.data : null);
    } catch (err) {
      console.error('Fetch billing data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDebt(false);
    setRefreshing(false);
  }, [fetchDebt]);

  useFocusEffect(
    useCallback(() => {
      fetchDebt(true);
      if (params.filter) {
        if (params.filter === 'unsent') setActiveTab('draft');
        else if (params.filter === 'sent') setActiveTab('unpaid');
        else setActiveTab('unpaid');
      }
    }, [fetchDebt, params.filter])
  );

  // Categorize rooms based on selected month & year
  const getCategorizedData = () => {
    const draft = [];
    const unpaid = [];
    const paid = [];
    const debt = [];

    const now = new Date();
    const isCurrentMonth = selectedMonth === (now.getMonth() + 1) && selectedYear === now.getFullYear();
    const isPastMonth = selectedYear < now.getFullYear() || (selectedYear === now.getFullYear() && selectedMonth < (now.getMonth() + 1));

    // Filter occupied rooms only
    const activeRooms = allRooms.filter(
      r => r.status === 'occupied' || r.status === 'Occupied' || r.status === 'debt' || r.status === 'Debt'
    );

    activeRooms.forEach(room => {
      const checkinDateStr = room.checkin || '';

      // Skip rooms that weren't checked in yet during the selected month
      if (checkinDateStr) {
        const checkinDate = parseDate(checkinDateStr);
        if (!isNaN(checkinDate.getTime())) {
          const checkinYear = checkinDate.getFullYear();
          const checkinMonth = checkinDate.getMonth() + 1;
          // If selected month is before checkin month, skip this room
          if (selectedYear < checkinYear || (selectedYear === checkinYear && selectedMonth < checkinMonth)) {
            return;
          }
        }
      }

      // Find bill for selected month/year
      const monthBill = allBills.find(b => {
        if (b.roomId !== room.id && b.room !== room.id) return false;
        const parts = b.date.split('-');
        return parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === selectedMonth;
      });

      // Check if has reading for selected month/year (filter by checkin date)
      const hasReading = room.meterReadings?.some(m => {
        const parts = m.date.split('-');
        const matchesMonth = parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === selectedMonth;
        if (!matchesMonth) return false;
        // Only count readings after checkin
        if (checkinDateStr && m.date < checkinDateStr) return false;
        return true;
      });

      // All bills for this room
      const roomBills = allBills.filter(b => b.roomId === room.id || b.room === room.id);

      // Check if meter reading was actually expected in the selected month
      // based on the room's checkin cycle (checkin day ±3 days each month)
      let isMeterDue = true;
      if (room.checkin) {
        const checkinDate = parseDate(room.checkin);
        if (!isNaN(checkinDate.getTime())) {
          const filteredReadings = (room.meterReadings || []).filter(r => !checkinDateStr || r.date >= checkinDateStr);
          
          // Find the latest reading date (or use checkin as base)
          let latestDate = new Date(checkinDate);
          if (filteredReadings.length > 0) {
            filteredReadings.forEach(r => {
              const d = parseDate(r.date);
              if (!isNaN(d.getTime()) && d > latestDate) {
                latestDate = d;
              }
            });
          }

          // Calculate the expected reading date (1 month after latest, on checkin day)
          const expectedDate = new Date(latestDate);
          expectedDate.setMonth(expectedDate.getMonth() + 1);
          expectedDate.setDate(checkinDate.getDate());

          // The allowed recording window starts 3 days before expected date
          const allowedStart = new Date(expectedDate);
          allowedStart.setDate(allowedStart.getDate() - 3);

          // Check if the expected reading falls in the selected month
          const expectedMonth = expectedDate.getMonth() + 1;
          const expectedYear = expectedDate.getFullYear();

          if (isCurrentMonth) {
            // For current month: check if today has reached the allowed window
            const today = new Date();
            if (today < allowedStart) {
              isMeterDue = false; // Too early to record
            }
          } else {
            // For past/future months: check if the expected reading month matches selected month
            // If the expected reading is NOT in the selected month, this room doesn't belong in draft
            if (expectedYear !== selectedYear || expectedMonth !== selectedMonth) {
              // Also check subsequent cycles — if expected was before selected month,
              // there might be a later cycle in the selected month
              let cycleDate = new Date(expectedDate);
              let found = false;
              // Look forward up to 12 cycles
              for (let i = 0; i < 12; i++) {
                const cm = cycleDate.getMonth() + 1;
                const cy = cycleDate.getFullYear();
                if (cy === selectedYear && cm === selectedMonth) {
                  found = true;
                  break;
                }
                if (cy > selectedYear || (cy === selectedYear && cm > selectedMonth)) {
                  break; // Past the selected month
                }
                cycleDate.setMonth(cycleDate.getMonth() + 1);
                cycleDate.setDate(checkinDate.getDate());
              }
              if (!found) {
                isMeterDue = false;
              }
            }
          }
        }
      }

      // 1. Debt (Nợ đóng thiếu) tab: if room has positive debtAmount (show regardless of month)
      if (room.debtAmount > 0 && isCurrentMonth) {
        debt.push({
          ...room,
          displayAmount: room.debtAmount,
          displayLabel: `Nợ đóng thiếu`
        });
      }
      
      // 2. Draft (Chưa chốt): no bill for this month yet
      if (!monthBill) {
        if (hasReading) {
          // Has reading but no bill — needs bill creation
          draft.push({
            ...room,
            displayLabel: 'Chưa lập hóa đơn'
          });
        } else if (isMeterDue) {
          // No reading and no bill, meter due — needs meter recording
          draft.push({
            ...room,
            displayLabel: 'Chưa ghi điện nước'
          });
        }
        // else: too early, skip
      } 
      // 3. Unpaid (Chờ thu): has bill for selected month/year, but it's not collected
      else if (monthBill && !monthBill.collected) {
        // Find unpaid bills up to the selected month/year
        const unpaidBillsUpToSelected = roomBills.filter(b => {
          if (b.collected) return false;
          const parts = b.date.split('-');
          if (parts.length !== 3) return false;
          const by = parseInt(parts[0], 10);
          const bm = parseInt(parts[1], 10);
          return by < selectedYear || (by === selectedYear && bm <= selectedMonth);
        });

        // Determine debtMonths (number of unpaid months starting from checkin up to selected billing month)
        let debtMonths = 1;
        if (room.checkin) {
          const checkinDate = parseDate(room.checkin);
          if (!isNaN(checkinDate.getTime())) {
            const checkinYear = checkinDate.getFullYear();
            const checkinMonth = checkinDate.getMonth() + 1;
            debtMonths = Math.max(1, (selectedYear - checkinYear) * 12 + (selectedMonth - checkinMonth));
          }
        }

        // Find prior readings (before the earliest unpaid bill month)
        const checkinDateStr = room.checkin || '';
        const filteredReadings = (room.meterReadings || []).filter(r => !checkinDateStr || r.date >= checkinDateStr);
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
            .find(r => {
              const parts = r.date.split('-');
              const ry = parseInt(parts[0], 10);
              const rm = parseInt(parts[1], 10);
              return ry < earliestY || (ry === earliestY && rm < earliestM);
            });
        }

        const pElecValue = priorReading ? priorReading.elec : (room.ep || 0);
        const pWaterValue = priorReading ? priorReading.water : (room.wp || 0);

        const thisMonthReadings = allSorted.find(r => {
          const [y, m] = r.date.split('-');
          return parseInt(y, 10) === selectedYear && parseInt(m, 10) === selectedMonth;
        });

        const latestReading = thisMonthReadings || (allSorted.length > 0 ? allSorted[allSorted.length - 1] : null);
        const cElec = latestReading ? latestReading.elec : pElecValue;
        const cWater = latestReading ? latestReading.water : pWaterValue;

        const eUse = Math.max(0, cElec - pElecValue);
        const wUse = Math.max(0, cWater - pWaterValue);

        const eAmt = eUse * (prices.elec || 0);
        const rent = (parseFloat(room.price) || 0) * debtMonths;
        const fees = ((prices.wifi || 0) + (prices.garbage || 0)) * debtMonths;
        const wAmt = prices.waterMode === 'fixed' ? (prices.waterFixed || 0) * debtMonths : (wUse * (prices.water || 0));
        const prepaid = room.contractPrepaid > 0 ? rent : 0;

        const calculatedTotal = rent + eAmt + wAmt + fees - prepaid;

        unpaid.push({
          ...room,
          billId: monthBill.id || monthBill._id,
          billTotal: monthBill.total,
          displayAmount: calculatedTotal,
          unpaidCount: unpaidBillsUpToSelected.length,
          unpaidBills: unpaidBillsUpToSelected,
          currentBillId: monthBill.id || monthBill._id
        });
      } 
      // 4. Paid (Đã thu đủ): has bill for selected month/year, and it is collected
      else if (monthBill && monthBill.collected) {
        paid.push({
          ...room,
          billId: monthBill.id || monthBill._id,
          billTotal: monthBill.total,
          displayAmount: monthBill.total
        });
      }
    });

    return { draft, unpaid, paid, debt };
  };

  const { draft, unpaid, paid, debt } = getCategorizedData();

  const summaryStats = useMemo(() => {
    const unpaidSum = unpaid.reduce((sum, item) => sum + (Number(item.displayAmount) || 0), 0);
    const paidSum = paid.reduce((sum, item) => sum + (Number(item.displayAmount) || 0), 0);
    return {
      unpaidCount: unpaid.length,
      unpaidSum,
      paidCount: paid.length,
      paidSum,
    };
  }, [unpaid, paid]);

  // Handle open Collect payment popup
  const handleOpenCollectModal = (roomItem) => {
    setSelectedRoomForCollect(roomItem);
    setCollectAmountPaid(formatNumberWithCommas(Math.round(roomItem.displayAmount)));
    setIsCollectModalVisible(true);
  };

  // Perform collection with distribution logic
  const handleConfirmCollectPayment = async () => {
    if (!selectedRoomForCollect) return;

    const amountPaidVal = parseFormattedNumber(collectAmountPaid);
    if (isNaN(amountPaidVal) || amountPaidVal < 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
      return;
    }

    setIsCollecting(true);
    try {
      const unpaidBills = selectedRoomForCollect.unpaidBills || [];
      if (unpaidBills.length === 0) {
        // No bills exist, just reset status
        await axiosInstance.put(`/rooms/${selectedRoomForCollect.id}`, { status: 'occupied' });
      } else {
        let remainingPaid = amountPaidVal;
        
        // Loop through bills and pay them down
        for (let i = 0; i < unpaidBills.length; i++) {
          const bill = unpaidBills[i];
          const isLastBill = (i === unpaidBills.length - 1);
          
          if (isLastBill) {
            // For the last bill, update with remaining amount (backend handles room.debtAmount if paid < total)
            const targetTotal = (bill.id || bill._id) === selectedRoomForCollect.currentBillId
              ? selectedRoomForCollect.displayAmount
              : bill.total;
            await axiosInstance.put(`/bills/${bill.id || bill._id}`, {
              collected: true,
              amountPaid: remainingPaid,
              total: targetTotal
            });
          } else {
            // Prior bills
            if (remainingPaid >= bill.total) {
              await axiosInstance.put(`/bills/${bill.id || bill._id}`, {
                collected: true,
                amountPaid: bill.total
              });
              remainingPaid -= bill.total;
            } else {
              await axiosInstance.put(`/bills/${bill.id || bill._id}`, {
                collected: true,
                amountPaid: remainingPaid
              });
              remainingPaid = 0;
            }
          }
        }
      }

      Alert.alert("Thành công", "Đã ghi nhận thu tiền phòng trọ");
      setIsCollectModalVisible(false);
      fetchDebt();
    } catch (err) {
      Alert.alert("Lỗi", "Không thể ghi nhận thu tiền");
      console.error(err);
    } finally {
      setIsCollecting(false);
    }
  };

  const invoiceStats = useMemo(() => {
    if (!selectedRoomForInvoice || !prices) return null;
    const room = selectedRoomForInvoice;
    const targetMonth = selectedMonth - 1;
    const targetYear = selectedYear;

    const checkinDateStr = room.checkin || '';
    const filteredReadings = (room.meterReadings || []).filter(r => !checkinDateStr || r.date >= checkinDateStr);
    const allSorted = [...filteredReadings].sort((a, b) => a.date.localeCompare(b.date));
    
    // Find all unpaid bills up to selectedMonth/selectedYear
    const roomBills = allBills.filter(b => b.roomId === room.id || b.room === room.id);
    const unpaidBills = roomBills.filter(b => {
      if (b.collected) return false;
      const parts = b.date.split('-');
      if (parts.length !== 3) return false;
      const by = parseInt(parts[0], 10);
      const bm = parseInt(parts[1], 10);
      return by < selectedYear || (by === selectedYear && bm <= selectedMonth);
    });

    // Determine debtMonths (number of unpaid months starting from checkin up to selected billing month)
    let debtMonths = 1;
    if (room.checkin) {
      const checkinDate = parseDate(room.checkin);
      if (!isNaN(checkinDate.getTime())) {
        const checkinYear = checkinDate.getFullYear();
        const checkinMonth = checkinDate.getMonth() + 1;
        debtMonths = Math.max(1, (selectedYear - checkinYear) * 12 + (selectedMonth - checkinMonth));
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
    
    // Find latest reading for selectedMonth/selectedYear
    const thisMonthReadings = allSorted.find(r => {
      const [y, m] = r.date.split('-');
      return parseInt(y, 10) === selectedYear && parseInt(m, 10) === selectedMonth;
    });
    
    const latestReading = thisMonthReadings || (allSorted.length > 0 ? allSorted[allSorted.length - 1] : null);
    const cElec = latestReading ? latestReading.elec : pElecValue;
    const cWater = latestReading ? latestReading.water : pWaterValue;

    const eUse = Math.max(0, cElec - pElecValue);
    const wUse = Math.max(0, cWater - pWaterValue);
    
    const eAmt = eUse * (prices.elec || 0);
    const rent = (parseFloat(room.price as string) || 0) * debtMonths;
    const fees = ((prices.wifi || 0) + (prices.garbage || 0)) * debtMonths;
    const wAmt = prices.waterMode === 'fixed' ? (prices.waterFixed || 0) * debtMonths : (wUse * (prices.water || 0));
    const prepaid = room.contractPrepaid > 0 ? rent : 0;
    
    // Calculate total cumulatively
    const finalTotal = rent + eAmt + wAmt + fees - prepaid;

    // Expected due date
    let expectedDate = null;
    if (room.checkin) {
      const checkinDate = parseDate(room.checkin);
      if (!isNaN(checkinDate.getTime())) {
        const checkinYear = checkinDate.getFullYear();
        const checkinMonth = checkinDate.getMonth();
        const checkinDay = checkinDate.getDate();
        
        const diffMonthsVal = (targetYear - checkinYear) * 12 + (targetMonth - checkinMonth);
        const monthsToAdd = diffMonthsVal <= 0 ? 1 : diffMonthsVal;
        expectedDate = new Date(checkinYear, checkinMonth + monthsToAdd, checkinDay);
      }
    }
    const formattedExpectedDate = expectedDate
      ? `${expectedDate.getDate().toString().padStart(2, '0')}/${(expectedDate.getMonth() + 1).toString().padStart(2, '0')}/${expectedDate.getFullYear()}`
      : '';

    // QR URL
    let qrUrl = '';
    if (lodge) {
      const bankNameFormatted = (lodge.bankName || '').replace(/\s+/g, '');
      if (lodge.bankName && lodge.bank) {
        qrUrl = `https://img.vietqr.io/image/${bankNameFormatted}-${lodge.bank}-qr_only.png?amount=${finalTotal}&addInfo=${encodeURIComponent(room.name + ' Thang ' + (targetMonth + 1))}&accountName=${encodeURIComponent(lodge.name || '')}`;
      }
    }

    return {
      eUse, wUse, eAmt, wAmt, total: finalTotal, rent, prepaid, fees, cElec, cWater, pElecValue, pWaterValue,
      priorDebt: 0, finalTotal, qrUrl, formattedExpectedDate, targetMonth, targetYear, debtMonths
    };
  }, [selectedRoomForInvoice, prices, lodge, selectedMonth, selectedYear, allBills]);

  const markBillAsSent = async (roomItem, totalAmount) => {
    try {
      // Use selected month/year for bill lookup and creation
      const targetMonthStr = String(selectedMonth).padStart(2, '0');
      const billDateStr = `${selectedYear}-${targetMonthStr}-01`;

      const existingBill = allBills.find(b => {
        if (b.roomId !== roomItem.id && b.room !== roomItem.id) return false;
        const parts = b.date.split('-');
        return parseInt(parts[0], 10) === selectedYear && parseInt(parts[1], 10) === selectedMonth;
      });

      if (existingBill) {
        await axiosInstance.put(`/bills/${existingBill.id || existingBill._id}`, { 
          sent: true,
          total: totalAmount
        });
      } else {
        await axiosInstance.post(`/rooms/${roomItem.id || roomItem._id}/bills`, {
          total: totalAmount,
          date: billDateStr,
          sent: true,
          collected: false
        });
      }
    } catch (err) {
      console.error('Failed to mark bill as sent:', err);
    }
  };

  const handleGenerateInvoiceImage = async (roomItem, actionType) => {
    setIsInvoiceModalVisible(false);
    setIsGeneratingInvoice(true);
    setInvoiceStatusText(actionType === 'save' ? 'Đang tạo và lưu hóa đơn...' : 'Đang chuẩn bị gửi Zalo...');

    // Wait for the layout to draw and QR code to load
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      if (!invoiceViewRef.current) {
        throw new Error("Không thể định vị mẫu hóa đơn để chụp ảnh.");
      }

      const uri = await captureRef(invoiceViewRef, {
        format: "png",
        quality: actionType === 'save' ? 0.9 : 0.8,
      });

      if (actionType === 'save') {
        if (Platform.OS === 'web') {
          throw new Error("Lưu ảnh không được hỗ trợ trên Web, vui lòng sử dụng thiết bị di động.");
        }
        
        if (permissionResponse?.status !== 'granted') {
          const newPerm = await requestPermission();
          if (newPerm.status !== 'granted') {
            throw new Error("Ứng dụng cần quyền truy cập thư viện ảnh để lưu hóa đơn.");
          }
        }
        await MediaLibrary.saveToLibraryAsync(uri);
        await markBillAsSent(roomItem, invoiceStats?.finalTotal || 0);
        Alert.alert("Thành công", "Đã lưu ảnh hóa đơn vào thư viện.");
      } else if (actionType === 'share') {
        if (Platform.OS === 'web') {
          throw new Error("Gửi ảnh không được hỗ trợ trên Web, vui lòng sử dụng thiết bị di động.");
        }
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Chia sẻ hóa đơn',
          UTI: 'public.png'
        });
        await markBillAsSent(roomItem, invoiceStats?.finalTotal || 0);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", err.message || "Không thể xử lý hóa đơn.");
    } finally {
      setIsGeneratingInvoice(false);
      setInvoiceStatusText('');
      fetchDebt();
    }
  };

  if (loading && allRooms.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.pr} />
        <Text style={styles.loadingText}>Đang tải dữ liệu công nợ...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Green Header Section with Summary Cards */}
      <LinearGradient
        colors={['#14532d', '#16a34a', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top + 12, 28) }]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Thu tiền</Text>
          </View>
          
          {/* Month Selector Button */}
          <TouchableOpacity 
            style={styles.pickerBtn} 
            onPress={() => setShowMonthPicker(!showMonthPicker)}
          >
            <Text style={styles.pickerBtnTxt}>{`T${selectedMonth}/${selectedYear}`}</Text>
            <ChevronIcon size={14} color="#16a34a" style={styles.pickerBtnArrow} />
          </TouchableOpacity>
        </View>

        {/* Financial Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>CHỜ THU ({summaryStats.unpaidCount})</Text>
            <Text style={[styles.summaryValue, { color: COLORS.rose }]}>
              {summaryStats.unpaidSum.toLocaleString('vi')}đ
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>ĐÃ THU ({summaryStats.paidCount})</Text>
            <Text style={[styles.summaryValue, { color: COLORS.pr }]}>
              {summaryStats.paidSum.toLocaleString('vi')}đ
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Month Dropdown overlay */}
      {showMonthPicker && (
        <View style={styles.dropdownMenu}>
          {getMonthChoices().map((choice, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dropdownMenuItem,
                choice.month === selectedMonth && choice.year === selectedYear && styles.dropdownMenuItemActive
              ]}
              onPress={() => {
                setSelectedMonth(choice.month);
                setSelectedYear(choice.year);
                setShowMonthPicker(false);
              }}
            >
              <Text 
                style={[
                  styles.dropdownMenuItemText,
                  choice.month === selectedMonth && choice.year === selectedYear && styles.dropdownMenuItemTextActive
                ]}
              >
                {choice.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Horizontal Tabs List */}
      <View style={styles.tabsWrapper}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabsContainer}
        >
          <TouchableOpacity 
            style={[
              styles.tabBtn, 
              activeTab === 'draft' && { backgroundColor: '#e0f2fe', borderColor: '#0284c7' }
            ]}
            onPress={() => setActiveTab('draft')}
          >
            <Text style={[
              styles.tabBtnText, 
              activeTab === 'draft' && { color: '#0369a1' }
            ]}>
              Chưa chốt ({draft.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tabBtn, 
              activeTab === 'unpaid' && { backgroundColor: '#ffe4e6', borderColor: '#e11d48' }
            ]}
            onPress={() => setActiveTab('unpaid')}
          >
            <Text style={[
              styles.tabBtnText, 
              activeTab === 'unpaid' && { color: '#be123c' }
            ]}>
              Chờ thu ({unpaid.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tabBtn, 
              activeTab === 'paid' && { backgroundColor: '#dcfce7', borderColor: '#16a34a' }
            ]}
            onPress={() => setActiveTab('paid')}
          >
            <Text style={[
              styles.tabBtnText, 
              activeTab === 'paid' && { color: '#15803d' }
            ]}>
              Đã thu đủ ({paid.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tabBtn, 
              activeTab === 'debt' && { backgroundColor: '#fef3c7', borderColor: '#d97706' }
            ]}
            onPress={() => setActiveTab('debt')}
          >
            <Text style={[
              styles.tabBtnText, 
              activeTab === 'debt' && { color: '#b45309' }
            ]}>
              Nợ (Đóng thiếu) ({debt.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main List content */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'draft' && (
          <View style={styles.list}>
            {draft.length === 0 ? (
              <Text style={styles.emptyTxt}>Không có phòng nào chưa chốt số.</Text>
            ) : (
              draft.map(item => (
                <View key={item.id} style={styles.premiumCard}>
                  <View style={styles.cardInfoRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#e0f2fe' }]}>
                      <Text style={[styles.avatarText, { color: '#0369a1' }]}>
                        {item.name ? item.name.charAt(0) : 'P'}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.roomName}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <UserIcon size={12} color="#64748b" />
                        <Text style={styles.tenantName}>{item.tenant || 'Trống'}</Text>
                      </View>
                      <Text style={[styles.cardMeta, { color: '#0284c7' }]}>{item.displayLabel}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.actionBtnPrimaryCompact, { backgroundColor: '#0284c7' }]}
                    onPress={() => router.push({ pathname: '/meter', params: { id: item.id || item._id } })}
                  >
                    <Text style={styles.actionBtnPrimaryText}>Chốt số</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'unpaid' && (
          <View style={styles.list}>
            {unpaid.length === 0 ? (
              <Text style={styles.emptyTxt}>Tuyệt vời! Tất cả phòng đã đóng tiền.</Text>
            ) : (
              unpaid.map(item => (
                <View key={item.id} style={styles.premiumCardVertical}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardInfoRow}>
                      <View style={[styles.avatarCircle, { backgroundColor: '#ffe4e6' }]}>
                        <Text style={[styles.avatarText, { color: '#be123c' }]}>
                          {item.name ? item.name.charAt(0) : 'P'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.roomName}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <UserIcon size={12} color="#64748b" />
                          <Text style={styles.tenantName}>{item.tenant || 'Khách thuê'}</Text>
                        </View>
                      </View>
                    </View>
                    {item.unpaidCount >= 2 ? (
                      <View style={styles.badgeRose}>
                        <Text style={styles.badgeRoseText}>{`Trễ ${item.unpaidCount} tháng`}</Text>
                      </View>
                    ) : (
                      <View style={[styles.badgeRose, { backgroundColor: '#f1f5f9' }]}>
                        <Text style={[styles.badgeRoseText, { color: '#475569' }]}>Hóa đơn chờ thu</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.amountDivider} />
                  
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Tổng tiền chờ thu:</Text>
                    <Text style={styles.amountRed}>
                      {Number(item.displayAmount).toLocaleString('vi')} đ
                    </Text>
                  </View>

                  <View style={styles.cardButtonsRow}>
                    <TouchableOpacity 
                      style={styles.actionBtnOutlinePremium}
                      onPress={() => {
                        setSelectedRoomForInvoice(item);
                        setIsInvoiceModalVisible(true);
                      }}
                    >
                      <ReceiptIcon size={16} color="#16a34a" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnOutlineText}>Gửi hóa đơn</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.actionBtnPrimaryPremium}
                      onPress={() => handleOpenCollectModal(item)}
                    >
                      <MoneyIcon size={16} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnPrimaryText}>Thu tiền</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'paid' && (
          <View style={styles.list}>
            {paid.length === 0 ? (
              <Text style={styles.emptyTxt}>Chưa có phòng nào hoàn tất đóng tiền.</Text>
            ) : (
              paid.map(item => (
                <View key={item.id} style={styles.premiumCard}>
                  <View style={styles.cardInfoRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#dcfce7' }]}>
                      <Text style={[styles.avatarText, { color: '#15803d' }]}>
                        {item.name ? item.name.charAt(0) : 'P'}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.roomName}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <UserIcon size={12} color="#64748b" />
                        <Text style={styles.tenantName}>{item.tenant || 'Khách thuê'}</Text>
                      </View>
                      <Text style={styles.amountGreen}>
                        {Number(item.displayAmount).toLocaleString('vi')} đ
                      </Text>
                    </View>
                  </View>
                  <View style={styles.paidStatusBadge}>
                    <CheckIcon size={14} color="#16a34a" />
                    <Text style={styles.paidStatusText}>Đã thu đủ</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'debt' && (
          <View style={styles.list}>
            {debt.length === 0 ? (
              <Text style={styles.emptyTxt}>Không có phòng nào nợ đóng thiếu.</Text>
            ) : (
              debt.map(item => (
                <View key={item.id} style={styles.premiumCard}>
                  <View style={styles.cardInfoRow}>
                    <View style={[styles.avatarCircle, { backgroundColor: '#fef3c7' }]}>
                      <Text style={[styles.avatarText, { color: '#b45309' }]}>
                        {item.name ? item.name.charAt(0) : 'P'}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.roomName}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <UserIcon size={12} color="#64748b" />
                        <Text style={styles.tenantName}>{item.tenant || 'Khách thuê'}</Text>
                      </View>
                      <Text style={styles.amountOrange}>
                        Nợ cũ: {Number(item.displayAmount).toLocaleString('vi')} đ
                      </Text>
                      <Text style={styles.cardMeta}>Cộng dồn tự động vào tháng sau</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Collect Money Dialog Popup */}
      {selectedRoomForCollect && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={isCollectModalVisible}
          onRequestClose={() => setIsCollectModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalContainerPremium}>
                  <View style={styles.modalHeaderRow}>
                    <View style={styles.modalIconBg}>
                      <MoneyIcon size={22} color="#16a34a" />
                    </View>
                    <Text style={styles.modalTitlePremium}>{`Thu tiền phòng ${selectedRoomForCollect.name}`}</Text>
                  </View>
                  
                  <View style={styles.modalBodyPremium}>
                    <View style={styles.modalValueCard}>
                      <Text style={styles.modalValueLabel}>TỔNG TIỀN PHẢI THU</Text>
                      <Text style={styles.modalValueAmount}>
                        {Number(selectedRoomForCollect.displayAmount).toLocaleString('vi')} đ
                      </Text>
                    </View>
                    
                    <Text style={styles.modalInputLabelPremium}>SỐ TIỀN THỰC THU (KHÁCH ĐƯA)</Text>
                    <View style={styles.modalInputWrapper}>
                      <TextInput
                        style={styles.modalInputPremium}
                        keyboardType="numeric"
                        value={collectAmountPaid}
                        onChangeText={(val) => setCollectAmountPaid(formatNumberWithCommas(val))}
                        placeholder="0"
                      />
                      <Text style={styles.modalInputSuffix}>đ</Text>
                    </View>
                    
                    {parseFormattedNumber(collectAmountPaid) < selectedRoomForCollect.displayAmount && parseFormattedNumber(collectAmountPaid) > 0 && (
                      <View style={styles.modalWarningBoxPremium}>
                        <AlertTriangleIcon size={18} color="#d97706" style={{ marginTop: 2 }} />
                        <Text style={styles.modalWarningText}>
                          {`Khách đóng thiếu: ${(selectedRoomForCollect.displayAmount - parseFormattedNumber(collectAmountPaid)).toLocaleString('vi')} đ. Số tiền này sẽ tự động cộng dồn vào hóa đơn của tháng sau.`}
                        </Text>
                      </View>
                    )}

                    {parseFormattedNumber(collectAmountPaid) > selectedRoomForCollect.displayAmount && (
                      <View style={[styles.modalWarningBoxPremium, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                        <AlertTriangleIcon size={18} color="#2563eb" style={{ marginTop: 2 }} />
                        <Text style={[styles.modalWarningText, { color: '#1d4ed8' }]}>
                          {`Khách đóng thừa: ${(parseFormattedNumber(collectAmountPaid) - selectedRoomForCollect.displayAmount).toLocaleString('vi')} đ. Vui lòng thối lại (trả lại) tiền thừa cho khách hoặc kiểm tra lại số tiền.`}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity 
                      style={styles.modalCancelBtn}
                      onPress={() => setIsCollectModalVisible(false)}
                      disabled={isCollecting}
                    >
                      <Text style={styles.modalCancelBtnText}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.modalConfirmBtn}
                      onPress={handleConfirmCollectPayment}
                      disabled={isCollecting}
                    >
                      <Text style={styles.modalConfirmBtnText}>
                        {isCollecting ? "Đang xử lý..." : "Xác nhận thu"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Invoice Options Bottom Sheet Popup */}
      {selectedRoomForInvoice && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isInvoiceModalVisible}
          onRequestClose={() => setIsInvoiceModalVisible(false)}
        >
          <View style={styles.bottomSheetOverlay}>
            <TouchableOpacity 
              style={StyleSheet.absoluteFill} 
              activeOpacity={1} 
              onPress={() => setIsInvoiceModalVisible(false)} 
            />
            <View style={styles.bottomSheetContainer}>
              <View style={styles.bottomSheetHeader}>
                <View style={styles.bottomSheetKnob} />
                <Text style={styles.bottomSheetTitle}>{`Hóa đơn phòng ${selectedRoomForInvoice.name}`}</Text>
                <Text style={styles.bottomSheetSub}>Chọn phương thức gửi hóa đơn tháng {selectedMonth}/{selectedYear}</Text>
              </View>
              
              <View style={styles.bottomSheetBody}>
                <TouchableOpacity 
                  style={styles.sheetItem}
                  onPress={() => handleGenerateInvoiceImage(selectedRoomForInvoice, 'share')}
                >
                  <View style={[styles.sheetItemIconBg, { backgroundColor: '#e0f2fe' }]}>
                    <ShareIcon size={22} color="#0284c7" />
                  </View>
                  <View style={styles.sheetItemText}>
                    <Text style={styles.sheetItemTitle}>Gửi qua Zalo</Text>
                    <Text style={styles.sheetItemDesc}>Chia sẻ trực tiếp ảnh hóa đơn kèm mã QR thanh toán nhanh</Text>
                  </View>
                  <ChevronIcon size={16} color={COLORS.g4} style={{ transform: [{ rotate: '0deg' }] }} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.sheetItem}
                  onPress={() => handleGenerateInvoiceImage(selectedRoomForInvoice, 'save')}
                >
                  <View style={[styles.sheetItemIconBg, { backgroundColor: '#dcfce7' }]}>
                    <DownloadIcon size={22} color="#16a34a" />
                  </View>
                  <View style={styles.sheetItemText}>
                    <Text style={styles.sheetItemTitle}>Lưu vào thư viện ảnh</Text>
                    <Text style={styles.sheetItemDesc}>Tải hình ảnh hóa đơn về máy để gửi sau</Text>
                  </View>
                  <ChevronIcon size={16} color={COLORS.g4} style={{ transform: [{ rotate: '0deg' }] }} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.sheetCloseBtn}
                onPress={() => setIsInvoiceModalVisible(false)}
              >
                <Text style={styles.sheetCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Loading overlay for background invoice generation */}
      <Modal
        transparent={true}
        visible={isGeneratingInvoice}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { alignItems: 'center', justifyContent: 'center', gap: 15 }]}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#334155', textAlign: 'center' }}>
              {invoiceStatusText}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Offscreen hidden invoice container for image capturing */}
      {selectedRoomForInvoice && invoiceStats && (
        <View style={{ position: 'absolute', left: -9999, top: 0, width: 375, opacity: 0 }}>
          <CaptureView ref={invoiceViewRef} options={{ format: "png", quality: 0.9 }}>
            <View style={hiddenStyles.captureArea}>
              <View style={hiddenStyles.receiptPaper}>
                {/* Header */}
                <View style={hiddenStyles.billHeader}>
                  <Text style={hiddenStyles.bhLodge}>{lodge?.name || 'RentHub'}</Text>
                  <Text style={hiddenStyles.bhTitle}>{t('invoiceTitle')}</Text>
                  <View style={hiddenStyles.bhRow}>
                    <Text style={hiddenStyles.bhRoom}>{t('room')}: {selectedRoomForInvoice.name}</Text>
                    <View style={hiddenStyles.bhDot} />
                    <Text style={hiddenStyles.bhDate}>{t('month')} {invoiceStats.targetMonth + 1}/{invoiceStats.targetYear}</Text>
                  </View>
                </View>

                <View style={hiddenStyles.dashLine} />

                {/* QR Section */}
                {!!invoiceStats.qrUrl && (
                  <View style={hiddenStyles.qrSection}>
                    <View style={hiddenStyles.qrBox}>
                      <Image source={{ uri: invoiceStats.qrUrl }} style={hiddenStyles.qrBig} />
                    </View>
                  </View>
                )}

                {/* Bank Details */}
                <View style={hiddenStyles.bankSide}>
                  <View style={hiddenStyles.bankRowCol}>
                    <Text style={hiddenStyles.bLblMini}>{t('bankAccount')}</Text>
                    <Text style={hiddenStyles.bValHigh}>{lodge?.bank}</Text>
                  </View>
                  <View style={hiddenStyles.bankRowCol}>
                    <Text style={hiddenStyles.bLblMini}>{t('bankName')}</Text>
                    <Text style={hiddenStyles.bValMini}>{lodge?.bankName}</Text>
                  </View>
                  <View style={hiddenStyles.bankRowCol}>
                    <Text style={hiddenStyles.bLblMini}>{t('bankOwner')}</Text>
                    <Text style={hiddenStyles.bValMini}>{lodge?.name}</Text>
                  </View>
                  <View style={[hiddenStyles.bankRowCol, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Text style={hiddenStyles.bLblMini}>{t('transferDetails')}</Text>
                    <Text style={hiddenStyles.bValHigh}>{selectedRoomForInvoice.name} Thang {(invoiceStats.targetMonth + 1)}</Text>
                  </View>
                </View>

                <View style={hiddenStyles.dashLine} />

                {/* Total Amount */}
                <View style={hiddenStyles.totalSection}>
                  <Text style={[hiddenStyles.tcLbl, { color: '#64748b' }]}>{t('totalDue')}</Text>
                  <Text style={[hiddenStyles.tcVal, { color: COLORS.pr }]}>{invoiceStats.finalTotal.toLocaleString('vi')} đ</Text>
                  <Text style={[hiddenStyles.tcDate, { color: '#94a3b8' }]}>{t('dueDate')}: {invoiceStats.formattedExpectedDate}</Text>
                </View>

                <View style={hiddenStyles.dashLine} />

                {/* Details */}
                <Text style={hiddenStyles.secTit}>{t('serviceDetails')}</Text>
                <View style={hiddenStyles.detailRow}>
                  <Text style={[hiddenStyles.dLbl, invoiceStats.debtMonths >= 2 && { color: COLORS.rose }]}>
                    {t('rent')} {invoiceStats.debtMonths >= 2 ? t('rentMonths', { count: invoiceStats.debtMonths }) : ''}
                  </Text>
                  <Text style={[hiddenStyles.dVal, invoiceStats.debtMonths >= 2 && { color: COLORS.rose }]}>
                    {invoiceStats.rent.toLocaleString('vi')} đ
                  </Text>
                </View>
                <View style={hiddenStyles.detailRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={hiddenStyles.dLbl}>{t('electricity')} ({invoiceStats.eUse} kWh)</Text>
                    <Text style={hiddenStyles.dSub}>{t('electricityDetail', { prior: invoiceStats.pElecValue, current: invoiceStats.cElec })}</Text>
                  </View>
                  <Text style={hiddenStyles.dVal}>{invoiceStats.eAmt.toLocaleString('vi')} đ</Text>
                </View>
                <View style={hiddenStyles.detailRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      hiddenStyles.dLbl, 
                      (prices?.waterMode === 'fixed' && invoiceStats.debtMonths >= 2) && { color: COLORS.rose }
                    ]}>
                      {t('water')} {prices?.waterMode === 'fixed' ? t('waterFixed') : `(${invoiceStats.wUse} m³)`}
                      {(prices?.waterMode === 'fixed' && invoiceStats.debtMonths >= 2) ? ` ${t('rentMonths', { count: invoiceStats.debtMonths })}` : ''}
                    </Text>
                    {prices?.waterMode !== 'fixed' && (
                      <Text style={hiddenStyles.dSub}>{t('electricityDetail', { prior: invoiceStats.pWaterValue, current: invoiceStats.cWater })}</Text>
                    )}
                  </View>
                  <Text style={[
                    hiddenStyles.dVal, 
                    (prices?.waterMode === 'fixed' && invoiceStats.debtMonths >= 2) && { color: COLORS.rose }
                  ]}>
                    {invoiceStats.wAmt.toLocaleString('vi')} đ
                  </Text>
                </View>
                <View style={hiddenStyles.detailRow}>
                  <Text style={[hiddenStyles.dLbl, invoiceStats.debtMonths >= 2 && { color: COLORS.rose }]}>
                    {t('wifiGarbage')} {invoiceStats.debtMonths >= 2 ? t('rentMonths', { count: invoiceStats.debtMonths }) : ''}
                  </Text>
                  <Text style={[hiddenStyles.dVal, invoiceStats.debtMonths >= 2 && { color: COLORS.rose }]}>
                    {invoiceStats.fees.toLocaleString('vi')} đ
                  </Text>
                </View>
                {invoiceStats.prepaid > 0 && (
                  <View style={hiddenStyles.detailRow}>
                    <Text style={[hiddenStyles.dLbl, { color: COLORS.sky }]}>{t('prepaidDeduct')}</Text>
                    <Text style={[hiddenStyles.dVal, { color: COLORS.sky }]}>-{invoiceStats.prepaid.toLocaleString('vi')} đ</Text>
                  </View>
                )}
                {invoiceStats.priorDebt > 0 && (
                  <View style={hiddenStyles.detailRow}>
                    <Text style={[hiddenStyles.dLbl, { color: COLORS.rose, fontWeight: 'bold' }]}>{t('priorDebt') || 'Nợ cũ (Hóa đơn trước)'}</Text>
                    <Text style={[hiddenStyles.dVal, { color: COLORS.rose, fontWeight: 'bold' }]}>{invoiceStats.priorDebt.toLocaleString('vi')} đ</Text>
                  </View>
                )}

                {selectedRoomForInvoice.contractPrepaid > 0 && (
                  <View style={[hiddenStyles.infoPill, { marginTop: 15 }]}>
                    <View style={hiddenStyles.pillIcon}>
                      <Text style={{ color: '#166534', fontWeight: 'bold' }}>ⓘ</Text>
                    </View>
                    <Text style={hiddenStyles.pillTxt}>
                      {t('prepaidContractNote', { count: selectedRoomForInvoice.contractPrepaid })}
                    </Text>
                  </View>
                )}

                <Text style={hiddenStyles.footerNote}>{t('thankYou')}</Text>
              </View>
            </View>
          </CaptureView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    fontWeight: '600',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  pickerBtnTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  pickerBtnArrow: {
    marginLeft: 6,
    transform: [{ rotate: '90deg' }],
  },
  dropdownMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 16,
    width: 140,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 6,
    zIndex: 1000,
    ...SHADOWS.sh2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dropdownMenuItemActive: {
    backgroundColor: '#f0fdf4',
  },
  dropdownMenuItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  dropdownMenuItemTextActive: {
    color: '#16a34a',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 12,
    ...SHADOWS.sh,
    marginTop: 4,
    marginBottom: -48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    backgroundColor: '#cbd5e1',
  },
  tabsWrapper: {
    backgroundColor: '#f8fafc',
    paddingTop: 16,
    paddingBottom: 8,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: COLORS.white,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  list: {
    gap: 12,
  },
  premiumCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sh,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  premiumCardVertical: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    ...SHADOWS.sh,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardInfo: {
    flex: 1,
    gap: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  tenantName: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  cardMeta: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  badgeRose: {
    backgroundColor: '#ffe4e6',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  badgeRoseText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
  },
  amountDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  amountRed: {
    fontSize: 18,
    fontWeight: '900',
    color: '#e11d48',
  },
  amountGreen: {
    fontSize: 16,
    fontWeight: '900',
    color: '#16a34a',
    marginTop: 4,
  },
  amountOrange: {
    fontSize: 16,
    fontWeight: '900',
    color: '#d97706',
    marginTop: 4,
  },
  paidStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  paidStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },
  cardButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtnOutlinePremium: {
    flex: 1,
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  actionBtnOutlineText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16a34a',
  },
  actionBtnPrimaryPremium: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sh,
    shadowColor: '#16a34a',
    shadowOpacity: 0.15,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  actionBtnPrimaryCompact: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTxt: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 40,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainerPremium: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.sh2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  modalIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#e6f4ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitlePremium: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    flex: 1,
  },
  modalBodyPremium: {
    gap: 14,
    marginBottom: 20,
  },
  modalValueCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalValueLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  modalValueAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalInputLabelPremium: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
  },
  modalInputPremium: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalInputSuffix: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748b',
  },
  modalWarningBoxPremium: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  modalWarningText: {
    flex: 1,
    fontSize: 11,
    color: '#b45309',
    fontWeight: '700',
    lineHeight: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sh,
    shadowColor: '#16a34a',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 10,
    ...SHADOWS.sh2,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomSheetKnob: {
    width: 36,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  bottomSheetSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  bottomSheetBody: {
    gap: 12,
    marginBottom: 20,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sheetItemIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sheetItemText: {
    flex: 1,
  },
  sheetItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  sheetItemDesc: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 14,
  },
  sheetCloseBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#475569',
  },
});

const hiddenStyles = StyleSheet.create({
  captureArea: { backgroundColor: '#f0fdf4', padding: 10 },
  receiptPaper: { backgroundColor: COLORS.white, borderRadius: 16, padding: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2 },
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
});

export default DebtScreen;
