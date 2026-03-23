import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../styles/Theme';
import { BackIcon, CheckIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button, Input } from '../components/Common';

const AddTenantScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [form, setForm] = useState({
        tenant: '',
        phone: '',
        checkin: new Date().toISOString().split('T')[0],
        contract: 'monthly',
        contractPrepaid: '0',
        ep: '0',
        wp: '0',
    });

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await axiosInstance.get(`/rooms/${id}`);
                const found = res.data;
                if (found) {
                    setRoom(found);
                    setForm({
                        ...form,
                        tenant: found.tenant || '',
                        phone: found.phone || '',
                        ep: found.ep?.toString() || '0',
                        wp: found.wp?.toString() || '0',
                        contract: found.contract || 'monthly',
                        contractPrepaid: found.contractPrepaid?.toString() || '0',
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [id]);

    const handleSave = async () => {
        if (!form.tenant || !form.phone) {
            Alert.alert("Lỗi", "Vui lòng nhập tên và số điện thoại");
            return;
        }

        setSaving(true);
        try {
            const updatedRoom = {
                ...room,
                tenant: form.tenant,
                phone: form.phone,
                people: 1, // Default to 1 (the tenant)
                status: 'occupied',
                checkin: form.checkin,
                contract: form.contract,
                contractPrepaid: parseInt(form.contractPrepaid) || 0,
                ep: parseFloat(form.ep) || 0,
                wp: parseFloat(form.wp) || 0,
            };
            await axiosInstance.put(`/rooms/${id}`, updatedRoom);
            Alert.alert("Thành công", "Đã cập nhật thông tin khách thuê");
            router.back();
        } catch (err) {
            Alert.alert("Lỗi", "Không thể lưu thông tin");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <View style={styles.loading}><Text>Đang tải...</Text></View>;

    return (
        <View style={styles.container}>
            <View style={styles.topbar}>
                <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
                    <BackIcon size={24} color={COLORS.g2} />
                </TouchableOpacity>
                <Text style={styles.tbtitle}>Khách thuê · {room?.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Text style={styles.htit}>Thông tin cơ bản</Text>
                    <Input 
                        label="Họ và tên khách *" 
                        placeholder="Nguyễn Văn A" 
                        value={form.tenant}
                        onChangeText={(v) => setForm({...form, tenant: v})}
                    />
                    <Input 
                        label="Số điện thoại *" 
                        placeholder="0912345678" 
                        keyboardType="phone-pad"
                        value={form.phone}
                        onChangeText={(v) => setForm({...form, phone: v})}
                    />
                    <Input 
                        label="Ngày vào ở" 
                        placeholder="YYYY-MM-DD" 
                        value={form.checkin}
                        onChangeText={(v) => setForm({...form, checkin: v})}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.htit}>Hợp đồng & Trả trước</Text>
                    <View style={styles.segwrap}>
                        {['monthly', 'quarter', 'halfyear'].map(type => (
                            <TouchableOpacity 
                                key={type}
                                style={[styles.seg, form.contract === type && styles.segOn]}
                                onPress={() => setForm({...form, contract: type, contractPrepaid: type === 'monthly' ? '0' : (type === 'quarter' ? '3' : '6')})}
                            >
                                <Text style={[styles.segTxt, form.contract === type && styles.segTxtOn]}>
                                    {type === 'monthly' ? 'Tháng' : type === 'quarter' ? 'Quý' : '6 tháng'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    {form.contract !== 'monthly' && (
                        <Input 
                            label="Số tháng trả trước" 
                            keyboardType="numeric"
                            value={form.contractPrepaid}
                            onChangeText={(v) => setForm({...form, contractPrepaid: v})}
                        />
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.htit}>Chỉ số đầu kỳ</Text>
                    <Input 
                        label="Chỉ số điện (kWh)" 
                        keyboardType="numeric"
                        value={form.ep}
                        onChangeText={(v) => setForm({...form, ep: v})}
                    />
                    <Input 
                        label="Chỉ số nước (m³)" 
                        keyboardType="numeric"
                        value={form.wp}
                        onChangeText={(v) => setForm({...form, wp: v})}
                    />
                </View>

                <Button 
                    title={saving ? "Đang lưu..." : "Lưu thông tin"} 
                    onPress={handleSave} 
                    loading={saving}
                    full 
                    style={{ marginTop: 10 }}
                />
                
                <View style={{ height: 40 }} />
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
    tbtitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '800',
        color: COLORS.g1,
    },
    scroll: { padding: 14, gap: 12 },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 14,
        padding: 16,
        ...SHADOWS.sh,
        marginBottom: 12
    },
    htit: { fontSize: 15, fontWeight: '800', color: COLORS.g1, marginBottom: 15 },
    segwrap: {
        flexDirection: 'row',
        backgroundColor: COLORS.g6,
        borderRadius: 10,
        padding: 4,
        marginBottom: 15
    },
    seg: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    segOn: {
        backgroundColor: COLORS.white,
        ...SHADOWS.sh,
    },
    segTxt: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.g3
    },
    segTxtOn: {
        color: COLORS.pr
    }
});

export default AddTenantScreen;
