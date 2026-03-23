import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../styles/Theme';
import { BackIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button, Input } from '../components/Common';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AccountInfoScreen = () => {
    const router = useRouter();
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || '',
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await axiosInstance.get('/profile/me');
                if (res.data) {
                    setForm({
                        name: res.data.name || '',
                        phone: res.data.phone || '',
                        email: res.data.email || '',
                    });
                }
            } catch (err) {
                console.error('Fetch user error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSave = async () => {
        if (!form.name || !form.phone) {
            Alert.alert("Lỗi", "Họ tên và Số điện thoại không được để trống");
            return;
        }

        setSaving(true);
        try {
            const updateData = {
                name: form.name,
                email: form.email,
            };
            console.log('Update profile with:', updateData);
            const res = await axiosInstance.post('/profile/update', updateData);
            console.log('API Update res:', res.data);

            // Updating local authentication state
            const userData = res.data;
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await refreshUser(userData);
            
            Alert.alert("Thành công", "Đã cập nhật thông tin cá nhân");
            router.back();
        } catch (err) {
            console.error('Update profile error:', err.response?.data || err.message);
            Alert.alert("Lỗi", "Không thể cập nhật thông tin: " + (err.response?.data?.message || err.message));
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
                <Text style={styles.tbtitle}>Thông tin tài khoản</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Input 
                        label="Họ và tên *" 
                        value={form.name}
                        onChangeText={(v) => setForm({...form, name: v})}
                        placeholder="Nhập họ và tên của bạn"
                    />
                    <Input 
                        label="Số điện thoại" 
                        value={form.phone}
                        readonly
                        placeholder="0912345678"
                    />
                    <Input 
                        label="Email" 
                        value={form.email}
                        onChangeText={(v) => setForm({...form, email: v})}
                        keyboardType="email-address"
                        placeholder="admin@example.com (không bắt buộc)"
                    />
                    <Text style={styles.note}>Lưu ý: Số điện thoại dùng để đăng nhập vào ứng dụng.</Text>
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
    note: { fontSize: 11, color: COLORS.g4, marginTop: 10, fontStyle: 'italic' }
});

export default AccountInfoScreen;
