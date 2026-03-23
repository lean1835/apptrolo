# Haven app

Hướng dẫn xây csdl local:
mở csdl(mysql):
mở file /db/schema.sql
paste nội dung file vào my sql
ở \Apptrololo\backend\src\main\resources
vào sửa thông tin của sql theo tk mk và link schema của mình
server.address=0.0.0.0
spring.application.name=backend
spring.datasource.url=jdbc:mysql://localhost:3306/apptrololo?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root

Hướng dẫn chạy backend:
ở vs code: 
mở terminal
cd backend
mvn spring-boot:run

Hướng dẫn chạy frontend(mobileapp)
ở vs code: 
mở terminal
cd mobile
npm i
npx expo start
(có thể click 8081 để vào hoặc dùng đt mở app expo quét mã để vào)
