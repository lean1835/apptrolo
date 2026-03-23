import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../styles/Theme';
import { BackIcon, PlusIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button, Input } from '../components/Common';

const AddMemberScreen = () => {
    const { roomId } = useLocalSearchParams();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    
    const [form, setForm] = useState({
        name: '',
        phone: '',
        note: '',
    });

    const handleSave = async () => {
        if (!form.name) {
            Alert.alert("Lỗi", "Vui lòng nhập họ và tên");
            return;
        }

        setSaving(true);
        try {
            await axiosInstance.post(`/rooms/${roomId}/members`, form);
            Alert.alert("Thành công", `Đã thêm ${form.name} vào phòng`);
            router.back();
        } catch (err) {
            Alert.alert("Lỗi", "Không thể thêm người ở cùng");
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topbar}>
                <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
                    <BackIcon size={24} color={COLORS.g2} />
                </TouchableOpacity>
                <Text style={styles.tbtitle}>Thêm người ở cùng</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Text style={styles.hsub}>Nhập thông tin người ở cùng để quản lý thông tin cư trú tốt hơn.</Text>
                    
                    <Input 
                        label="Họ và tên *" 
                        placeholder="Nguyễn Văn B" 
                        value={form.name}
                        onChangeText={(v) => setForm({...form, name: v})}
                    />
                    <Input 
                        label="Số điện thoại" 
                        placeholder="0912345678 (không bắt buộc)" 
                        keyboardType="phone-pad"
                        value={form.phone}
                        onChangeText={(v) => setForm({...form, phone: v})}
                    />
                    <Input 
                        label="Ghi chú / Quan hệ" 
                        placeholder="Vợ / Chồng / Bạn cùng phòng..." 
                        value={form.note}
                        onChangeText={(v) => setForm({...form, note: v})}
                    />
                </View>

                <Button 
                    title={saving ? "Đang thêm..." : "Thêm người ở cùng"} 
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
    hsub: { fontSize: 13, color: COLORS.g4, marginBottom: 20, fontWeight: '600', lineHeight: 18 },
});

export default AddMemberScreen;
