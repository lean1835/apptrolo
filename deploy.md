# CẨM NANG TRIỂN KHAI (DEPLOY) TOÀN TẬP - DÀNH CHO NGƯỜI MỚI BẮT ĐẦU

Chào bạn! Nếu bạn là người mới bắt đầu và đây là lần đầu tiên bạn đưa một sản phẩm công nghệ (gồm cả Web API Backend lẫn App Di Động) lên chạy thực tế trên Internet, thì đây chính là tài liệu dành cho bạn.

Tài liệu này được viết với tiêu chí **"cầm tay chỉ việc"**, giải thích rõ từng khái niệm bình dân nhất, không bỏ sót bất kỳ bước nào và hướng dẫn bạn gõ từng lệnh một cách an toàn.

---

## 🌟 GIẢI THÍCH THUẬT NGỮ DỄ HIỂU CHO NGƯỜI MỚI

*   **Local (Máy cục bộ)**: Là chiếc máy tính Windows bạn đang dùng để gõ code hàng ngày.
*   **Production (Môi trường thực tế)**: Là khi sản phẩm đã chạy online trên internet, ai cũng có thể truy cập được.
*   **VPS (Virtual Private Server - Máy chủ ảo)**: Bạn cứ tưởng tượng nó giống như một chiếc máy tính Windows/Linux thông thường của bạn, nhưng nó không có màn hình và được đặt tại một trung tâm dữ liệu cực lớn. Nó luôn được cắm điện, cắm mạng 24/24 và không bao giờ tắt. Bạn đi thuê nó để làm "nhà" cho Backend hoạt động.
*   **SSH (Secure Shell)**: Giống như một chương trình "UltraViewer phiên bản đen trắng bằng chữ". Bạn ngồi ở nhà gõ chữ lệnh, máy chủ VPS ở xa sẽ thực hiện.
*   **Docker**: Giống như một chiếc "thùng Container" chở hàng. Nó đóng gói toàn bộ code Backend, Node.js, thư viện, cơ sở dữ liệu MongoDB vào một chiếc hộp kín. Nhờ đó, app chạy trên máy của bạn thế nào thì bê lên VPS nó sẽ chạy y hệt như thế, không lo lỗi thiếu thư viện hay lệch phiên bản hệ điều hành.
*   **Domain (Tên miền)**: Ví dụ `api.apptrololo.com`. Nó giống như địa chỉ nhà của bạn thay cho toạ độ số IP khó nhớ (Ví dụ: `103.155.12.89`).
*   **SSL / HTTPS**: Chữ **S** ở cuối nghĩa là **Secure** (Bảo mật). Nó mã hoá mọi thông tin truyền qua lại giữa điện thoại và máy chủ VPS, giúp hacker không thể nghe trộm được mật khẩu hay tài khoản của người dùng. Trên iOS và Android hiện đại, app bắt buộc phải gọi lên link có chữ `https` thì mới hoạt động.
*   **EAS Build (Expo Application Services)**: Là dịch vụ "đóng gói app thuê" trên đám mây của Expo. Thay vì bạn phải cài đặt một đống công cụ nặng nề (như Android Studio, Xcode) và cần máy Mac đắt tiền, bạn chỉ cần gõ lệnh và đẩy code lên Expo Cloud. Họ sẽ tự động compile và trả về cho bạn file `.apk` (Android) hoặc `.ipa` (iOS) để cài đặt trực tiếp.

---

## 📂 SƠ ĐỒ HOẠT ĐỘNG KHI TRIỂN KHAI THỰC TẾ

```text
               +-------------------------------------------------+
               |                    MÁY CHỦ VPS                  |
               |                                                 |
               |  +--------------------+   +------------------+  |
Request HTTPS  |  | Nginx Proxy (Cổng  |   | Docker Container |  |
==============>|  | 80/443 chuyển tiếp)|==>| Backend NodeJS   |  |
Từ Điện Thoại  |  +--------------------+   | (Cổng 8080)      |  |
               |                           +------------------+  |
               |                                   ||            |
               |                           +------------------+  |
               |                           | Docker Container |  |
               |                           | MongoDB          |  |
               |                           | (Cổng 27017)     |  |
               |                           +------------------+  |
               +-------------------------------------------------+
```

---

## 🚀 PHẦN 1: CHUẨN BỊ TRƯỚC KHI DEPLOY (LOCAL CHECKLIST)

Trước khi bắt đầu đẩy app lên mạng, bạn cần cấu hình chuẩn xác các file cài đặt ở máy Windows cá nhân của mình.

### 1. Ở phía Backend:
1.  Mở file `d:\Projects\Apptrololo\backend\docker-compose.yml` lên kiểm tra. Đảm bảo các thông số cổng kết nối đã đúng dạng biến môi trường:
    *   Cổng mặc định là `8080` (hoặc cấu hình tùy chọn qua file `.env`).
    *   Phần `networks` sử dụng mạng chung `apptrololo-shared-network` dạng `external: true`.

### 2. Ở phía Mobile (App di động):
1.  Mở file `d:\Projects\Apptrololo\mobile\.env` lên. Khi chạy ở môi trường phát triển local, bạn có thể trỏ về địa chỉ IP nội bộ của máy tính. Nhưng khi đã deploy, bạn **bắt buộc** phải đổi nó sang địa chỉ Tên miền Production của bạn:
    ```env
    # Ví dụ tên miền của bạn sau khi deploy thành công:
    EXPO_PUBLIC_API_URL=https://api.apptrololo.com/api
    
    # Khóa bí mật dùng để mã hóa thông tin trao đổi dữ liệu (phải trùng khớp với khóa của Backend)
    EXPO_PUBLIC_CRYPTO_SECRET=nhap_khoa_ma_hoa_aes_dung_chung_voi_backend_o_day
    ```
2.  Mở file `mobile/app.json` lên để kiểm tra tên App, mã định danh trên các hệ điều hành:
    ```json
    {
      "expo": {
        "name": "AppTroLoLo",
        "slug": "apptrololo",
        "version": "1.0.0",
        "ios": {
          "bundleIdentifier": "com.yourname.apptrololo"
        },
        "android": {
          "package": "com.yourname.apptrololo"
        }
      }
    }
    ```

---

## 💻 PHẦN 2: HƯỚNG DẪN TRIỂN KHAI BACKEND LÊN VPS UBUNTU (TỪNG BƯỚC MỘT)

### 📌 Bước 2.1: Thuê máy chủ ảo VPS
Bạn lên các trang web cho thuê VPS như **Vietnix.vn**, **Cloudfly.vn**, **TinoHost.com** (ở Việt Nam hỗ trợ nạp tiền Momo rất tiện) hoặc các trang quốc tế như **Vultr.com**, **DigitalOcean.com** (cần thẻ Visa/Mastercard).
1.  Chọn thuê gói **VPS giá rẻ** (Ví dụ: Gói tầm 100k - 150k/tháng là cực kỳ đủ cho app chạy thử nghiệm).
2.  Hệ điều hành chọn cài sẵn: **Ubuntu 22.04 LTS** (đây là hệ điều hành Linux chạy máy chủ phổ biến nhất thế giới).
3.  Sau khi thanh toán xong, bạn sẽ nhận được một email chứa:
    *   **Địa chỉ IP (IPv4)**: Ví dụ `103.155.12.89`
    *   **Tên đăng nhập**: `root`
    *   **Mật khẩu đăng nhập**: `Ví dụ: Abc123xyz#$`

---

### 📌 Bước 2.2: Kết nối từ máy Windows của bạn vào VPS (SSH)
1.  On máy tính Windows của bạn, nhấp vào nút **Start**, gõ `PowerShell` và nhấn Enter để mở màn hình gõ lệnh.
2.  Dán lệnh dưới đây vào (hãy thay thế số IP bằng IP VPS thật của bạn nhận từ Email) rồi nhấn Enter:
    ```bash
    ssh root@103.155.12.89
    ```
3.  Nếu hệ thống hiện thông báo hỏi: `Are you sure you want to continue connecting (yes/no/[fingerprint])?` $\rightarrow$ Hãy gõ chữ **`yes`** và nhấn Enter.
4.  Tiếp theo, hệ thống sẽ yêu cầu bạn nhập mật khẩu (`root@103.155.12.89's password:`):
    *   *Lưu ý quan trọng cho người mới*: Khi bạn gõ mật khẩu trên màn hình đen Linux, **nó sẽ hoàn toàn không hiển thị ký tự gì cả** (không hiện dấu sao `*` hay dấu chấm để chống người bên cạnh nhìn trộm). Bạn cứ bình tĩnh gõ đúng từng chữ mật khẩu của mình (hoặc Copy mật khẩu rồi nhấp chuột phải vào màn hình PowerShell để Paste) rồi nhấn **Enter** là xong!
    *   Khi màn hình hiển thị dòng chữ chào mừng dạng `root@apptrololo-server:~#` nghĩa là bạn đã "UltraViewer" thành công vào máy chủ VPS.

---

### 📌 Bước 2.3: Cài đặt Docker & tạo mạng ảo bảo mật trên VPS
Dán toàn bộ các lệnh dưới đây vào màn hình VPS và nhấn Enter để máy chủ tự động cài đặt Docker:
```bash
# 1. Cập nhật và làm sạch hệ thống
apt update && apt upgrade -y

# 2. Tải và chạy script cài đặt Docker tự động từ trang chủ
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Tạo mạng ảo nội bộ để Backend và Database nói chuyện bảo mật với nhau
docker network create apptrololo-shared-network
```

---

### 📌 Bước 2.4: Đẩy code Backend lên VPS
Có rất nhiều cách để chuyển code từ máy của bạn lên VPS. 
*   **Cách khuyên dùng (Chuyên nghiệp)**: Đẩy dự án lên một kho chứa Git bảo mật (như GitHub hoặc GitLab) rồi lên VPS tải về.
*   **Các bước thực hiện**:
    1.  Cài đặt công cụ Git trên VPS:
        ```bash
        apt install git -y
        ```
    2.  Tải code dự án về thư mục `/app` trên VPS:
        ```bash
        git clone https://username:password@github.com/duong-dan-repo-cua-ban.git /app
        ```
    3.  Di chuyển vào thư mục backend vừa tải về:
        ```bash
        cd /app/backend
        ```

---

### 📌 Bước 2.5: Tạo file cấu hình môi trường (.env) và khởi chạy Docker
1.  Tại thư mục `/app/backend` trên VPS, gõ lệnh sau để tạo file cấu hình môi trường chạy thực tế:
    ```bash
    nano .env
    ```
2.  Màn hình chỉnh sửa văn bản mở ra, bạn dán nội dung cấu hình này vào:
    ```env
    PORT=8080
    MONGODB_URI=mongodb://mongodb:27017/apptrololo
    JWT_SECRET=thay_the_bang_chuoi_random_phai_that_dai_va_bao_mat_o_day
    JWT_EXPIRATION=86400000
    NODE_ENV=production
    ```
3.  Để lưu và thoát:
    *   Nhấn tổ hợp phím **Ctrl + O** $\rightarrow$ Nhấn **Enter** (để ghi đè lưu file).
    *   Nhấn tổ hợp phím **Ctrl + X** (để thoát ra màn hình chính).
4.  **BẬT CONTAINERS CHẠY NGẦM**: 
    Gõ lệnh thần thánh sau để Docker tự động tải MongoDB về, đóng gói Backend và chạy ẩn ở chế độ nền 24/24:
    ```bash
    docker-compose up -d --build
    ```
    *Chờ khoảng 1-2 phút cho lần chạy đầu tiên. Gõ lệnh `docker ps` để kiểm tra, nếu thấy container trạng thái `Up` là đã thành công!*

---

### 📌 Bước 2.6: Trỏ tên miền & Cấu hình Nginx Reverse Proxy
Điện thoại của người dùng sẽ gọi lên địa chỉ tên miền dạng `https://api.apptrololo.com`. Chúng ta sẽ cài đặt Nginx để đón nhận các cuộc gọi này và chuyển vào cổng `8080` của Docker Backend đang chạy ẩn.

1.  **Trỏ Tên Miền**: Vào trang quản lý tên miền bạn đã mua (ví dụ Nhân Hòa, Mắt Bão, GoDaddy...), thêm bản ghi **A** trỏ về địa chỉ **IP của VPS**.
    *   *Loại bản ghi*: `A`
    *   *Tên bản ghi (Host)*: `api`
    *   *Giá trị (Points to)*: `IP của VPS của bạn`
2.  Cài đặt phần mềm Nginx trên VPS:
    ```bash
    apt install nginx -y
    ```
3.  Tạo file cấu hình chuyển tiếp:
    ```bash
    nano /etc/nginx/sites-available/apptrololo
    ```
    *Dán nội dung cấu hình chuẩn này vào:*
    ```nginx
    server {
        listen 80;
        server_name api.apptrololo.com; # Thay thế bằng tên miền của bạn

        # Giới hạn kích thước file upload (nếu có chức năng upload hóa đơn nặng)
        client_max_body_size 10M;

        location / {
            proxy_pass http://127.0.0.1:8080; # Chuyển tiếp vào cổng 8080 của Docker Backend
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
    ```
    *Nhấn **Ctrl + O** $\rightarrow$ **Enter** để lưu, nhấn **Ctrl + X** để thoát.*
4.  Kích hoạt và khởi động lại Nginx:
    ```bash
    ln -s /etc/nginx/sites-available/apptrololo /etc/nginx/sites-enabled/
    nginx -t  # Lệnh kiểm tra xem file cấu hình có lỗi cú pháp không
    systemctl restart nginx
    ```

---

### 📌 Bước 2.7: Cấp chứng chỉ SSL HTTPS Miễn Phí (Let's Encrypt)
Để trang web/API của bạn có ổ khóa xanh bảo mật HTTPS, ta cài đặt công cụ Certbot để tự động xin chứng chỉ SSL miễn phí từ tổ chức uy tín toàn cầu Let's Encrypt.
1.  Cài đặt Certbot:
    ```bash
    apt install certbot python3-certbot-nginx -y
    ```
2.  Chạy lệnh xin chứng chỉ tự động cho tên miền của bạn:
    ```bash
    certbot --nginx -d api.apptrololo.com
    ```
3.  Certbot sẽ hỏi một vài câu:
    *   *Nhập email*: Hãy nhập email thật của bạn để nhận cảnh báo nếu chứng chỉ sắp hết hạn (nó sẽ tự động gia hạn nên bạn không cần lo lắng).
    *   *Đồng ý điều khoản*: Gõ `A` hoặc `Y`.
    *   *Tự động chuyển hướng (Redirect)*: Khi được hỏi có tự động chuyển mọi kết nối HTTP sang HTTPS an toàn không, hãy chọn số **`2`** (hoặc chọn `Redirect`) $\rightarrow$ Nhấn Enter.
4.  **Kiểm tra thành quả**: Mở trình duyệt trên điện thoại hoặc máy tính gõ đường dẫn: **`https://api.apptrololo.com/health`** (thay tên miền của bạn vào). Nếu trang hiển thị chữ `{"status": "OK"}` và góc trình duyệt có **biểu tượng ổ khóa màu xanh** thì xin chúc mừng: **Bạn đã triển khai thành công 100% Backend cực kỳ chuyên nghiệp!**

---

## 📱 PHẦN 3: ĐÓNG GÓI ỨNG DỤNG DI ĐỘNG (MOBILE EXPO + EAS)

Bây giờ chúng ta sẽ tiến hành đóng gói ứng dụng di động phía Frontend để gửi cho người dùng cài đặt. Các bước này bạn sẽ thực hiện trực tiếp **trên máy tính Windows cá nhân (Local)** của mình.

### 📌 Bước 3.1: Cài đặt công cụ EAS CLI
Mở một cửa sổ PowerShell hoặc CMD mới trên máy Windows của bạn, gõ lệnh sau để cài đặt công cụ đóng gói đám mây của Expo:
```bash
npm install -g eas-cli
```

### 📌 Bước 3.2: Đăng ký & Đăng nhập tài khoản Expo
1.  Nếu chưa có tài khoản, bạn hãy truy cập trang chủ **[expo.dev](https://expo.dev)** để đăng ký một tài khoản miễn phí.
2.  Quay lại màn hình dòng lệnh PowerShell trên Windows, gõ lệnh:
    ```bash
    eas login
    ```
    *Điền Username và Mật khẩu tài khoản Expo của bạn vào để đăng nhập.*

### 📌 Bước 3.3: Khởi tạo liên kết dự án di động
Di chuyển vào thư mục chứa code Mobile của bạn trên Windows:
```powershell
cd d:\Projects\Apptrololo\mobile
```
Chạy lệnh khởi tạo để liên kết thư mục code cục bộ này với một dự án mới trên bảng điều khiển đám mây Expo Dashboard:
```bash
eas project:init
```

### 📌 Bước 3.4: Tạo file cấu hình đóng gói `eas.json`
Để định nghĩa các cấu hình đóng gói (ví dụ đóng gói thành file cài trực tiếp `.apk` cho Android hoặc file đẩy lên Store), bạn cần có file `eas.json`.
1.  Chạy lệnh tạo file tự động:
    ```bash
    eas build:configure
    ```
2.  Mở file `eas.json` vừa sinh ra ở thư mục `mobile/` và chỉnh sửa nội dung giống hệt như thế này để hỗ trợ xuất file cài đặt thử nghiệm nhanh (`.apk`):
    ```json
    {
      "cli": {
        "version": ">= 10.0.0"
      },
      "build": {
        "development": {
          "developmentClient": true,
          "distribution": "internal"
        },
        "preview": {
          "distribution": "internal",
          "android": {
            "buildType": "apk"
          }
        },
        "production": {}
      },
      "submit": {
        "production": {}
      }
    }
    ```

### 📌 Bước 3.5: Tiến hành Đóng gói (Build) ứng dụng lên đám mây

#### 🚀 Cách đóng gói cho hệ điều hành Android (Xuất file cài đặt `.apk` trực tiếp)
Đây là cách nhanh nhất để bạn có tệp cài đặt gửi cho bạn bè hoặc tự cài vào điện thoại cá nhân thử nghiệm:
1.  Đảm bảo file `mobile/.env` đã trỏ đúng về địa chỉ API HTTPS thật trên VPS của bạn (ở Bước 2.7).
2.  Gõ lệnh sau trên máy Windows:
    ```bash
    eas build --platform android --profile preview
    ```
3.  Tiến trình sẽ diễn ra hoàn toàn tự động: Code của bạn sẽ được upload lên máy chủ đám mây của Expo $\rightarrow$ Máy chủ tiến hành compile mã nguồn $\rightarrow$ Tạo file `.apk`.
4.  **Kết quả**: Khi quá trình hoàn tất (mất khoảng 5-10 phút tùy độ lớn dự án), màn hình dòng lệnh sẽ hiển thị một **mã QR cực lớn**. Bạn chỉ việc mở camera điện thoại lên, quét mã QR này để tải trực tiếp file cài đặt `.apk` về máy điện thoại Android cài đặt nghiệm thu!

#### 🍏 Cách đóng gói cho hệ điều hành iOS (Apple Store / TestFlight)
*Lưu ý: Để đóng gói cho hệ điều hành iOS, Apple bắt buộc bạn phải có tài khoản Apple Developer trả phí (99 USD/năm) thì máy chủ đám mây mới ký số chứng chỉ hợp lệ được.*
```bash
eas build --platform ios --profile production
```
*(Hệ thống sẽ hướng dẫn bạn đăng nhập tài khoản nhà phát triển Apple và tự động xử lý mọi chứng chỉ cấu hình phức tạp).*

---

## 🛠️ PHẦN 4: HƯỚNG DẪN BẢO TRÌ & SỬA LỖI THƯỜNG GẶP (TROUBLESHOOTING)

Trong quá trình vận hành thực tế, chắc chắn bạn sẽ gặp những tình huống cần bảo trì hoặc sửa lỗi. Dưới đây là các cẩm nang xử lý nhanh:

### Lỗi 1: Điện thoại báo "Network Error" (Lỗi kết nối mạng)
*   **Nguyên nhân 1**: Bạn quên chưa đổi link `EXPO_PUBLIC_API_URL` trong file `mobile/.env` sang tên miền HTTPS của VPS, hoặc vẫn để là `localhost`/IP local.
*   **Nguyên nhân 2**: Chứng chỉ SSL của bạn bị lỗi hoặc chưa trỏ đúng tên miền về IP VPS.
*   **Cách sửa**: Mở trình duyệt điện thoại truy cập thử `https://api.apptrololo.com/health`. Nếu điện thoại không hiện chữ `OK` nghĩa là mạng kết nối giữa điện thoại và VPS đang có vấn đề, hãy kiểm tra lại cấu hình Nginx hoặc tường lửa VPS.

### Lỗi 2: Bạn sửa code Backend ở máy local, làm thế nào để cập nhật lên VPS?
Khi bạn code thêm tính năng mới ở máy local và muốn cập nhật lên VPS:
1.  Ở máy local: Đẩy code mới lên Git (GitHub/GitLab).
2.  SSH vào VPS và di chuyển vào thư mục Backend:
    ```bash
    cd /app/backend
    ```
3.  Kéo mã nguồn mới nhất từ Git về:
    ```bash
    git pull
    ```
4.  Chạy lệnh cập nhật Docker (Docker sẽ tự động phát hiện file nào thay đổi, build lại và khởi động lại container mới mà không làm gián đoạn hệ thống):
    ```bash
    docker-compose up -d --build
    ```

### Lỗi 3: Làm thế nào để xem lỗi (Log) của Backend đang chạy ẩn?
Nếu người dùng báo app bị lỗi và bạn muốn xem Backend ghi nhận lỗi gì:
1.  SSH vào VPS.
2.  Gõ lệnh xem luồng ghi nhật ký thời gian thực của container Backend:
    ```bash
    docker logs -f apptrololo-be
    ```
    *(Nhấn **Ctrl + C** để thoát khỏi chế độ xem log).*

---

**Chúc mừng bạn đã sở hữu cẩm nang triển khai hệ thống toàn tập! Bạn hãy mở file này và bắt đầu thực hành từng bước một để tự tay đưa sản phẩm công nghệ đầu tay của mình lên Internet nhé!**
