# 🚀 HỆ THỐNG GỢI Ý ĐỊA ĐIỂM DU LỊCH CÁ NHÂN HÓA (TRAVEL RECOMMENDATION SYSTEM)

Hệ thống gợi ý địa điểm du lịch thông minh, ứng dụng kết hợp hai thuật toán học máy cốt lõi: **Content-Based Filtering (Lọc dựa trên Nội dung) có cá nhân hóa** và **Item-Based Collaborative Filtering (Lọc cộng tác dựa trên địa điểm) tích hợp Implicit Feedback**.

---

## 📌 1. Kiến Trúc Hệ Thống & Cổng Dịch Vụ (Port Allocation)

Dự án được xây dựng theo kiến trúc Microservices & Multi-module phân lớp rõ ràng:

*   **Frontend**: ReactJS + TypeScript + TailwindCSS + Vite (Cổng mặc định: `5173`)
*   **Backend Gateway/Core**: Java Spring Boot 3.4.3 + Spring Security + Spring Data JPA (Cổng mặc định: `8080`)
*   **AI Service**: Python FastAPI + Numpy + Pandas + SQLAlchemy (Cổng mặc định: `8000`)
*   **Database**: MySQL 8.0 (Cổng ánh xạ qua Docker: `3307` để tránh trùng cổng `3306` trên máy của thầy/cô)
*   **Cache**: Redis 6.2 (Cổng mặc định: `6379`)

---

## 🛠️ 2. Yêu Cầu Cài Đặt Hệ Thống (Prerequisites)

Trước khi chạy dự án, thầy/cô vui lòng đảm bảo máy tính đã cài đặt các công cụ sau:
1.  **JDK 17** (để chạy Spring Boot)
2.  **Node.js** (phiên bản 18+ để chạy Frontend React)
3.  **Python 3.10+** (để chạy FastAPI AI Service)
4.  **Docker Desktop** (để chạy nhanh database MySQL và Redis thông qua docker-compose)

---

## ⚡ 3. Hướng Dẫn Khởi Chạy Nhanh Bằng File Batch (Khuyên Dùng)

Chúng tôi đã viết sẵn các kịch bản khởi chạy tự động hóa hoàn toàn trên Windows. Thầy/cô chỉ cần thực hiện 3 bước đơn giản sau:

### Bước 1: Khởi động Cơ sở dữ liệu và các Phân hệ
*   Nhấp đúp chuột vào file **`run_project.bat`** ở thư mục gốc của dự án.
*   File batch này sẽ tự động:
    1. Chạy `docker-compose up -d` để khởi động MySQL (cổng `3307`) và Redis (cổng `6379`).
    2. Kích hoạt môi trường ảo Python venv (`python_ai_service/venv`) và chạy FastAPI trên cổng `8000`.
    3. Cài đặt các thư viện Frontend và khởi chạy server phát triển React trên cổng `5173`.

### Bước 2: Chạy Backend Spring Boot
*   Mở thư mục `backend` bằng phần mềm lập trình (khuyên dùng **IntelliJ IDEA** phiên bản mới nhất).
*   Chờ IntelliJ IDEA tải xong các thư viện Gradle.
*   Chạy class `RecommendationApplication` (nằm trong module `travel-api`). Server Backend sẽ tự khởi chạy trên cổng `8080`.
*   *(Hoặc thầy/cô có thể biên dịch và khởi chạy Backend dưới dạng container Docker bằng cách xem chi tiết tại **Mục 5.5 - Phân hệ Backend (Docker Compose)** phía dưới).*


### Bước 3: Đăng nhập và Trải nghiệm
*   Mở trình duyệt và truy cập: **`http://localhost:5173`**
*   **Tài khoản người dùng trải nghiệm thử**: `user1@gmail.com` / Mật khẩu: `12345678`
*   **Tài khoản quản trị viên (Admin)**: `admin@gmail.com` / Mật khẩu: `admin123`
    *   *Tại giao diện Quản trị viên, thầy/cô có thể vào phần **Dashboard** để xem các biểu đồ hoạt động thời gian thực của hệ thống và bảng thống kê sai số đo đạc thực nghiệm của thuật toán gợi ý AI.*

---

## 🧪 4. Khảo Sát & Đánh Giá Thuật Toán AI (Offline Evaluation)

Hệ thống được tích hợp sẵn bộ kiểm thử đánh giá thuật toán đo đạc các chỉ số học thuật chuẩn như **RMSE, MAE, Precision@5, Recall@5, MAP@5, Diversity và Novelty**.

Để mô phỏng chạy đánh giá và sinh dữ liệu đồ thị:
1.  Đảm bảo Docker MySQL và Redis đang chạy.
2.  Nhấp đúp chuột vào file **`reseed_and_evaluate.bat`** ở thư mục gốc.
3.  Tiến trình này sẽ tự động:
    *   Xóa sạch dữ liệu cũ và gieo mầm (Seed) lại dữ liệu học thuật mô phỏng mật độ cao (Perfect Dense Clustered Data) với 5 nhóm sở thích người dùng độc lập.
    *   Tự động chạy tiến trình đánh giá ngoại tuyến trên Python AI Service.
    *   Tính toán sai số dự đoán và độ chính xác của hai mô hình gợi ý, sau đó vẽ biểu đồ lưu vào thư mục `python_ai_service/evaluation_results/metrics_comparison.png`.
    *   Tự động đồng bộ các chỉ số này để hiển thị trực tiếp lên bảng điều khiển **Admin Dashboard** trên giao diện Web.

---

## 💻 5. Hướng Dẫn Cài Đặt Thủ Công (Nếu Không Dùng File Batch)

Nếu thầy/cô muốn chạy thủ công từng phân hệ trên Terminal, vui lòng thực hiện như sau:

### 1. Cơ sở dữ liệu (Docker)
```bash
docker-compose up -d
```

### 2. Phân hệ AI Service (Python FastAPI)
```bash
cd python_ai_service
# Khởi tạo môi trường ảo (nếu chưa có)
python -m venv venv
# Kích hoạt môi trường ảo
venv\Scripts\activate
# Cài đặt thư viện
pip install -r requirements.txt
# Chạy service
uvicorn main:app --reload --port 8000
```

### 3. Phân hệ Frontend (React Vite)
```bash
cd frontend
# Cài đặt thư viện
npm install
# Khởi chạy server phát triển
npm run dev
```

### 4. Phân hệ Backend (Spring Boot CLI)
```bash
cd backend
# Build và chạy ứng dụng Spring Boot
./gradlew :travel-api:bootRun
```

### 5. Phân hệ Backend (Docker Compose)
Nếu thầy/cô muốn đóng gói và chạy phân hệ Backend hoàn toàn trong Docker cùng với Database và AI Service, vui lòng thực hiện các bước:
1. **Biên dịch file JAR cho Backend**:
   Do Dockerfile của Backend copy file JAR đã được compile sẵn, thầy/cô cần chạy lệnh sau tại thư mục `backend` trước để sinh file JAR:
   ```bash
   cd backend
   # Build file JAR
   ./gradlew :travel-api:bootJar
   cd ..
   ```
2. **Khởi chạy bằng Docker Compose**:
   ```bash
   # Build và khởi chạy các container (bao gồm cả backend)
   docker-compose up -d --build
   ```
   *Lưu ý: Sau khi chạy lệnh này, Backend sẽ chạy ngầm tại cổng `8080` bên trong container Docker.*


---

## 📈 6. Kiểm Thử Hiệu Năng Với Apache JMeter

Dự án được chuẩn bị sẵn kịch bản kiểm thử tải chi tiết tại thư mục `backend/jmeter/` để đo đạc khả năng chịu tải của các API gợi ý dưới điều kiện nhiều người dùng truy cập cùng lúc.

Để chạy kiểm thử tải headless và tạo báo cáo biểu đồ HTML:
```bash
cd backend/jmeter
jmeter -n -t TravelAPI_LoadTest.jmx -l results.jtl -e -o dashboard/
```
Sau khi chạy xong, thầy/cô mở file `backend/jmeter/dashboard/index.html` bằng trình duyệt để xem báo cáo phân tích hiệu năng cực kỳ trực quan và chuyên nghiệp.

---
*Chúc thầy/cô có những trải nghiệm tuyệt vời khi đánh giá đồ án này!*
