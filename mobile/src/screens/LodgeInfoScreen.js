import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../styles/Theme';
import { BackIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button, Input } from '../components/Common';

const LodgeInfoScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: '',
        address: '',
        phone: '',
        bank: '',
        bankName: '',
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
                        bankName: res.data.bankName || '',
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

        setSaving(true);
        try {
            await axiosInstance.put('/lodge', form);
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
        <View style={styles.container}>
            <View style={styles.topbar}>
                <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
                    <BackIcon size={24} color={COLORS.g2} />
                </TouchableOpacity>
                <Text style={styles.tbtitle}>Thông tin nhà trọ</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
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
                    <Text style={styles.hsub}>Tài khoản nhận tiền (QR Code)</Text>
                    <Input 
                        label="Ngân hàng" 
                        value={form.bankName}
                        onChangeText={(v) => setForm({...form, bankName: v})}
                        placeholder="Ví dụ: MB Bank, Vietcombank..."
                    />
                    <Input 
                        label="Số tài khoản" 
                        value={form.bank}
                        onChangeText={(v) => setForm({...form, bank: v})}
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
            </ScrollView>
        </View>
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
