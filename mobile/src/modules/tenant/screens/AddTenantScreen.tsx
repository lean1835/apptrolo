// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../../../styles/Theme';
import { BackIcon, CheckIcon } from '../../../assets/Icons';
import axiosInstance from '../../../services/api';
import { Button, Input } from '../../../components/Common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardPadding } from '../../../hooks/useKeyboardPadding';

const AddTenantScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scrollRef = useRef(null);
    const kbHeight = useKeyboardPadding(scrollRef);
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

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateTab, setDateTab] = useState('day'); // 'day' | 'month' | 'year'
    const [selectedDay, setSelectedDay] = useState(new Date().getDate());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const getDaysInMonth = (month, year) => {
        return new Date(year, month, 0).getDate();
    };

    const handleConfirmDate = () => {
        const formattedDay = selectedDay.toString().padStart(2, '0');
        const formattedMonth = selectedMonth.toString().padStart(2, '0');
        const formattedDate = `${selectedYear}-${formattedMonth}-${formattedDay}`;
        setForm({ ...form, checkin: formattedDate });
        setShowDatePicker(false);
    };

    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);
    const yearsArray = Array.from({ length: 11 }, (_, i) => 2020 + i);

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
                        checkin: found.checkin || new Date().toISOString().split('T')[0],
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
                name: room.name,
                price: room.price,
                status: 'occupied',
                tenant: form.tenant,
                phone: form.phone,
                people: 1, // Default to 1 (the tenant)
                checkin: form.checkin,
                contract: form.contract,
                contractPrepaid: parseInt(form.contractPrepaid) || 0,
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
        >
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={[styles.topbar, { paddingTop: Math.max(insets.top, 14) }]}>
                <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
                    <BackIcon size={24} color={COLORS.g2} />
                </TouchableOpacity>
                <Text style={styles.tbtitle}>Khách thuê · {room?.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
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
                    <TouchableOpacity onPress={() => {
                        const parts = form.checkin.split('-');
                        if (parts.length === 3) {
                            setSelectedYear(parseInt(parts[0], 10));
                            setSelectedMonth(parseInt(parts[1], 10));
                            setSelectedDay(parseInt(parts[2], 10));
                        }
                        setDateTab('day');
                        setShowDatePicker(true);
                    }}>
                        <View pointerEvents="none">
                            <Input 
                                label="Ngày vào ở (Chạm để chọn)" 
                                placeholder="YYYY-MM-DD" 
                                value={form.checkin}
                                editable={false}
                            />
                        </View>
                    </TouchableOpacity>
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

                <Button 
                    title={saving ? "Đang lưu..." : "Lưu thông tin"} 
                    onPress={handleSave} 
                    loading={saving}
                    full 
                    style={{ marginTop: 10 }}
                />
                
                <View style={{ height: Math.max(40, kbHeight) }} />
            </ScrollView>

            {/* Custom DatePicker Modal */}
            <Modal
                visible={showDatePicker}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDatePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn ngày vào ở</Text>
                            <Text style={styles.modalSelectedDate}>
                                Ngày {selectedDay.toString().padStart(2, '0')} tháng {selectedMonth.toString().padStart(2, '0')} năm {selectedYear}
                            </Text>
                        </View>

                        {/* Tabs */}
                        <View style={styles.modalTabs}>
                            <TouchableOpacity 
                                style={[styles.modalTab, dateTab === 'day' && styles.modalTabActive]}
                                onPress={() => setDateTab('day')}
                            >
                                <Text style={[styles.modalTabText, dateTab === 'day' && styles.modalTabTextActive]}>Ngày</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalTab, dateTab === 'month' && styles.modalTabActive]}
                                onPress={() => setDateTab('month')}
                            >
                                <Text style={[styles.modalTabText, dateTab === 'month' && styles.modalTabTextActive]}>Tháng</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalTab, dateTab === 'year' && styles.modalTabActive]}
                                onPress={() => setDateTab('year')}
                            >
                                <Text style={[styles.modalTabText, dateTab === 'year' && styles.modalTabTextActive]}>Năm</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Grid Content */}
                        <View style={styles.gridContent}>
                            {dateTab === 'day' && (
                                <ScrollView contentContainerStyle={styles.gridContainer}>
                                    {daysArray.map((day) => (
                                        <TouchableOpacity
                                            key={day}
                                            style={[styles.gridItem, selectedDay === day && styles.gridItemActive]}
                                            onPress={() => setSelectedDay(day)}
                                        >
                                            <Text style={[styles.gridItemText, selectedDay === day && styles.gridItemTextActive]}>
                                                {day}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            {dateTab === 'month' && (
                                <ScrollView contentContainerStyle={styles.gridContainer}>
                                    {monthsArray.map((month) => (
                                        <TouchableOpacity
                                            key={month}
                                            style={[styles.gridItemMonth, selectedMonth === month && styles.gridItemActive]}
                                            onPress={() => {
                                                setSelectedMonth(month);
                                                const maxDays = getDaysInMonth(month, selectedYear);
                                                if (selectedDay > maxDays) {
                                                    setSelectedDay(maxDays);
                                                }
                                            }}
                                        >
                                            <Text style={[styles.gridItemText, selectedMonth === month && styles.gridItemTextActive]}>
                                                Tháng {month}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            {dateTab === 'year' && (
                                <ScrollView contentContainerStyle={styles.gridContainer}>
                                    {yearsArray.map((year) => (
                                        <TouchableOpacity
                                            key={year}
                                            style={[styles.gridItemYear, selectedYear === year && styles.gridItemActive]}
                                            onPress={() => {
                                                setSelectedYear(year);
                                                const maxDays = getDaysInMonth(selectedMonth, year);
                                                if (selectedDay > maxDays) {
                                                    setSelectedDay(maxDays);
                                                }
                                            }}
                                        >
                                            <Text style={[styles.gridItemText, selectedYear === year && styles.gridItemTextActive]}>
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>

                        {/* Footer Buttons */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalBtnCancel]} 
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text style={styles.modalBtnCancelTxt}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalBtnConfirm]} 
                                onPress={handleConfirmDate}
                            >
                                <Text style={styles.modalBtnConfirmTxt}>Xác nhận</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 20,
        paddingBottom: 35,
        ...SHADOWS.sh2,
        maxHeight: '70%',
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.g1,
    },
    modalSelectedDate: {
        fontSize: 13,
        color: COLORS.pr,
        fontWeight: '700',
        marginTop: 4,
    },
    modalTabs: {
        flexDirection: 'row',
        backgroundColor: COLORS.g6,
        borderRadius: 12,
        padding: 3,
        marginBottom: 16,
    },
    modalTab: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTabActive: {
        backgroundColor: COLORS.white,
        ...SHADOWS.sh,
    },
    modalTabText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.g3,
    },
    modalTabTextActive: {
        color: COLORS.pr,
    },
    gridContent: {
        height: 190,
        marginBottom: 20,
        backgroundColor: COLORS.g6,
        borderRadius: 16,
        padding: 10,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'flex-start',
        paddingBottom: 15,
    },
    gridItem: {
        width: '12%',
        aspectRatio: 1,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    gridItemMonth: {
        width: '30%',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    gridItemYear: {
        width: '30%',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    gridItemActive: {
        backgroundColor: COLORS.pr,
        borderColor: COLORS.pr,
    },
    gridItemText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.g2,
    },
    gridItemTextActive: {
        color: COLORS.white,
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBtnCancel: {
        backgroundColor: COLORS.g6,
    },
    modalBtnCancelTxt: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.g3,
    },
    modalBtnConfirm: {
        backgroundColor: COLORS.pr,
    },
    modalBtnConfirmTxt: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.white,
    },
});

export default AddTenantScreen;

