// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../../../styles/Theme';
import { BackIcon, PlusIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Button, Input } from '../../../components/Common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RELATION_OPTIONS = ['Bạn', 'Vợ/Chồng', 'Con', 'Anh/Chị/Em', 'Khác'];

const AddMemberScreen = () => {
    const { roomId } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);
    
    const [form, setForm] = useState({
        name: '',
        phone: '',
        relation: 'Bạn',
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
        >
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={[styles.topbar, { paddingTop: Math.max(insets.top, 14) }]}>
                <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
                    <BackIcon size={24} color={COLORS.g2} />
                </TouchableOpacity>
                <Text style={styles.tbtitle}>Thêm người ở cùng</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Text style={styles.hsub}>Nhập thông tin người ở cùng để quản lý thông tin cư trú và tính tiền nước theo đầu người.</Text>
                    
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

                    <Text style={styles.lbl}>Quan hệ với khách chính</Text>
                    <View style={styles.segwrap}>
                        {RELATION_OPTIONS.map(rel => (
                            <TouchableOpacity 
                                key={rel}
                                style={[styles.seg, form.relation === rel && styles.segOn]}
                                onPress={() => setForm({...form, relation: rel})}
                            >
                                <Text style={[styles.segTxt, form.relation === rel && styles.segTxtOn]}>
                                    {rel}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Input 
                        label="Ghi chú thêm" 
                        placeholder="Ghi chú khác nếu có..." 
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
        </KeyboardAvoidingView>
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
    lbl: { fontSize: 11, color: COLORS.g4, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
    segwrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 15 },
    seg: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.g6, borderWidth: 1, borderColor: COLORS.border },
    segOn: { backgroundColor: COLORS.prLight || '#EEF2FF', borderColor: COLORS.pr },
    segTxt: { fontSize: 12, fontWeight: '600', color: COLORS.g3 },
    segTxtOn: { color: COLORS.pr, fontWeight: '700' }
});

export default AddMemberScreen;
