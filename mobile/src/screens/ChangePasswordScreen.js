import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../styles/Theme';
import { BackIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button, Input } from '../components/Common';

const ChangePasswordScreen = () => {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleSave = async () => {
        if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ các trường");
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu mới không khớp nhau");
            return;
        }

        setSaving(true);
        try {
            await axiosInstance.post('/profile/change-password', {
                oldPassword: form.oldPassword,
                newPassword: form.newPassword,
            });
            Alert.alert("Thành công", "Mật khẩu đã được thay đổi");
            router.back();
        } catch (err) {
            const msg = err.response?.data?.error || "Không thể đổi mật khẩu";
            Alert.alert("Lỗi", msg);
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
                <Text style={styles.tbtitle}>Đổi mật khẩu</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Input 
                        label="Mật khẩu hiện tại" 
                        value={form.oldPassword}
                        onChangeText={(v) => setForm({...form, oldPassword: v})}
                        secureTextEntry
                        placeholder="Nhập mật khẩu cũ"
                    />
                    <View style={{ height: 1.5, backgroundColor: COLORS.g6, marginVertical: 10 }} />
                    <Input 
                        label="Mật khẩu mới" 
                        value={form.newPassword}
                        onChangeText={(v) => setForm({...form, newPassword: v})}
                        secureTextEntry
                        placeholder="Mật khẩu từ 6 ký tự"
                    />
                    <Input 
                        label="Xác nhận mật khẩu mới" 
                        value={form.confirmPassword}
                        onChangeText={(v) => setForm({...form, confirmPassword: v})}
                        secureTextEntry
                        placeholder="Nhập lại mật khẩu mới"
                    />
                </View>

                <Button 
                    title={saving ? "Đang lưu..." : "Đổi mật khẩu"} 
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
});

export default ChangePasswordScreen;
