// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../../../styles/Theme';
import { BackIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Button, Input } from '../../../components/Common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardPadding } from '../../../hooks/useKeyboardPadding';

const LodgeInfoScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef(null);
    const kbHeight = useKeyboardPadding(scrollRef);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        bank: '',
        bankAccount: '',
        bankName: '',
        billingDate: '25',
        earlyRecordDays: '3',
    });

    useEffect(() => {
        const fetchLodge = async () => {
            try {
                const res = await axiosInstance.get('/lodge');
                if (res.data) {
                    setForm({
                        name: res.data.name || '',
                        address: res.data.address || '',
                        phone: res.data.phone || '',
                        bank: res.data.bank || '',
                        bankAccount: res.data.bankAccount || res.data.bank || '',
                        bankName: res.data.bankName || '',
                        billingDate: res.data.billingDate?.toString() || '25',
                        earlyRecordDays: res.data.earlyRecordDays?.toString() || '3',
                    });
                }
            } catch (err) {
                console.error('Fetch lodge error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLodge();
    }, []);

    const handleSave = async () => {
        if (!form.name || !form.phone) {
            Alert.alert("Lỗi", "Vui lòng nhập tên và số điện thoại nhà trọ");
            return;
        }

        const bDate = parseInt(form.billingDate, 10);
        if (isNaN(bDate) || bDate < 1 || bDate > 28) {
            Alert.alert("Lỗi", "Ngày chốt điện nước phải từ ngày 1 đến 28 hàng tháng");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                bankAccount: form.bankAccount || form.bank,
                billingDate: bDate,
                earlyRecordDays: parseInt(form.earlyRecordDays, 10) || 3,
            };
            await axiosInstance.put('/lodge', payload);
            Alert.alert("Thành công", "Đã cập nhật thông tin nhà trọ");
            router.back();
        } catch (err) {
            Alert.alert("Lỗi", "Không thể lưu thông tin");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View style={styles.loading}><ActivityIndicator color={COLORS.pr} /></View>;

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
                <Text style={styles.tbtitle}>Thông tin nhà trọ</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.hsub}>Thông tin cơ bản</Text>
                    <Input 
                        label="Tên nhà trọ *" 
                        value={form.name}
                        onChangeText={(v) => setForm({...form, name: v})}
                        placeholder="Ví dụ: Nhà trọ Hoàng Gia"
                    />
                    <Input 
                        label="Địa chỉ" 
                        value={form.address}
                        onChangeText={(v) => setForm({...form, address: v})}
                        placeholder="Số 1, Đường ABC, Quận XYZ"
                    />
                    <Input 
                        label="Số điện thoại liên hệ *" 
                        value={form.phone}
                        onChangeText={(v) => setForm({...form, phone: v})}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.hsub}>Chu kỳ ghi điện nước & Thu tiền</Text>
                    <Input 
                        label="Ngày ghi điện nước D (từ 1 đến 28) *" 
                        value={form.billingDate}
                        onChangeText={(v) => setForm({...form, billingDate: v})}
                        keyboardType="numeric"
                        placeholder="25"
                    />
                    <Input 
                        label="Số ngày mở cửa sổ ghi sớm (mặc định 3 ngày)" 
                        value={form.earlyRecordDays}
                        onChangeText={(v) => setForm({...form, earlyRecordDays: v})}
                        keyboardType="numeric"
                        placeholder="3"
                    />
                    <Text style={styles.note}>Ví dụ: Ngày chốt là 25, mở sớm 3 ngày thì từ ngày 22 chủ trọ đã có thể bắt đầu ghi chỉ số điện nước.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.hsub}>Tài khoản nhận tiền (QR Code)</Text>
                    <Input 
                        label="Ngân hàng" 
                        value={form.bankName}
                        onChangeText={(v) => setForm({...form, bankName: v})}
                        placeholder="Ví dụ: MB Bank, Vietcombank..."
                    />
                    <Input 
                        label="Số tài khoản (QR)" 
                        value={form.bankAccount || form.bank}
                        onChangeText={(v) => setForm({...form, bankAccount: v, bank: v})}
                        keyboardType="numeric"
                        placeholder="Nhập STK ngân hàng của bạn"
                    />
                    <Text style={styles.note}>Lưu ý: Thông tin này dùng để tạo mã QR thanh toán trên hóa đơn gửi cho khách.</Text>
                </View>

                <Button 
                    title={saving ? "Đang lưu..." : "Lưu thay đổi"} 
                    onPress={handleSave} 
                    loading={saving}
                    full 
                    style={{ marginTop: 10 }}
                />
                <View style={{ height: Math.max(0, kbHeight) }} />
            </ScrollView>
        </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topbar: {
        backgroundColor: COLORS.white,
        paddingTop: 50,
        paddingBottom: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
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
    tbtitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: COLORS.g1 },
    scroll: { padding: 14, gap: 12 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 16,
        ...SHADOWS.sh,
    },
    hsub: { fontSize: 14, fontWeight: '800', color: COLORS.g1, marginBottom: 15 },
    note: { fontSize: 11, color: COLORS.g4, marginTop: 10, fontStyle: 'italic' }
});

export default LodgeInfoScreen;
