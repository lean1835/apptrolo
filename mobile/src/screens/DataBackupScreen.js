import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../styles/Theme';
import { BackIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button } from '../components/Common';

const DataBackupScreen = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [jsonText, setJsonText] = useState('');

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get('/data/export');
            setJsonText(JSON.stringify(res.data, null, 2));
        } catch (err) {
            Alert.alert("Lỗi", "Không thể xuất dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!jsonText.trim()) return;
        
        Alert.alert(
            "Xác nhận",
            "Việc nhập dữ liệu sẽ ghi đè lên các thiết lập hiện tại. Bạn có chắc chắn muốn thực hiện?",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Đồng ý", 
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const data = JSON.parse(jsonText);
                            await axiosInstance.post('/data/import', data);
                            Alert.alert("Thông báo", "Tính năng Import đang được đồng bộ. Dữ liệu sẽ sớm được cập nhật.");
                        } catch (err) {
                            Alert.alert("Lỗi", "JSON không hợp lệ hoặc không thể nhập dữ liệu");
                        } finally {
                            setLoading(false);
                        }
                    } 
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.topbar}>
                <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
                    <BackIcon size={24} color={COLORS.g2} />
                </TouchableOpacity>
                <Text style={styles.tbtitle}>Sao lưu & Khôi phục</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <Text style={styles.tip}>Mẹo: Bạn có thể Sao lưu dữ liệu ra định dạng JSON, sau đó dán lại vào đây để Khôi phục hoặc chỉnh sửa nhanh từ xa.</Text>
                    
                    <View style={styles.jsonWrap}>
                        <TextInput 
                            style={styles.input}
                            multiline
                            placeholder="Dữ liệu JSON sẽ hiển thị ở đây..."
                            value={jsonText}
                            onChangeText={setJsonText}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.row}>
                        <Button 
                            title="Sao lưu (Export)" 
                            onPress={handleExport} 
                            loading={loading}
                            type="secondary"
                            style={{ flex: 1 }}
                        />
                        <Button 
                            title="Khôi phục (Import)" 
                            onPress={handleImport} 
                            loading={loading}
                            style={{ flex: 1 }}
                        />
                    </View>
                </View>

                {loading && <ActivityIndicator size="large" color={COLORS.pr} style={{ marginTop: 20 }} />}
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
    tip: { fontSize: 12, color: COLORS.g3, marginBottom: 15, lineHeight: 18 },
    jsonWrap: {
        height: 300,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    input: { flex: 1, fontSize: 12, fontFamily: 'monospace', color: COLORS.g1 },
    row: { flexDirection: 'row', gap: 10 }
});

export default DataBackupScreen;
