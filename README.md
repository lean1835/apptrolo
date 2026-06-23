<p align="center">
  <img src="mobile/assets/images/renthome.png" alt="Nhà Trọ Số Logo" width="100" height="100" style="border-radius: 20px;" />
</p>

<h1 align="center">Nhà Trọ Số</h1>
<p align="center"><strong>Giải pháp số hóa quản lý nhà trọ</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-brightgreen" alt="Platform" />
  <img src="https://img.shields.io/badge/Expo-SDK%2054-blue" alt="Expo SDK" />
  <img src="https://img.shields.io/badge/Node.js-v20-339933" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas%20%7C%20Local-47A248" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/License-Private-red" alt="License" />
</p>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng chính](#-tính-năng-chính)
- [Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Cài đặt và Khởi chạy](#-cài-đặt-và-khởi-chạy)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Tài khoản mẫu](#-tài-khoản-mẫu)
- [Triển khai Production](#-triển-khai-production)

---

## 🏠 Giới thiệu

**Nhà Trọ Số** là ứng dụng di động quản lý nhà trọ cho thuê toàn diện, được xây dựng trên nền tảng **React Native (Expo)** kết hợp với backend **Node.js/TypeScript** và cơ sở dữ liệu **MongoDB**. Ứng dụng giúp chủ trọ số hóa toàn bộ quy trình vận hành — từ quản lý phòng, ghi chỉ số điện nước, lập hóa đơn tự động, theo dõi công nợ, đến gửi thông báo nhắc nhở thu tiền.

---

## ✨ Tính năng chính

### 📊 Trang chủ & Tổng quan
- Dashboard thống kê tổng quan: phòng có khách, phòng trống, phòng chưa thu tiền
- Biểu đồ doanh thu đã thu vs. chờ thu theo tháng
- Danh sách việc cần làm: chốt điện nước, gửi hóa đơn, thu tiền
- Timeline hoạt động gần đây

### 🏢 Quản lý Phòng
- Thêm / sửa / xóa phòng trọ
- Theo dõi trạng thái phòng (có khách, trống, nợ)
- Quản lý thành viên trong phòng (check-in / check-out)
- Xem lịch sử phòng

### ⚡ Ghi chỉ số Điện Nước
- Ghi chỉ số điện & nước theo tháng cho từng phòng
- Tự động tính toán lượng tiêu thụ dựa trên chỉ số cũ - mới
- Nhắc nhở khi đến hạn ghi chỉ số

### 💰 Hóa đơn & Công nợ
- Tự động lập hóa đơn dựa trên biểu giá và chỉ số điện nước
- Quản lý trạng thái thanh toán (chờ gửi → đã gửi → đã thu)
- Xuất hóa đơn dạng hình ảnh để gửi cho khách thuê
- Theo dõi công nợ tổng hợp

### 🔔 Thông báo thông minh
- Push notification nhắc nhở khi đến hạn ghi điện nước
- Push notification nhắc nhở khi có hóa đơn chưa thu
- Lập lịch thông báo tương lai tự động theo chu kỳ
- Hỗ trợ cả Android & iOS

### ⚙️ Cài đặt
- Quản lý thông tin nhà trọ (tên, địa chỉ, biểu giá)
- Tùy chỉnh biểu giá điện / nước / dịch vụ
- Đổi mật khẩu, quên mật khẩu (qua email OTP)
- Đa ngôn ngữ (Tiếng Việt / English)

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                    MOBILE APP (Client)                  │
│          React Native · Expo SDK 54 · Hermes            │
│                    Port: 8081                           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST (Axios)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND API (Server)                   │
│      Node.js v20 · TypeScript · Express 5 · JWT         │
│                    Port: 8080                           │
│                                                         │
│  Modules: Auth · Room · Bill · Lodge · Activity ·       │
│           UtilityPrice · Data                           │
└──────────────────────┬──────────────────────────────────┘
                       │ Mongoose ODM
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   DATABASE                              │
│          MongoDB Atlas (Cloud) hoặc Local               │
│                  Port: 27017                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Công nghệ sử dụng

| Thành phần | Công nghệ | Phiên bản |
|---|---|---|
| **Mobile** | React Native (Expo) | SDK 54 / RN 0.81 |
| **JS Engine** | Hermes (AOT Compilation) | — |
| **Navigation** | Expo Router (File-based) | v6 |
| **Backend** | Node.js + Express | v20 / Express 5 |
| **Ngôn ngữ** | TypeScript | v5.x |
| **Database** | MongoDB (Mongoose) | v8 |
| **Auth** | JWT (JSON Web Token) | — |
| **Notifications** | expo-notifications | v0.32 |
| **Email** | Nodemailer (Gmail SMTP) | — |
| **Logging** | Winston + Daily Rotate | — |
| **Container** | Docker + Docker Compose | — |

---

## 📦 Yêu cầu hệ thống

### Phát triển (Development)
- **Node.js** >= 20.x
- **Yarn** >= 1.22
- **MongoDB** (Local Community Server hoặc Atlas Cloud)
- **Expo Go** trên điện thoại (Android / iOS)
- **Docker Desktop** (tùy chọn, nếu muốn chạy qua Docker)

### Thiết bị di động
- **Android** >= 6.0 (API 23)
- **iOS** >= 15.0
- Kết nối chung mạng Wi-Fi LAN với máy tính phát triển

---

## 🚀 Cài đặt và Khởi chạy

### 1. Clone dự án

```bash
git clone <repository-url>
cd Apptrololo
```

### 2. Khởi chạy Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Cài đặt dependencies
yarn install

# Khởi chạy development server
yarn dev
```

Khi thành công, terminal sẽ hiển thị:
```
✅ Successfully connected to MongoDB database
✅ Seeder: Default user created successfully: SĐT: 0912345678 / MK: 123456
🚀 Server running in development mode on port 8080
🔗 Health check available at http://localhost:8080/health
```

> [!TIP]
> **Biến môi trường**: File `.env` đã được cấu hình sẵn kết nối MongoDB Atlas. Nếu muốn dùng MongoDB cục bộ, sửa giá trị `MONGODB_URI` trong file `backend/.env`:
> ```env
> MONGODB_URI=mongodb://localhost:27017/nhatro_db
> ```

### 3. Khởi chạy Mobile App

Mở **terminal mới** (giữ nguyên backend đang chạy):

```bash
# Di chuyển vào thư mục mobile
cd mobile

# Cài đặt dependencies
yarn install

# Khởi chạy Expo development server
npx expo start
```

Terminal sẽ hiển thị **mã QR** — quét bằng ứng dụng **Expo Go** trên điện thoại để mở app.

> [!IMPORTANT]
> **Kết nối trên thiết bị thật**: Điện thoại và máy tính phải kết nối **chung một mạng Wi-Fi**. Nếu Expo không tự nhận IP LAN, chỉnh sửa thủ công trong file `mobile/src/services/api.js`:
> ```javascript
> return 'http://<IP_MÁY_TÍNH>:8080/api';
> ```

### 4. Khởi chạy bằng Docker (Tùy chọn)

```bash
cd backend
docker-compose up -d
```

Docker sẽ tự động dựng MongoDB 6.0 + Backend Node.js và chạy trên cổng `8080`.

---

## 📂 Cấu trúc dự án

```
Apptrololo/
├── backend/                    # Backend API Server
│   ├── src/
│   │   ├── common/             # Interfaces, utils, middleware
│   │   ├── config/             # Database & app configuration
│   │   ├── modules/
│   │   │   ├── auth/           # Đăng nhập, đăng ký, JWT, quên MK
│   │   │   ├── room/           # CRUD phòng, thành viên, check-in/out
│   │   │   ├── bill/           # Hóa đơn, công nợ, thanh toán
│   │   │   ├── lodge/          # Thông tin nhà trọ
│   │   │   ├── activity/       # Log hoạt động
│   │   │   ├── utilityPrice/   # Biểu giá điện, nước, dịch vụ
│   │   │   └── data/           # Seed data, import/export
│   │   └── server.ts           # Entry point
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── .env
│   └── package.json
│
├── mobile/                     # Mobile App (React Native / Expo)
│   ├── app/                    # Expo Router (file-based routing)
│   │   ├── (auth)/             # Auth screens (login, register, forgot)
│   │   ├── (tabs)/             # Main tab screens
│   │   └── _layout.tsx         # Root layout
│   ├── assets/                 # Icons, images, fonts
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # Auth, Language contexts
│   │   ├── modules/
│   │   │   ├── auth/           # Login, Register, ForgotPassword
│   │   │   ├── home/           # Dashboard, notifications
│   │   │   ├── room/           # Rooms list, room detail
│   │   │   ├── meter/          # Ghi chỉ số điện nước
│   │   │   ├── bill/           # Hóa đơn, công nợ
│   │   │   ├── member/         # Quản lý thành viên
│   │   │   ├── tenant/         # Thông tin khách thuê
│   │   │   ├── lodge/          # Cài đặt nhà trọ
│   │   │   └── settings/       # Cài đặt ứng dụng
│   │   ├── services/           # API client (Axios)
│   │   ├── styles/             # Theme, colors, shadows
│   │   └── utils/              # Helpers, formatters
│   ├── app.json                # Expo config
│   └── package.json
│
└── README.md
```

---

## 🔑 Tài khoản mẫu

Khi khởi chạy backend lần đầu, hệ thống Seeder sẽ tự động tạo tài khoản mẫu:

| Thông tin | Giá trị |
|---|---|
| **Số điện thoại** | `0912345678` |
| **Mật khẩu** | `123456` |
| **Nhà trọ** | Nhà trọ Mẫu — Số 1 Đại Cồ Việt, Hà Nội |

> [!NOTE]
> Tài khoản mẫu đã được nạp sẵn biểu giá điện nước tiêu chuẩn. Bạn có thể đăng nhập ngay trên Expo Go để trải nghiệm đầy đủ các tính năng.

---

## 🌐 Triển khai Production

### Build APK / AAB (Android)

```bash
cd mobile

# Build APK để cài trực tiếp
eas build --platform android --profile preview

# Build AAB để tải lên Google Play
eas build --platform android --profile production
```

### Build iOS

```bash
eas build --platform ios --profile production
```

### Deploy Backend

Backend hỗ trợ triển khai qua **Docker** hoặc bất kỳ nền tảng nào hỗ trợ Node.js (VPS, Railway, Render, Fly.io...):

```bash
cd backend

# Build production
yarn build

# Start server
yarn start
```

---

## 📄 Scripts có sẵn

### Backend (`backend/`)

| Lệnh | Mô tả |
|---|---|
| `yarn dev` | Khởi chạy dev server (hot-reload) |
| `yarn build` | Build production (TypeScript → JavaScript) |
| `yarn start` | Chạy bản production |
| `yarn lint` | Kiểm tra lỗi TypeScript |

### Mobile (`mobile/`)

| Lệnh | Mô tả |
|---|---|
| `npx expo start` | Khởi chạy Expo dev server |
| `npx expo start --android` | Chạy trực tiếp trên Android |
| `npx expo start --ios` | Chạy trực tiếp trên iOS |
| `npx tsc --noEmit` | Kiểm tra lỗi TypeScript |

---

<p align="center">
  Được phát triển với ❤️ bởi <strong>Nhà Trọ Số Team</strong>
</p>