import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { APP_CONFIG, STORAGE_KEYS } from "../constants";

export type LanguageType = "vi" | "en";

interface TranslationKeys {
  [key: string]: string;
}

const translations: Record<LanguageType, TranslationKeys> = {
  vi: {
    // General
    loading: "Đang tải...",
    loadingData: "Đang tải dữ liệu...",
    success: "Thành công",
    error: "Lỗi",
    saveSuccess: "Đã lưu thành công",
    saveFailed: "Lưu thất bại",
    systemError: "Có lỗi xảy ra trên hệ thống",
    or: "hoặc",
    
    // Login
    loginTitle: "App Trọ",
    loginSub: "Quản lý nhà trọ thông minh",
    phone: "Số điện thoại",
    password: "Mật khẩu",
    loginBtn: "Đăng nhập",
    forgotPwd: "Quên mật khẩu?",
    noAccount: "Chưa có tài khoản? Đăng ký ngay",
    phoneEmpty: "Vui lòng nhập số điện thoại!",
    passwordEmpty: "Vui lòng nhập mật khẩu!",
    whitespaceErr: "Không được chỉ nhập khoảng trắng!",
    
    // Bill screen
    invoice: "Hóa đơn",
    invoiceTitle: "HÓA ĐƠN TIỀN NHÀ",
    room: "Phòng",
    month: "Tháng",
    earlyWarning: "Hóa đơn này được xuất sớm! Ngày dự kiến thu tiền hàng tháng của phòng này là ngày {date} (Cho phép thu trước tối đa 3 ngày).",
    bankAccount: "Số tài khoản",
    bankName: "Ngân hàng",
    bankOwner: "Chủ tài khoản",
    transferDetails: "Nội dung CK",
    totalDue: "TỔNG CẦN THANH TOÁN",
    dueDate: "Hạn đóng",
    serviceDetails: "CHI TIẾT DỊCH VỤ",
    rent: "Tiền phòng",
    rentMonths: "(x{count} tháng)",
    electricity: "Tiền điện",
    electricityDetail: "Chỉ số: {prior} ➞ {current}",
    water: "Tiền nước",
    waterFixed: "(Cố định)",
    wifiGarbage: "Wifi + Rác",
    prepaidDeduct: "Trừ trả trước",
    prepaidContractNote: "Hợp đồng trả trước ({count} tháng) — tiền phòng đã được thanh toán.",
    thankYou: "Xin cảm ơn · AppTroLoLo",
    shareImage: "Chia sẻ ảnh",
    saveBillImage: "Lưu ảnh hóa đơn",
    billSaveSuccess: "Đã lưu ảnh hóa đơn vào Thư viện ảnh và cập nhật trạng thái Đã gửi",
    billSaveFailed: "Không thể tạo ảnh hóa đơn",
    billShareFailed: "Không thể chia sẻ ảnh",
    billSaveSystemSuccess: "Đã lưu hóa đơn hệ thống",
    billSaveSystemFailed: "Không thể lưu hóa đơn",
  },
  en: {
    // General
    loading: "Loading...",
    loadingData: "Loading data...",
    success: "Success",
    error: "Error",
    saveSuccess: "Saved successfully",
    saveFailed: "Save failed",
    systemError: "An error occurred on the system",
    or: "or",
    
    // Login
    loginTitle: "Lodge App",
    loginSub: "Smart lodge management system",
    phone: "Phone Number",
    password: "Password",
    loginBtn: "Login",
    forgotPwd: "Forgot password?",
    noAccount: "Don't have an account? Register now",
    phoneEmpty: "Please enter your phone number!",
    passwordEmpty: "Please enter your password!",
    whitespaceErr: "Cannot contain only white spaces!",
    
    // Bill screen
    invoice: "Invoice",
    invoiceTitle: "RENTAL INVOICE",
    room: "Room",
    month: "Month",
    earlyWarning: "This invoice is issued early! The expected monthly collection date is {date} (Maximum 3 days in advance).",
    bankAccount: "Account No.",
    bankName: "Bank Name",
    bankOwner: "Account Owner",
    transferDetails: "Transfer Desc",
    totalDue: "TOTAL AMOUNT DUE",
    dueDate: "Due Date",
    serviceDetails: "SERVICE DETAILS",
    rent: "Room Rent",
    rentMonths: "(x{count} months)",
    electricity: "Electricity",
    electricityDetail: "Index: {prior} ➞ {current}",
    water: "Water usage",
    waterFixed: "(Fixed)",
    wifiGarbage: "Wifi & Garbage",
    prepaidDeduct: "Deduct Prepaid",
    prepaidContractNote: "Prepaid contract ({count} months) — room rent has been paid.",
    thankYou: "Thank you · AppTroLoLo",
    shareImage: "Share Image",
    saveBillImage: "Save Invoice",
    billSaveSuccess: "Saved invoice image to Photos Library and updated status to Sent",
    billSaveFailed: "Could not generate invoice image",
    billShareFailed: "Could not share image",
    billSaveSystemSuccess: "System invoice saved successfully",
    billSaveSystemFailed: "Could not save invoice to system",
  }
};

interface LanguageContextProps {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageType>(APP_CONFIG.DEFAULT_LANGUAGE as LanguageType);

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
        if (savedLang === "vi" || savedLang === "en") {
          setLanguageState(savedLang);
        }
      } catch (err) {
        console.error("Failed to load saved language", err);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = async (lang: LanguageType) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
    } catch (err) {
      console.error("Failed to save language choice", err);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const dict = translations[language];
    let text = dict[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`{${pKey}}`, "g"), String(pVal));
      });
    }
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
