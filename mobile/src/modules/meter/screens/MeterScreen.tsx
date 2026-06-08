// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../../../styles/Theme';
import { BackIcon, BoltIcon, DropletIcon, UserIcon, AlertTriangleIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Button, Input } from '../../../components/Common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MeterScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [room, setRoom] = useState(null);
    const [prices, setPrices] = useState(null);
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
                const resRoom = await axiosInstance.get(`/rooms/${id}?t=${new Date().getTime()}`);
                const found = resRoom.data;
                const resPrices = await axiosInstance.get(`/utility-prices`);
                const prc = resPrices.data || {};
                setPrices(prc);

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

    const handleSave = async () => {
        const elecVal = parseFloat(form.elec) || 0;
        const waterVal = parseFloat(form.water) || 0;
        const prevElec = room?.calcPrevElec || 0;
        const prevWater = room?.calcPrevWater || 0;

        if (elecVal < prevElec) {
            Alert.alert("Cảnh báo", `Chỉ số điện mới (${elecVal}) không được nhỏ hơn kỳ trước (${prevElec})`);
            return;
        }

        if (prices?.waterMode !== 'fixed' && waterVal < prevWater) {
            Alert.alert("Cảnh báo", `Chỉ số nước mới (${waterVal}) không được nhỏ hơn kỳ trước (${prevWater})`);
            return;
        }

        setSaving(true);
        try {
            await axiosInstance.post(`/rooms/${id}/meter-readings`, {
                elec: elecVal,
                water: waterVal,
                date: form.date
            });
            
            Alert.alert("Thành công", "Đã lưu chỉ số điện nước mới");
            router.back();
        } catch (err) {
            Alert.alert("Lỗi", "Không thể lưu chỉ số");
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

    const getEarlyWarningInfo = () => {
        const today = new Date();
        
        const checkinDateStr = room?.checkin || '';
        const filteredBills = (room?.bills || []).filter(b => !checkinDateStr || b.date >= checkinDateStr);
        const filteredReadings = (room?.meterReadings || []).filter(r => !checkinDateStr || r.date >= checkinDateStr);
        
        // If room is in debt or has any unpaid bills, completely suppress early warning
        const hasUnpaidBills = filteredBills.some(b => !b.collected);
        if (room?.status === 'debt' || room?.status === 'Debt' || hasUnpaidBills) {
            return { isEarly: false, expectedDate: null };
        }
        
        // 1. Check room creation date if it is in the future
        if (room?.createdAt) {
            const createdDate = parseDate(room.createdAt);
            const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
            const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            if (todayDateOnly < createdDateOnly) {
                return { isEarly: true, expectedDate: createdDate };
            }
        }
        
        if (!room?.checkin) return { isEarly: false, expectedDate: null };
        const checkinDate = parseDate(room.checkin);
        if (isNaN(checkinDate.getTime())) return { isEarly: false, expectedDate: null };
        
        let latestDate = new Date(checkinDate);
        if (filteredReadings && filteredReadings.length > 0) {
            filteredReadings.forEach(r => {
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
        
        const isEarly = today < allowedStart;
        
        return { isEarly, expectedDate };
    };
    const { isEarly, expectedDate } = getEarlyWarningInfo();

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
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

            <ScrollView contentContainerStyle={styles.scroll}>
                {isEarly && (
                    <View style={styles.earlyWarning}>
                       <AlertTriangleIcon size={16} color="#d97706" style={{ marginTop: 1 }} />
                       <Text style={styles.earlyWarningTxt}>
                          Bạn đang ghi chỉ số sớm! Ngày dự kiến thu tiền của phòng này là ngày {expectedDate ? `${expectedDate.getDate().toString().padStart(2,'0')}/${(expectedDate.getMonth() + 1).toString().padStart(2,'0')}/${expectedDate.getFullYear()}` : ''} (Cho phép ghi trước tối đa 3 ngày).
                       </Text>
                    </View>
                )}
                <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                   <View style={{ padding: 15, backgroundColor: '#f0fdf4', alignItems: 'center' }}>
                      <UserIcon size={40} color={COLORS.pr} />
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#065f46', marginTop: 10 }}>{room?.tenant}</Text>
                      <Text style={{ fontSize: 12, color: '#059669', fontWeight: '700' }}>{room?.name} · Tháng {new Date().getMonth() + 1} / {new Date().getFullYear()}</Text>
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
                        <Text style={{ fontSize: 18, fontWeight: '900', marginTop: 10 }}>{prices.waterFixed.toLocaleString('vi')} đ / tháng</Text>
                        <Text style={{ fontSize: 11, color: COLORS.g3, marginTop: 4 }}>Không theo công tơ · Thay đổi trong Cài đặt → Đơn giá</Text>
                    </View>
                )}

                <View style={styles.card}>
                   <Text style={[styles.dlbl, { marginBottom: 10 }]}>NGÀY GHI</Text>
                   <Input 
                       placeholder="YYYY-MM-DD"
                       value={form.date}
                       onChangeText={(v) => setForm({...form, date: v})}
                   />
                   <Text style={{ fontSize: 10, color: COLORS.g3 }}>Nếu ghi muộn (sang tháng mới), hóa đơn tháng trước sẽ được tạo.</Text>
                </View>

                <Button 
                    title="✓ Lưu" 
                    type="primary" 
                    onPress={() => handleSave()} 
                    loading={saving}
                    full 
                    style={{ marginTop: 10 }} 
                />
                
                <View style={{ height: 40 }} />
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
});

export default MeterScreen;

