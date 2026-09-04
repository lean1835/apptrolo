// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../../../styles/Theme';
import { BackIcon, BoltIcon, DropletIcon, UserIcon, AlertTriangleIcon, LockIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Button, Input } from '../../../components/Common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardPadding } from '../../../hooks/useKeyboardPadding';

const MeterScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef(null);
    const kbHeight = useKeyboardPadding(scrollRef);
    const [room, setRoom] = useState(null);
    const [prices, setPrices] = useState(null);
    const [lodge, setLodge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [form, setForm] = useState({
        elec: '',
        water: '',
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resRoom, resPrices, resLodge] = await Promise.all([
                    axiosInstance.get(`/rooms/${id}?t=${new Date().getTime()}`),
                    axiosInstance.get(`/utility-prices`).catch(() => ({ data: {} })),
                    axiosInstance.get(`/lodge`).catch(() => ({ data: {} })),
                ]);
                const found = resRoom.data;
                const prc = resPrices.data || {};
                const ld = resLodge.data || {};
                setPrices(prc);
                setLodge(ld);

                let formElec = '';
                let formWater = '';
                let pElec = found.ep || 0;
                let pWater = found.wp || 0;

                const checkinDateStr = found.checkin || '';
                const filteredReadings = (found.meterReadings || []).filter(r => !checkinDateStr || r.date >= checkinDateStr);
                const filteredBills = (found.bills || []).filter(b => !checkinDateStr || b.date >= checkinDateStr);

                if (filteredReadings.length > 0) {
                    const allSorted = [...filteredReadings].sort((a,b) => {
                        const dateDiff = new Date(b.date) - new Date(a.date);
                        if (dateDiff !== 0) return dateDiff;
                        return (b.id || b._id || '').toString().localeCompare((a.id || a._id || '').toString());
                    });

                    const thisMonthReadings = [];
                    const priorReadings = [];

                    allSorted.forEach(r => {
                        const [ry, rm] = r.date.split('-');
                        const rYear = parseInt(ry, 10);
                        const rMonth = parseInt(rm, 10);

                        const isPaid = filteredBills.some(b => {
                            if (!b.collected) return false;
                            const [by, bm] = b.date.split('-');
                            return parseInt(by, 10) === rYear && parseInt(bm, 10) === rMonth;
                        });

                        if (isPaid) {
                            priorReadings.push(r);
                        } else {
                            thisMonthReadings.push(r);
                        }
                    });

                    if (thisMonthReadings.length > 0) {
                        formElec = thisMonthReadings[0].elec.toString();
                        formWater = thisMonthReadings[0].water.toString();
                    }
                    
                    if (priorReadings.length > 0) {
                        pElec = priorReadings[0].elec;
                        pWater = priorReadings[0].water;
                    }
                }

                // Add these dynamically so we can use them in calculateEstimate later
                found.calcPrevElec = pElec;
                found.calcPrevWater = pWater;

                setRoom(found);

                setForm(f => ({
                    ...f,
                    elec: formElec,
                    water: formWater
                }));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const [isMeterReplaced, setIsMeterReplaced] = useState(false);

    const handleSave = async () => {
        const elecVal = parseFloat(form.elec) || 0;
        const waterVal = parseFloat(form.water) || 0;
        const prevElec = room?.calcPrevElec || 0;
        const prevWater = room?.calcPrevWater || 0;

        if (!isMeterReplaced && elecVal < prevElec) {
            Alert.alert("Cảnh báo", `Chỉ số điện mới (${elecVal}) không được nhỏ hơn kỳ trước (${prevElec}). Nếu phòng vừa thay công tơ mới, vui lòng bật cờ 'Thay đồng hồ'.`);
            return;
        }

        if (!isMeterReplaced && prices?.waterMode !== 'fixed' && waterVal < prevWater) {
            Alert.alert("Cảnh báo", `Chỉ số nước mới (${waterVal}) không được nhỏ hơn kỳ trước (${prevWater}). Nếu phòng vừa thay công tơ mới, vui lòng bật cờ 'Thay đồng hồ'.`);
            return;
        }

        setSaving(true);
        try {
            const targetDate = cycleInfo.closingDateStr || form.date;
            await axiosInstance.post(`/rooms/${id}/meter-readings`, {
                elec: elecVal,
                water: waterVal,
                date: targetDate,
                isMeterReplaced,
            });
            
            Alert.alert("Thành công", "Đã lưu chỉ số điện nước mới");
            const [tY, tM] = targetDate.split('-');
            router.replace({
                pathname: '/(tabs)/debt',
                params: {
                    month: parseInt(tM, 10),
                    year: parseInt(tY, 10),
                    tab: 'unpaid',
                    refresh: Date.now()
                }
            });
        } catch (err) {
            Alert.alert("Lỗi", err.response?.data?.message || "Không thể lưu chỉ số");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View style={styles.loading}><Text>Đang tải...</Text></View>;

    const eUse = (parseFloat(form.elec) || 0) - (parseFloat(room?.calcPrevElec) || 0);
    const wUse = (parseFloat(form.water) || 0) - (parseFloat(room?.calcPrevWater) || 0);

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

    const getActiveCycleInfo = () => {
        const today = new Date();
        const D = lodge?.billingDate || 25;
        const earlyRecordDays = lodge?.earlyRecordDays !== undefined ? lodge.earlyRecordDays : 3;
        const checkinDateStr = room?.checkin || '';

        if (!checkinDateStr) {
            return {
                isEarly: false,
                expectedDate: null,
                allowedStart: null,
                cycleLabel: '',
                periodText: '',
                prorateMsg: null,
                closingDateStr: new Date().toISOString().split('T')[0],
            };
        }

        const dCheckin = parseDate(checkinDateStr);
        const filteredBills = (room?.bills || []).filter(b => !checkinDateStr || b.date >= checkinDateStr);

        // If room is in debt or has any unpaid bills, completely suppress early warning (theo F5)
        const hasUnpaidBills = filteredBills.some(b => !b.collected && (b.amountPaid || 0) < b.total);
        const inDebt = room?.status === 'debt' || room?.status === 'Debt' || hasUnpaidBills;

        const isFirstBill = filteredBills.length === 0;

        let cStart;
        let cEnd;
        let prorateMsg = null;

        if (isFirstBill) {
            // Hóa đơn đầu tiên = kỳ chứa ngày khách vào (theo F3.D)
            if (dCheckin.getDate() < D) {
                cStart = new Date(dCheckin.getFullYear(), dCheckin.getMonth() - 1, D);
                cEnd = new Date(dCheckin.getFullYear(), dCheckin.getMonth(), D);
            } else {
                cStart = new Date(dCheckin.getFullYear(), dCheckin.getMonth(), D);
                cEnd = new Date(dCheckin.getFullYear(), dCheckin.getMonth() + 1, D);
            }

            const totalDays = Math.max(1, Math.round((cEnd.getTime() - cStart.getTime()) / (1000 * 3600 * 24)));
            const stayedDays = Math.max(1, Math.round((cEnd.getTime() - dCheckin.getTime()) / (1000 * 3600 * 24)));

            if (stayedDays <= 3) {
                // Luật vụn: nếu lúc khách vào, kỳ hiện tại còn <= 3 ngày thì bỏ kỳ vụn, kỳ đầu là kỳ kế tiếp tròn tháng
                cStart = new Date(cEnd);
                cEnd = new Date(cEnd.getFullYear(), cEnd.getMonth() + 1, D);
            } else if (stayedDays < totalDays) {
                prorateMsg = `Khách vào ngày ${dCheckin.getDate()}/${dCheckin.getMonth() + 1} (ở ${stayedDays}/${totalDays} ngày). Tiền phòng và phí sẽ nhân ${stayedDays}/${totalDays}.`;
            }
        } else {
            // Các kỳ sau: nối tiếp từ kỳ gần nhất đã ghi
            let latestEnd = new Date(dCheckin);
            filteredBills.forEach(b => {
                const d = parseDate(b.periodEnd || b.date);
                if (!isNaN(d.getTime()) && d > latestEnd) {
                    latestEnd = d;
                }
            });
            cStart = new Date(latestEnd);
            cEnd = new Date(latestEnd.getFullYear(), latestEnd.getMonth() + 1, D);
        }

        const expectedDate = new Date(cEnd);
        const allowedStart = new Date(expectedDate);
        allowedStart.setDate(allowedStart.getDate() - earlyRecordDays);

        const isEarly = !inDebt && (today < allowedStart);

        // Nhãn tháng = tháng của ngày mở kỳ (theo F2.0)
        const labelMonth = cStart.getMonth() + 1;
        const labelYear = cStart.getFullYear();
        const cycleLabel = `Tháng ${labelMonth}/${labelYear}`;

        const pad = (n) => n.toString().padStart(2, '0');
        const displayStart = isFirstBill && prorateMsg ? dCheckin : cStart;
        const periodText = `${pad(displayStart.getDate())}/${pad(displayStart.getMonth() + 1)} đến ${pad(cEnd.getDate())}/${pad(cEnd.getMonth() + 1)}/${cEnd.getFullYear()}`;
        const closingDateStr = `${cEnd.getFullYear()}-${pad(cEnd.getMonth() + 1)}-${pad(cEnd.getDate())}`;

        return {
            isEarly,
            expectedDate,
            allowedStart,
            cycleLabel,
            periodText,
            prorateMsg,
            closingDateStr,
            cStart,
            cEnd,
        };
    };

    const cycleInfo = getActiveCycleInfo();
    const isEarly = cycleInfo.isEarly;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
        >
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={[styles.topbar, { paddingTop: Math.max(insets.top, 14) }]}>
                <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
                    <BackIcon size={24} color={COLORS.g2} />
                </TouchableOpacity>
                <Text style={styles.tbtitle}>Ghi điện nước · {room?.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {cycleInfo.isEarly && (
                    <View style={styles.earlyWarningLocked}>
                       <LockIcon size={16} color="#b91c1c" style={{ marginTop: 2 }} />
                       <Text style={styles.earlyWarningTxtLocked}>
                          Chưa đến hạn ghi điện nước! Phòng này chỉ được ghi từ ngày {cycleInfo.allowedStart ? `${cycleInfo.allowedStart.getDate().toString().padStart(2,'0')}/${(cycleInfo.allowedStart.getMonth() + 1).toString().padStart(2,'0')}/${cycleInfo.allowedStart.getFullYear()}` : ''} (trước {lodge?.earlyRecordDays || 3} ngày so với ngày thu dự kiến {cycleInfo.expectedDate ? `${cycleInfo.expectedDate.getDate().toString().padStart(2,'0')}/${(cycleInfo.expectedDate.getMonth() + 1).toString().padStart(2,'0')}/${cycleInfo.expectedDate.getFullYear()}` : ''}).
                       </Text>
                    </View>
                )}
                <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                   <View style={{ padding: 15, backgroundColor: '#f0fdf4', alignItems: 'center' }}>
                      <UserIcon size={36} color={COLORS.pr} />
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#065f46', marginTop: 6 }}>{room?.tenant}</Text>
                      <Text style={{ fontSize: 12, color: '#059669', fontWeight: '800', marginTop: 2 }}>
                        {room?.name} · Nhãn: {cycleInfo.cycleLabel}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 }}>
                        Kỳ: {cycleInfo.periodText}
                      </Text>
                      {cycleInfo.prorateMsg && (
                        <View style={{ backgroundColor: '#e0f2fe', width: '100%', paddingVertical: 8, paddingHorizontal: 12, marginTop: 10, borderTopWidth: 1, borderColor: '#bae6fd' }}>
                           <Text style={{ fontSize: 11, color: '#0369a1', fontWeight: '700', textAlign: 'center' }}>
                             ⓘ Hóa đơn đầu: {cycleInfo.prorateMsg}
                           </Text>
                        </View>
                      )}
                   </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.hrow}>
                        <BoltIcon size={20} color={COLORS.amber} />
                        <Text style={styles.htit}>CHỈ SỐ ĐIỆN</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.drow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.dlbl}>Kỳ trước (kWh)</Text>
                            <View style={[styles.valBox, { marginBottom: 12 }]}>
                                <Text style={styles.dval}>{room?.calcPrevElec !== undefined && room?.calcPrevElec !== null ? room.calcPrevElec : 0}</Text>
                            </View>
                        </View>
                        <View style={{ width: 15 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.dlbl}>Kỳ này (kWh) *</Text>
                            <Input 
                                placeholder="Số mới"
                                keyboardType="numeric"
                                value={form.elec}
                                onChangeText={(v) => setForm({...form, elec: v})}
                                error={form.elec !== '' && (parseFloat(form.elec) || 0) < (room?.calcPrevElec || 0) ? "Số mới < số cũ" : null}
                                readonly={isEarly}
                            />
                        </View>
                    </View>
                    {parseFloat(form.elec) >= (room?.calcPrevElec || 0) && eUse > 0 && (
                        <Text style={styles.consumeTxt}>Tiêu thụ: {eUse} kWh</Text>
                    )}
                </View>

                {prices?.waterMode !== 'fixed' ? (
                    <View style={styles.card}>
                        <View style={styles.hrow}>
                            <DropletIcon size={20} color={COLORS.sky} />
                            <Text style={styles.htit}>CHỈ SỐ NƯỚC</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.drow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.dlbl}>Kỳ trước (m³)</Text>
                                <View style={[styles.valBox, { marginBottom: 12 }]}>
                                    <Text style={styles.dval}>{room?.calcPrevWater !== undefined && room?.calcPrevWater !== null ? room.calcPrevWater : 0}</Text>
                                </View>
                            </View>
                            <View style={{ width: 15 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.dlbl}>Kỳ này (m³) *</Text>
                                <Input 
                                    placeholder="Số mới"
                                    keyboardType="numeric"
                                    value={form.water}
                                    onChangeText={(v) => setForm({...form, water: v})}
                                    error={form.water !== '' && (parseFloat(form.water) || 0) < (room?.calcPrevWater || 0) ? "Số mới < số cũ" : null}
                                    readonly={isEarly}
                                />
                            </View>
                        </View>
                        {parseFloat(form.water) >= (room?.calcPrevWater || 0) && wUse > 0 && (
                            <Text style={styles.consumeTxt}>Tiêu thụ: {wUse} m³</Text>
                        )}
                    </View>
                ) : (
                    <View style={[styles.card, { borderColor: COLORS.sky, borderWidth: 1 }]}>
                        <View style={styles.hrow}>
                            <DropletIcon size={20} color={COLORS.sky} />
                            <Text style={[styles.htit, { color: COLORS.sky }]}>TIỀN NƯỚC (CỐ ĐỊNH)</Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '900', marginTop: 10 }}>{(prices?.waterFixed || 0).toLocaleString('vi')} đ / tháng</Text>
                        <Text style={{ fontSize: 11, color: COLORS.g3, marginTop: 4 }}>Không theo công tơ · Thay đổi trong Cài đặt → Đơn giá</Text>
                    </View>
                )}

                <TouchableOpacity 
                    style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 }]}
                    onPress={() => setIsMeterReplaced(!isMeterReplaced)}
                >
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.g1 }}>Cờ Thay Đồng Hồ Mới</Text>
                        <Text style={{ fontSize: 11, color: COLORS.g4, marginTop: 2 }}>Bật nếu phòng vừa thay công tơ điện/nước mới để reset chỉ số</Text>
                    </View>
                    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: isMeterReplaced ? COLORS.pr : COLORS.g4, backgroundColor: isMeterReplaced ? COLORS.pr : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {isMeterReplaced && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                    </View>
                </TouchableOpacity>

                <View style={styles.card}>
                   <Text style={[styles.dlbl, { marginBottom: 10 }]}>NGÀY GHI</Text>
                   <Input 
                       placeholder="YYYY-MM-DD"
                       value={form.date}
                       onChangeText={(v) => setForm({...form, date: v})}
                       readonly={isEarly}
                   />
                   <Text style={{ fontSize: 10, color: COLORS.g3 }}>Nếu ghi muộn (sang tháng mới), hóa đơn tháng trước sẽ được tạo.</Text>
                </View>

                <Button 
                    title="✓ Lưu" 
                    type="primary" 
                    onPress={() => handleSave()} 
                    loading={saving}
                    disabled={isEarly}
                    full 
                    style={{ marginTop: 10 }} 
                />
                
                <View style={{ height: Math.max(40, kbHeight) }} />
            </ScrollView>
        </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topbar: {
        backgroundColor: COLORS.white,
        paddingTop: 50,
        paddingBottom: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
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
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        ...SHADOWS.sh,
    },
    hrow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    htit: { fontSize: 11, fontWeight: '900', color: '#94a3b8' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
    drow: { flexDirection: 'row', alignItems: 'flex-start' },
    dlbl: { fontSize: 10, color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
    dval: { fontSize: 14, color: COLORS.g3, fontWeight: '700' },
    valBox: {
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 13,
        borderWidth: 1.5,
        borderColor: COLORS.g5,
    },
    consumeTxt: { fontSize: 12, color: COLORS.pr, fontWeight: '900', marginTop: 10 },
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
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 18,
        flex: 1,
    },
    earlyWarningLocked: {
        backgroundColor: '#fee2e2',
        borderWidth: 1,
        borderColor: '#ef4444',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
    },
    earlyWarningTxtLocked: {
        color: '#991b1b',
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 18,
        flex: 1,
    },
});

export default MeterScreen;

