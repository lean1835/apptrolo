import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../styles/Theme';
import { BackIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button, Input } from '../components/Common';

const EditRoomScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [form, setForm] = useState({
        name: '',
        price: '',
        status: 'empty',
        descText: '',
    });

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await axiosInstance.get(`/rooms/${id}`);
                const found = res.data;
                if (found) {
                    setRoom(found);
                    setForm({
                        name: found.name,
                        price: found.price.toString(),
                        status: found.status,
                        descText: found.descText || '',
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
        if (!form.name || !form.price) {
            Alert.alert("Lỗi", "Vui lòng nhập tên và giá phòng");
            return;
        }

        setSaving(true);
        try {
            const updated = {
                ...room,
                name: form.name,
                price: parseFloat(form.price),
                status: form.status,
                descText: form.descText,
            };
            await axiosInstance.put(`/rooms/${id}`, updated);
            Alert.alert("Thành công", "Đã cập nhật thông tin phòng");
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
                <Text style={styles.tbtitle}>Sửa thông tin phòng</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Input 
                        label="Tên phòng" 
                        value={form.name}
                        onChangeText={(v) => setForm({...form, name: v})}
                    />
                    <Input 
                        label="Giá thuê (đ/tháng)" 
                        keyboardType="numeric"
                        value={form.price}
                        onChangeText={(v) => setForm({...form, price: v})}
                    />
                    
                    <Text style={styles.lbl}>Trạng thái</Text>
                    <View style={styles.segwrap}>
                        {['empty', 'occupied', 'maintenance'].map(status => (
                            <TouchableOpacity 
                                key={status}
                                style={[styles.seg, form.status === status && styles.segOn]}
                                onPress={() => setForm({...form, status: status})}
                            >
                                <Text style={[styles.segTxt, form.status === status && styles.segTxtOn]}>
                                    {status === 'empty' ? 'Trống' : status === 'occupied' ? 'Có khách' : 'Bảo trì'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Input 
                        label="Mô tả" 
                        placeholder="Tiện ích, nội thất..."
                        multiline
                        value={form.descText}
                        onChangeText={(v) => setForm({...form, descText: v})}
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
    lbl: { fontSize: 10, color: COLORS.g4, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
    segwrap: { flexDirection: 'row', backgroundColor: COLORS.g6, borderRadius: 10, padding: 4, marginBottom: 15 },
    seg: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    segOn: { backgroundColor: COLORS.white, ...SHADOWS.sh },
    segTxt: { fontSize: 11, fontWeight: '700', color: COLORS.g3 },
    segTxtOn: { color: COLORS.pr }
});

export default EditRoomScreen;
