# Hướng dẫn Khởi chạy Hệ thống Quản lý Nhà trọ (AppTroLoLo)

Hệ thống đã được refactor hoàn chỉnh từ Java Spring Boot + MySQL sang **Node.js (TypeScript/Express) + MongoDB**, đảm bảo tối ưu hóa hiệu năng, tính bảo mật cao, sạch mã nguồn và sẵn sàng chạy Docker/DevOps.

Dưới đây là tài liệu hướng dẫn chi tiết cách thiết lập cơ sở dữ liệu, khởi chạy Backend và Mobile App.

---

## 1. Kiến trúc Hệ thống
* **Database**: MongoDB (Cục bộ trên cổng `27017`).
* **Backend**: Node.js v20 (TypeScript, Express 5) chạy trên cổng `8080`.
* **Mobile App**: Expo React Native (giao diện di động chạy qua Expo Go) trên cổng `8081`.

---

## 2. Thiết lập Cơ sở dữ liệu (MongoDB)

Bạn có hai lựa chọn để chạy cơ sở dữ liệu MongoDB:

### Lựa chọn 1: Chạy trực tiếp bằng Docker Compose (Khuyên dùng - Tiện lợi nhất)
Thư mục gốc đã được tích hợp sẵn file `docker-compose.yml` để dựng cả Database lẫn Backend chỉ bằng 1 câu lệnh.
1. Đảm bảo máy tính đã cài đặt và đang chạy **Docker Desktop**.
2. Mở terminal tại thư mục `backend/` và chạy lệnh:
   ```bash
   cd backend
   docker-compose up -d
   ```
3. Docker sẽ tự động tải, cấu hình MongoDB 6.0 và build mã nguồn Node.js để chạy hệ thống ở cổng `8080`.

### Lựa chọn 2: Chạy MongoDB cục bộ trên máy tính (Local MongoDB)
1. Tải và cài đặt **MongoDB Community Server** từ trang chủ MongoDB.
2. Khởi động dịch vụ MongoDB (mặc định sẽ lắng nghe ở địa chỉ `mongodb://localhost:27017`).
3. Bạn có thể cài thêm **MongoDB Compass** để dễ dàng xem và quản lý dữ liệu trực quan qua giao diện đồ họa.

---

## 3. Hướng dẫn Khởi chạy Backend Node.js (Local Development)

Nếu muốn phát triển và sửa đổi code backend cục bộ (không thông qua Docker):

### Bước 1: Cài đặt các gói thư viện
Mở VS Code Terminal, di chuyển vào thư mục `backend/` và chạy lệnh cài đặt bằng **Yarn**:
```bash
cd backend
yarn install
```

### Bước 2: Cấu hình biến môi trường
File `.env` đã được cấu hình sẵn các tham số chuẩn kết nối MongoDB và mã khóa JWT.
Nếu cần thay đổi (ví dụ: đổi cổng chạy hoặc URI kết nối Mongo Cloud):
* Chỉnh sửa trực tiếp file [backend/.env](file:///d:/Projects/Apptrololo/backend/.env):
  ```env
  PORT=8080
  MONGODB_URI=mongodb://localhost:27017/apptrololo
  JWT_SECRET=vidu
  JWT_EXPIRATION=2
  ```

### Bước 3: Khởi chạy Server ở chế độ Phát triển (Dev Mode)
Chạy lệnh sau tại thư mục `backend/`:
```bash
yarn dev
```
Khi Server khởi động thành công, màn hình terminal sẽ hiển thị các bản ghi log:
```text
2026-05-23 11:16:53 [info]: ✅ Successfully connected to MongoDB database
2026-05-23 11:16:54 [info]: ✅ Seeder: Default user created successfully: SĐT: 0912345678 / MK: 123456
2026-05-23 11:16:54 [info]: 🚀 Server running in development mode on port 8080
2026-05-23 11:16:54 [info]: 🔗 Health check available at http://localhost:8080/health
```

> [!TIP]
> **Dữ liệu Khởi tạo Mẫu (Seed Data)**:
> Khi hệ thống kết nối cơ sở dữ liệu MongoDB lần đầu tiên, bộ Seeder sẽ **tự động tạo sẵn** tài khoản quản trị mẫu dưới đây để bạn đăng nhập thử trên điện thoại:
> * **Số điện thoại (SĐT)**: `0912345678`
> * **Mật khẩu (MK)**: `123456`
> * **Nhà trọ mẫu**: `Nhà trọ Mẫu` tại *Số 1 Đại Cồ Việt, Hà Nội* (đã nạp sẵn biểu giá điện nước tiêu chuẩn).

---

## 4. Hướng dẫn Khởi chạy Mobile App (React Native - Expo)

### Bước 1: Cấu hình kết nối API tới Máy tính (Quan trọng)
Hệ thống kết nối HTTP của Mobile App đã được cấu hình tự động lấy địa chỉ IP LAN của máy tính chạy backend khi bạn mở ứng dụng bằng Expo.

> [!IMPORTANT]
> **Quy tắc kết nối trên Thiết bị thật (Điện thoại cầm tay)**:
> 1. Điện thoại di động của bạn và máy tính chạy backend **bắt buộc phải kết nối chung một mạng Wi-Fi**.
> 2. Nếu Expo không tự động nhận dạng được IP LAN của máy tính, hãy mở file [mobile/src/services/api.js](file:///d:/Projects/Apptrololo/mobile/src/services/api.js#L8-L16) và chỉnh sửa thủ công dòng:
>    ```javascript
>    // Thay <IP_LAN_CỦA_MÁY_BẠN> bằng địa chỉ IP máy tính của bạn (VD: 192.168.1.5)
>    return 'http://192.168.1.5:8080/api';
>    ```

### Bước 2: Cài đặt thư viện của Mobile App
Mở một terminal mới trong VS Code, di chuyển vào thư mục `mobile/` và chạy lệnh cài đặt:
```bash
cd mobile
yarn install
```

### Bước 3: Khởi chạy ứng dụng Expo
Chạy lệnh sau tại thư mục `mobile/`:
```bash
yarn start
```
Terminal sẽ hiển thị một **mã QR lớn** cùng các tùy chọn chạy.

### Bước 4: Mở ứng dụng trên điện thoại
1. Tải ứng dụng **Expo Go** từ App Store (iOS) hoặc Google Play Store (Android) về điện thoại của bạn.
2. Mở ứng dụng **Expo Go**:
   * **Đối với Android**: Chọn tính năng **Scan QR Code** trong ứng dụng và quét mã QR trên màn hình terminal máy tính.
   * **Đối với iOS**: Mở ứng dụng **Camera** mặc định của iPhone, quét mã QR và nhấn mở liên kết Expo.
3. Ứng dụng sẽ tự động tải JavaScript Bundle từ máy tính của bạn và mở màn hình Đăng nhập của App Trọ.
4. Đăng nhập bằng tài khoản mẫu: SĐT **`0912345678`** / Mật khẩu **`123456`** để bắt đầu quản lý phòng trọ!

---

## 5. Hướng dẫn chạy giao diện Web tĩnh (Standalone HTML)

Nếu bạn muốn xem giao diện thô/HTML đơn lẻ của hệ thống:
* Nhấp đúp chuột để mở trực tiếp tệp tin [app_tro_lo_lo (1).html](file:///d:/Projects/Apptrololo/app_tro_lo_lo%20(1).html) bằng bất kỳ trình duyệt nào (Chrome, Edge, Safari).