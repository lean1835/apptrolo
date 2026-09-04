// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../../../styles/Theme';
import { BackIcon, BoltIcon, DropletIcon, UserIcon, CheckIcon, AlertTriangleIcon, DoorIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Button, Input } from '../../../components/Common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [room, setRoom] = useState(null);
  const [prices, setPrices] = useState(null);

  // Step 1: Input final readings & date
  const [step, setStep] = useState(1);
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalElec, setFinalElec] = useState('');
  const [finalWater, setFinalWater] = useState('');

  // Step 2: Audit data from backend
  const [previewData, setPreviewData] = useState(null);
  const [billActions, setBillActions] = useState({}); // { [billKey]: { action: 'pay' | 'freeze_debt', amountPaid: number } }

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const resRoom = await axiosInstance.get(`/rooms/${id}?t=${new Date().getTime()}`);
      setRoom(resRoom.data);

      const resPrices = await axiosInstance.get(`/utility-prices`);
      setPrices(resPrices.data || {});

      // Pre-fill latest readings
      const readings = resRoom.data?.meterReadings || [];
      const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;
      const baseElec = latestReading ? latestReading.elec : (resRoom.data?.handoverElec || resRoom.data?.initialElec || resRoom.data?.ep || 0);
      const baseWater = latestReading ? latestReading.water : (resRoom.data?.handoverWater || resRoom.data?.initialWater || resRoom.data?.wp || 0);

      setFinalElec(baseElec.toString());
      setFinalWater(baseWater.toString());
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải thông tin phòng');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewCheckout = async () => {
    const elecVal = parseFloat(finalElec);
    const waterVal = parseFloat(finalWater);

    if (isNaN(elecVal)) {
      Alert.alert('Lỗi', 'Vui lòng nhập chỉ số điện cuối cùng');
      return;
    }

    if (prices?.waterMode === 'meter' && isNaN(waterVal)) {
      Alert.alert('Lỗi', 'Vui lòng nhập chỉ số nước cuối cùng');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axiosInstance.post(`/rooms/${id}/checkout-preview`, {
        checkoutDate,
        finalElec: elecVal,
        finalWater: prices?.waterMode === 'meter' ? waterVal : 0,
      });

      const data = res.data?.data;
      setPreviewData(data);

      // Initialize default actions for bills
      const initialActions = {};
      // Checkout bill
      initialActions['checkout_bill'] = {
        action: data.checkoutBill?.total === 0 ? 'pay' : 'pay',
        amountPaid: data.checkoutBill?.total || 0,
        isCheckoutBill: true,
      };
      // Other unpaid bills
      (data.unpaidBills || []).forEach((b) => {
        const remaining = Math.max(0, b.total - (b.amountPaid || 0));
        initialActions[b._id || b.id] = {
          action: remaining === 0 ? 'pay' : 'pay',
          amountPaid: remaining,
          billId: b._id || b.id,
        };
      });

      setBillActions(initialActions);
      setStep(2);
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể tạo quyết toán');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteCheckout = async () => {
    // Audit Check: Ensure all bills have an action selected
    const checkoutAction = billActions['checkout_bill'];
    if (!checkoutAction) {
      Alert.alert('Cảnh báo', 'Vui lòng chọn xử lý cho Hóa đơn chia tay.');
      return;
    }

    const unpaidList = previewData?.unpaidBills || [];
    for (const b of unpaidList) {
      const bKey = b._id || b.id;
      if (!billActions[bKey]) {
        Alert.alert('Cảnh báo', `Vui lòng chọn xử lý cho hóa đơn ngày ${b.date}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const settledBills = Object.keys(billActions).map((k) => ({
        ...billActions[k],
      }));

      await axiosInstance.post(`/rooms/${id}/checkout-complete`, {
        checkoutDate,
        finalElec: parseFloat(finalElec) || 0,
        finalWater: parseFloat(finalWater) || 0,
        checkoutBill: previewData?.checkoutBill,
        settledBills,
      });

      Alert.alert('Thành công', 'Đã hoàn tất thủ tục trả phòng. Phòng đã chuyển về trạng thái Trống.', [
        {
          text: 'Đồng ý',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || err.message || 'Không thể hoàn tất trả phòng');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.pr} />
        <Text style={{ marginTop: 10, color: COLORS.g3 }}>Đang tải dữ liệu trả phòng...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Topbar */}
      <View style={[styles.topbar, { paddingTop: Math.max(insets.top + 10, 24) }]}>
        <TouchableOpacity style={styles.tbback} onPress={() => (step === 2 ? setStep(1) : router.back())}>
          <BackIcon size={24} color={COLORS.g2} />
        </TouchableOpacity>
        <Text style={styles.tbtitle}>Trả phòng · {room?.name}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          /* STEP 1: CHỐT NGÀY & CHỈ SỐ CUỐI */
          <>
            <View style={styles.cardHeader}>
              <View style={styles.avatarWrap}>
                <UserIcon size={32} color={COLORS.rose} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tenantName}>{room?.tenant || 'Khách thuê'}</Text>
                <Text style={styles.roomSub}>
                  {room?.name} · Ngày vào: {room?.checkin || '--'}
                </Text>
              </View>
            </View>

            {/* Chốt ngày trả phòng */}
            <View style={styles.card}>
              <Text style={styles.cardTit}>1. NGÀY TRẢ PHÒNG THỰC TẾ</Text>
              <View style={styles.divider} />
              <Input
                label="Ngày trả phòng (YYYY-MM-DD) *"
                placeholder="2026-09-02"
                value={checkoutDate}
                onChangeText={setCheckoutDate}
              />
              <Text style={styles.hintTxt}>Ngày khách thực tế bàn giao chìa khóa và dời đi.</Text>
            </View>

            {/* Chỉ số điện cuối */}
            <View style={styles.card}>
              <View style={styles.hrow}>
                <BoltIcon size={20} color={COLORS.amber} />
                <Text style={styles.cardTit}>2. CHỈ SỐ ĐIỆN CUỐI CÙNG</Text>
              </View>
              <View style={styles.divider} />
              <Input
                label="Chỉ số điện mới nhất (kWh) *"
                placeholder="0"
                keyboardType="numeric"
                value={finalElec}
                onChangeText={setFinalElec}
              />
            </View>

            {/* Chỉ số nước cuối */}
            {prices?.waterMode === 'meter' ? (
              <View style={styles.card}>
                <View style={styles.hrow}>
                  <DropletIcon size={20} color={COLORS.sky} />
                  <Text style={styles.cardTit}>3. CHỈ SỐ NƯỚC CUỐI CÙNG</Text>
                </View>
                <View style={styles.divider} />
                <Input
                  label="Chỉ số nước mới nhất (m³) *"
                  placeholder="0"
                  keyboardType="numeric"
                  value={finalWater}
                  onChangeText={setFinalWater}
                />
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534' }}>
                  💧 Tiền nước cố định theo người
                </Text>
                <Text style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>
                  Sẽ được tự động cắt theo số ngày ở thực tế của kỳ cuối.
                </Text>
              </View>
            )}

            <Button
              title="Tiếp tục: Lập bảng kiểm toán chia tay"
              type="danger"
              onPress={handlePreviewCheckout}
              loading={submitting}
              full
              style={{ marginTop: 10 }}
            />
          </>
        ) : (
          /* STEP 2: BẢNG KIỂM TOÁN CHIA TAY & HÓA ĐƠN CUỐI */
          <>
            {/* Banner thừa tháng trả trước nếu có */}
            {previewData?.unusedPrepaidPeriods > 0 && (
              <View style={styles.warningBanner}>
                <AlertTriangleIcon size={20} color="#b45309" style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.warningBannerTitle}>
                    Khách còn thừa {previewData.unusedPrepaidPeriods} kỳ đã trả trước!
                  </Text>
                  <Text style={styles.warningBannerTxt}>
                    Vui lòng tự giao dịch hoàn tiền mặt bên ngoài giữa chủ trọ và khách. Hệ thống không tự tạo hóa đơn âm.
                  </Text>
                </View>
              </View>
            )}

            {/* Hóa đơn chia tay */}
            <View style={styles.card}>
              <View style={styles.hrow}>
                <DoorIcon size={20} color={COLORS.rose} />
                <Text style={[styles.cardTit, { color: COLORS.rose }]}>HÓA ĐƠN CHIA TAY (KỲ CUỐI)</Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.dLbl}>
                  Tiền phòng ({previewData?.checkoutBill?.daysStayed}/{previewData?.checkoutBill?.totalDaysInCycle} ngày)
                </Text>
                <Text style={styles.dVal}>
                  {Number(previewData?.checkoutBill?.rent || 0).toLocaleString('vi')} đ
                </Text>
              </View>

              {previewData?.checkoutBill?.prepaidDeduction > 0 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.dLbl, { color: COLORS.sky }]}>Khấu trừ trả trước</Text>
                  <Text style={[styles.dVal, { color: COLORS.sky }]}>
                    -{Number(previewData.checkoutBill.prepaidDeduction).toLocaleString('vi')} đ
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.dLbl}>
                  Điện ({previewData?.checkoutBill?.elecUsage} kWh)
                </Text>
                <Text style={styles.dVal}>
                  {Number(previewData?.checkoutBill?.elecAmount || 0).toLocaleString('vi')} đ
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.dLbl}>
                  Nước {prices?.waterMode === 'fixed' ? '(cố định)' : `(${previewData?.checkoutBill?.waterUsage} m³)`}
                </Text>
                <Text style={styles.dVal}>
                  {Number(previewData?.checkoutBill?.waterAmount || 0).toLocaleString('vi')} đ
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.dLbl}>Wifi & Rác</Text>
                <Text style={styles.dVal}>
                  {(
                    Number(previewData?.checkoutBill?.wifiAmount || 0) +
                    Number(previewData?.checkoutBill?.garbageAmount || 0)
                  ).toLocaleString('vi')}{' '}
                  đ
                </Text>
              </View>

              <View style={[styles.detailRow, { borderBottomWidth: 0, paddingTop: 10 }]}>
                <Text style={[styles.dLbl, { fontWeight: '900', color: COLORS.g1, fontSize: 14 }]}>
                  Tổng hóa đơn chia tay:
                </Text>
                <Text style={[styles.dVal, { fontWeight: '900', color: COLORS.rose, fontSize: 16 }]}>
                  {Number(previewData?.checkoutBill?.total || 0).toLocaleString('vi')} đ
                </Text>
              </View>

              {/* Action for checkout bill */}
              <View style={styles.actionChoiceWrap}>
                <Text style={styles.actionChoiceLabel}>XỬ LÝ HÓA ĐƠN CHIA TAY:</Text>
                <View style={styles.choiceRow}>
                  <TouchableOpacity
                    style={[
                      styles.choiceBtn,
                      billActions['checkout_bill']?.action === 'pay' && styles.choiceBtnActiveGreen,
                    ]}
                    onPress={() =>
                      setBillActions({
                        ...billActions,
                        checkout_bill: {
                          action: 'pay',
                          amountPaid: previewData?.checkoutBill?.total || 0,
                          isCheckoutBill: true,
                        },
                      })
                    }
                  >
                    <CheckIcon
                      size={14}
                      color={billActions['checkout_bill']?.action === 'pay' ? '#fff' : '#15803d'}
                    />
                    <Text
                      style={[
                        styles.choiceBtnTxt,
                        billActions['checkout_bill']?.action === 'pay' && styles.choiceBtnTxtActive,
                      ]}
                    >
                      Thu đủ ngay
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.choiceBtn,
                      billActions['checkout_bill']?.action === 'freeze_debt' && styles.choiceBtnActiveYellow,
                    ]}
                    onPress={() =>
                      setBillActions({
                        ...billActions,
                        checkout_bill: {
                          action: 'freeze_debt',
                          amountPaid: 0,
                          isCheckoutBill: true,
                        },
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.choiceBtnTxt,
                        { color: '#b45309' },
                        billActions['checkout_bill']?.action === 'freeze_debt' && styles.choiceBtnTxtActive,
                      ]}
                    >
                      Khoanh nợ cũ (F5)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Các hóa đơn nợ/thu thiếu cũ nếu có */}
            {(previewData?.unpaidBills || []).length > 0 && (
              <View style={styles.card}>
                <Text style={[styles.cardTit, { color: '#b45309' }]}>
                  CÁC HÓA ĐƠN NỢ / THU THIẾU CŨ ({previewData.unpaidBills.length} TỜ)
                </Text>
                <View style={styles.divider} />

                {previewData.unpaidBills.map((b) => {
                  const bKey = b._id || b.id;
                  const remaining = Math.max(0, b.total - (b.amountPaid || 0));
                  const currentChoice = billActions[bKey]?.action || 'pay';

                  return (
                    <View key={bKey} style={styles.unpaidBillCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.g1 }}>
                          Hóa đơn kỳ {b.date}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: COLORS.rose }}>
                          Thiếu: {remaining.toLocaleString('vi')} đ
                        </Text>
                      </View>

                      <View style={styles.choiceRow}>
                        <TouchableOpacity
                          style={[styles.choiceBtn, currentChoice === 'pay' && styles.choiceBtnActiveGreen]}
                          onPress={() =>
                            setBillActions({
                              ...billActions,
                              [bKey]: {
                                action: 'pay',
                                amountPaid: remaining,
                                billId: bKey,
                              },
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.choiceBtnTxt,
                              currentChoice === 'pay' && styles.choiceBtnTxtActive,
                            ]}
                          >
                            Thu nốt {remaining.toLocaleString('vi')} đ
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.choiceBtn,
                            currentChoice === 'freeze_debt' && styles.choiceBtnActiveYellow,
                          ]}
                          onPress={() =>
                            setBillActions({
                              ...billActions,
                              [bKey]: {
                                action: 'freeze_debt',
                                amountPaid: 0,
                                billId: bKey,
                              },
                            })
                          }
                        >
                          <Text
                            style={[
                              styles.choiceBtnTxt,
                              { color: '#b45309' },
                              currentChoice === 'freeze_debt' && styles.choiceBtnTxtActive,
                            ]}
                          >
                            Khoanh nợ cũ
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Button
              title="✓ Hoàn tất trả phòng (Chuyển phòng về Trống)"
              type="danger"
              onPress={handleCompleteCheckout}
              loading={submitting}
              full
              style={{ marginTop: 10 }}
            />
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topbar: {
    backgroundColor: COLORS.white,
    paddingBottom: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.sh,
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
  scroll: { padding: 14, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, ...SHADOWS.sh },
  cardHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...SHADOWS.sh,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffe4e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tenantName: { fontSize: 16, fontWeight: '900', color: COLORS.g1 },
  roomSub: { fontSize: 12, color: COLORS.g3, marginTop: 2, fontWeight: '600' },
  cardTit: { fontSize: 12, fontWeight: '900', color: COLORS.g3, letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  hrow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintTxt: { fontSize: 11, color: COLORS.g4, marginTop: 4, fontStyle: 'italic' },
  warningBanner: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningBannerTitle: { fontSize: 13, fontWeight: '900', color: '#92400e' },
  warningBannerTxt: { fontSize: 11, color: '#b45309', marginTop: 3, lineHeight: 16, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  dLbl: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  dVal: { fontSize: 13, color: '#0f172a', fontWeight: '800' },
  actionChoiceWrap: {
    marginTop: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionChoiceLabel: { fontSize: 11, fontWeight: '800', color: COLORS.g3, marginBottom: 8 },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choiceBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  choiceBtnActiveGreen: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  choiceBtnActiveYellow: { backgroundColor: '#d97706', borderColor: '#d97706' },
  choiceBtnTxt: { fontSize: 12, fontWeight: '800', color: '#16a34a' },
  choiceBtnTxtActive: { color: '#fff' },
  unpaidBillCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
});
