import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../styles/Theme';
import { BackIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button, Input } from '../components/Common';

const UtilityPriceScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        elec: '',
        water: '',
        wifi: '',
        garbage: '',
        waterMode: 'meter', // "meter" or "fixed"
        waterFixed: '',
    });

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axiosInstance.get('/utility-prices');
                if (res.data) {
                    setForm({
                        elec: res.data.elec?.toString() || '',
                        water: res.data.water?.toString() || '',
                        wifi: res.data.wifi?.toString() || '',
                        garbage: res.data.garbage?.toString() || '',
                        waterMode: res.data.waterMode || 'meter',
                        waterFixed: res.data.waterFixed?.toString() || '',
                    });
                }
            } catch (err) {
                console.error('Fetch prices error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const dataToSave = {
                elec: parseFloat(form.elec) || 0,
                water: parseFloat(form.water) || 0,
                wifi: parseFloat(form.wifi) || 0,
                garbage: parseFloat(form.garbage) || 0,
                waterMode: form.waterMode,
                waterFixed: parseFloat(form.waterFixed) || 0,
            };
            await axiosInstance.put('/utility-prices', dataToSave);
            Alert.alert("Thành công", "Đã cập nhật đơn giá dịch vụ");
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
                <Text style={styles.tbtitle}>Đơn giá dịch vụ</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Text style={styles.hsub}>Điện & Nước</Text>
                    <Input 
                        label="Giá điện (đ/kWh) *" 
                        value={form.elec}
                        onChangeText={(v) => setForm({...form, elec: v})}
                        keyboardType="numeric"
                        placeholder="Ví dụ: 3500"
                    />
                    
                    <Text style={styles.lbl}>Hình thức tính tiền nước</Text>
                    <View style={styles.segwrap}>
                        {['meter', 'fixed'].map(mode => (
                            <TouchableOpacity 
                                key={mode}
                                style={[styles.seg, form.waterMode === mode && styles.segOn]}
                                onPress={() => setForm({...form, waterMode: mode})}
                            >
                                <Text style={[styles.segTxt, form.waterMode === mode && styles.segTxtOn]}>
                                    {mode === 'meter' ? 'Theo khối (m³)' : 'Theo người / Tháng'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {form.waterMode === 'meter' ? (
                        <Input 
                            label="Giá nước (đ/m³) *" 
                            value={form.water}
                            onChangeText={(v) => setForm({...form, water: v})}
                            keyboardType="numeric"
                            placeholder="Ví dụ: 15000"
                        />
                    ) : (
                        <Input 
                            label="Giá nước cố định (đ/người/tháng) *" 
                            value={form.waterFixed}
                            onChangeText={(v) => setForm({...form, waterFixed: v})}
                            keyboardType="numeric"
                            placeholder="Ví dụ: 50000"
                        />
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.hsub}>Phí dịch vụ khác (Cố định/phòng)</Text>
                    <Input 
                        label="Phí Wifi (đ/tháng)" 
                        value={form.wifi}
                        onChangeText={(v) => setForm({...form, wifi: v})}
                        keyboardType="numeric"
                        placeholder="Ví dụ: 50000"
                    />
                    <Input 
                        label="Phí Rác / Vệ sinh (đ/tháng)" 
                        value={form.garbage}
                        onChangeText={(v) => setForm({...form, garbage: v})}
                        keyboardType="numeric"
                        placeholder="Ví dụ: 10000"
                    />
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
    lbl: { fontSize: 11, color: COLORS.g4, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
    segwrap: { flexDirection: 'row', backgroundColor: COLORS.g6, borderRadius: 10, padding: 4, marginBottom: 15 },
    seg: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    segOn: { backgroundColor: COLORS.white, ...SHADOWS.sh },
    segTxt: { fontSize: 11, fontWeight: '700', color: COLORS.g3 },
    segTxtOn: { color: COLORS.pr }
});

export default UtilityPriceScreen;
