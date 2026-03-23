import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../styles/Theme';
import { BackIcon, UserIcon, DownloadIcon, ShareIcon } from '../assets/Icons';
import axiosInstance from '../services/api';
import { Button } from '../components/Common';
import { CaptureView, captureRef } from '../utils/capture';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const BillScreen = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [room, setRoom] = useState(null);
    const [prices, setPrices] = useState(null);
    const [lodge, setLodge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
    const viewRef = useRef();
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resRoom = await axiosInstance.get(`/rooms/${id}`);
                setRoom(resRoom.data);
                
                const resPrices = await axiosInstance.get(`/utility-prices`);
                setPrices(resPrices.data);

                const resLodge = await axiosInstance.get(`/lodge`);
                setLodge(resLodge.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        if (!permissionResponse || permissionResponse.status !== 'granted') {
            requestPermission();
        }
    }, [id]);

    if (loading) return <View style={styles.loading}><Text>Đang tải...</Text></View>;
    if (!room || !prices || !lodge) return <View style={styles.loading}><Text>Đang tải dữ liệu...</Text></View>;
    const now = new Date();

    const getStats = () => {
        if (!room || !prices) return { eUse: 0, wUse: 0, eAmt: 0, wAmt: 0, total: 0, rent: 0, prepaid: 0, fees: 0 };
        
        const now = new Date();
        const allSorted = [...(room.meterReadings || [])].sort((a,b) => new Date(b.date) - new Date(a.date));
        
        const thisMonthReadings = allSorted.find(r => {
            const [y, m] = r.date.split('-');
            return parseInt(y, 10) === now.getFullYear() && parseInt(m, 10) === (now.getMonth() + 1);
        });

        const priorReadings = allSorted.find(r => {
            const [y, m] = r.date.split('-');
            return parseInt(y, 10) < now.getFullYear() || (parseInt(y, 10) === now.getFullYear() && parseInt(m, 10) < (now.getMonth() + 1));
        });

        const pElecValue = priorReadings ? priorReadings.elec : (room.ep || 0);
        const pWaterValue = priorReadings ? priorReadings.water : (room.wp || 0);
        
        const cElec = thisMonthReadings ? thisMonthReadings.elec : pElecValue;
        const cWater = thisMonthReadings ? thisMonthReadings.water : pWaterValue;

        const eUse = cElec - pElecValue;
        const wUse = cWater - pWaterValue;
        
        const eAmt = eUse * (prices.elec || 0);
        const wAmt = prices.waterMode === 'fixed' ? (prices.waterFixed || 0) : (wUse * (prices.water || 0));
        const rent = parseFloat(room.price) || 0;
        const fees = (prices.wifi || 0) + (prices.garbage || 0);
        const prepaid = room.contractPrepaid > 0 ? rent : 0;
        const total = rent + eAmt + wAmt + fees - prepaid;

        return { eUse, wUse, eAmt, wAmt, total, rent, prepaid, fees, cElec, cWater, pElecValue, pWaterValue };
    };

    const stats = getStats();
    const total = stats.total;

    const handleSaveBill = async () => {
        setSaving(true);
        try {
            await axiosInstance.post(`/rooms/${id}/bills`, {
                total: total,
                date: new Date().toISOString().split('T')[0],
                sent: false,
                collected: false
            });
            Alert.alert("Thành công", "Đã lưu hóa đơn hệ thống", [
                { text: "OK", onPress: () => router.push('/') }
            ]);
        } catch (err) {
            Alert.alert("Lỗi", "Không thể lưu hóa đơn");
        } finally {
            setSaving(false);
        }
    };

    const handleCapture = async () => {
        try {
            const uri = await captureRef(viewRef, {
                format: "png",
                quality: 0.9,
            });
            
            if (permissionResponse?.status !== 'granted') {
                 await requestPermission();
            }

            await MediaLibrary.saveToLibraryAsync(uri);
            Alert.alert("Thành công", "Đã lưu ảnh hóa đơn vào Thư viện ảnh");
        } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không thể tạo ảnh hóa đơn");
        }
    };

    const handleShare = async () => {
        try {
            const uri = await captureRef(viewRef, {
                format: "png",
                quality: 0.8,
            });
            await Sharing.shareAsync(uri, {
                mimeType: 'image/png',
                dialogTitle: 'Chia sẻ hóa đơn',
                UTI: 'public.png'
            });
        } catch (err) {
            Alert.alert("Lỗi", "Không thể chia sẻ ảnh");
        }
    };

    const bankNameFormatted = (lodge.bankName || '').replace(/\s+/g,'');
    const qrUrl = (lodge.bankName && lodge.bank) ? `https://img.vietqr.io/image/${bankNameFormatted}-${lodge.bank}-qr_only.png?amount=${total}&addInfo=${encodeURIComponent(room.name + ' Thang ' + (new Date().getMonth() + 1))}&accountName=${encodeURIComponent(lodge.name)}` : '';

    return (
        <View style={styles.container}>
            <View style={styles.topbar}>
                <TouchableOpacity style={styles.tbback} onPress={() => router.back()}>
                    <BackIcon size={24} color={COLORS.g2} />
                </TouchableOpacity>
                <Text style={styles.tbtitle}>Hóa đơn · {room.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <CaptureView ref={viewRef} options={{ format: "png", quality: 0.9 }}>
                    <View style={styles.captureArea}>
                        <View style={styles.receiptPaper}>
                            {/* Header */}
                            <View style={styles.billHeader}>
                                <Text style={styles.bhLodge}>{lodge.name || 'Hệ thống Quản lý Trọ'}</Text>
                                <Text style={styles.bhTitle}>HÓA ĐƠN TIỀN NHÀ</Text>
                                <View style={styles.bhRow}>
                                    <Text style={styles.bhRoom}>Phòng: {room.name}</Text>
                                    <View style={styles.bhDot} />
                                    <Text style={styles.bhDate}>Tháng {now.getMonth() + 1}/{now.getFullYear()}</Text>
                                </View>
                            </View>

                            <View style={styles.dashLine} />

                            {/* QR Section */}
                            <View style={styles.qrSection}>
                                <View style={styles.qrBox}>
                                    <Image source={{ uri: qrUrl }} style={styles.qrBig} />
                                </View>
                            </View>

                            {/* Bank Details */}
                            <View style={styles.bankSide}>
                                <View style={styles.bankRowCol}>
                                    <Text style={styles.bLblMini}>Số tài khoản</Text>
                                    <Text style={styles.bValHigh}>{lodge.bank}</Text>
                                </View>
                                <View style={styles.bankRowCol}>
                                    <Text style={styles.bLblMini}>Ngân hàng</Text>
                                    <Text style={styles.bValMini}>{lodge.bankName}</Text>
                                </View>
                                <View style={styles.bankRowCol}>
                                    <Text style={styles.bLblMini}>Chủ tài khoản</Text>
                                    <Text style={styles.bValMini}>{lodge.name}</Text>
                                </View>
                                <View style={[styles.bankRowCol, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                                    <Text style={styles.bLblMini}>Nội dung CK</Text>
                                    <Text style={styles.bValHigh}>{room.name} Thang {(now.getMonth() + 1)}</Text>
                                </View>
                            </View>

                            <View style={styles.dashLine} />

                            {/* Total Amount */}
                            <View style={styles.totalSection}>
                                <Text style={[styles.tcLbl, { color: '#64748b' }]}>TỔNG CẦN THANH TOÁN</Text>
                                <Text style={[styles.tcVal, { color: COLORS.pr }]}>{total.toLocaleString('vi')} đ</Text>
                                <Text style={[styles.tcDate, { color: '#94a3b8' }]}>Hạn đóng: 05/{(now.getMonth() + 2).toString().padStart(2,'0')}/{now.getFullYear()}</Text>
                            </View>

                            <View style={styles.dashLine} />

                            {/* Details */}
                            <Text style={styles.secTit}>CHI TIẾT DỊCH VỤ</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.dLbl}>Tiền phòng</Text>
                                <Text style={styles.dVal}>{stats.rent.toLocaleString('vi')} đ</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.dLbl}>Tiền điện ({stats.eUse} kWh)</Text>
                                    <Text style={styles.dSub}>Chỉ số: {stats.pElecValue} ➞ {stats.cElec}</Text>
                                </View>
                                <Text style={styles.dVal}>{stats.eAmt.toLocaleString('vi')} đ</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.dLbl}>Tiền nước {prices.waterMode === 'fixed' ? '(Cố định)' : `(${stats.wUse} m³)`}</Text>
                                    {prices.waterMode !== 'fixed' && <Text style={styles.dSub}>Chỉ số: {stats.pWaterValue} ➞ {stats.cWater}</Text>}
                                </View>
                                <Text style={styles.dVal}>{stats.wAmt.toLocaleString('vi')} đ</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.dLbl}>Wifi + Rác</Text>
                                <Text style={styles.dVal}>{stats.fees.toLocaleString('vi')} đ</Text>
                            </View>
                            {stats.prepaid > 0 && (
                                <View style={styles.detailRow}>
                                    <Text style={[styles.dLbl, { color: COLORS.sky }]}>Trừ trả trước</Text>
                                    <Text style={[styles.dVal, { color: COLORS.sky }]}>-{stats.prepaid.toLocaleString('vi')} đ</Text>
                                </View>
                            )}

                            {room.contractPrepaid > 0 && (
                               <View style={[styles.infoPill, { marginTop: 15 }]}>
                                  <View style={styles.pillIcon}><Text style={{ color: '#166534', fontWeight: 'bold' }}>ⓘ</Text></View>
                                  <Text style={styles.pillTxt}>Hợp đồng trả trước ({room.contractPrepaid} tháng) — tiền phòng đã được thanh toán.</Text>
                               </View>
                            )}

                            <Text style={styles.footerNote}>Xin cảm ơn · AppTroLoLo</Text>
                        </View>
                    </View>
                </CaptureView>

                <View style={[styles.brow, { marginTop: 20 }]}>
                    <Button 
                        title="Chia sẻ ảnh" 
                        type="sky" 
                        icon={ShareIcon}
                        onPress={handleShare} 
                        full
                        style={{ flex: 1 }}
                    />
                    <Button 
                        title="Lưu ảnh hóa đơn" 
                        type="green"
                        icon={DownloadIcon}
                        onPress={handleCapture} 
                        full 
                        style={{ flex: 1 }}
                    />
                </View>
                
                <Button 
                    title="✓ Lưu vào hệ thống (Chưa gửi)" 
                    onPress={handleSaveBill} 
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
    container: { flex: 1, backgroundColor: '#f0fdf4' },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topbar: {
        backgroundColor: COLORS.white,
        paddingTop: 50,
        paddingBottom: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tbback: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.g6,
        borderRadius: 11,
    },
    tbtitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '900', color: COLORS.g1 },
    scroll: { padding: 14, gap: 12 },
    infoPill: {
        backgroundColor: '#dcfce7',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        gap: 10,
        borderWidth: 1,
        borderColor: '#bbf7d0',
    },
    pillIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(22,101,52,0.1)', alignItems: 'center', justifyContent: 'center' },
    pillTxt: { flex: 1, fontSize: 11, color: '#165030', fontWeight: '600', lineHeight: 16 },
    totalCard: {
        backgroundColor: '#166534',
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        ...SHADOWS.sh2,
    },
    tcLbl: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 0.5 },
    tcVal: { fontSize: 32, color: COLORS.white, fontWeight: '900', marginTop: 4 },
    tcDate: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8, fontWeight: '700' },
    tcIcon: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 20,
        padding: 20,
        ...SHADOWS.sh,
    },
    secTit: { fontSize: 10, fontWeight: '800', color: '#94a3b8', textAlign: 'center', marginBottom: 20, letterSpacing: 1 },
    brow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    captureArea: { backgroundColor: '#f0fdf4', padding: 10 },
    receiptPaper: { backgroundColor: COLORS.white, borderRadius: 16, padding: 12, ...SHADOWS.sh2 },
    billHeader: { alignItems: 'center', marginBottom: 4 },
    bhLodge: { fontSize: 10, color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
    bhTitle: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginVertical: 2, letterSpacing: 0.5 },
    bhRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bhRoom: { fontSize: 12, fontWeight: '800', color: COLORS.pr },
    bhDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#94a3b8' },
    bhDate: { fontSize: 11, fontWeight: '600', color: '#64748b' },
    qrSection: { alignItems: 'center', marginVertical: 4 },
    qrBox: { padding: 6, borderRadius: 12, borderWidth: 4, borderColor: COLORS.pr, backgroundColor: '#fff' },
    qrBig: { width: 150, height: 150 },
    dashLine: { height: 1, backgroundColor: 'transparent', marginVertical: 6, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 1 },
    bankSide: { width: '100%' },
    bankRowCol: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
    bLblMini: { fontSize: 11, color: '#64748b', fontWeight: '600' },
    bValMini: { fontSize: 12, color: '#0f172a', fontWeight: '800', textAlign: 'right', flex: 1, marginLeft: 15 },
    bValHigh: { fontSize: 13, color: COLORS.pr, fontWeight: '900', textAlign: 'right', flex: 1, marginLeft: 15 },
    totalSection: { alignItems: 'center', paddingVertical: 2 },
    tcLbl: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    tcVal: { fontSize: 28, fontWeight: '900', marginTop: 2 },
    tcDate: { fontSize: 10, marginTop: 2, fontWeight: '700' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    dLbl: { fontSize: 11, color: '#64748b', fontWeight: '700' },
    dVal: { fontSize: 12, color: '#0f172a', fontWeight: '800' },
    dSub: { fontSize: 9, color: '#94a3b8', fontStyle: 'italic', marginTop: 1 },
    footerNote: { textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 10, marginBottom: 0, fontWeight: '600' }
});

export default BillScreen;
