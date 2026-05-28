# 🚀 Hướng Dẫn Kiểm Thử Hiệu Năng Với Apache JMeter

Bộ kịch bản này được thiết kế để đo lường độ trễ, khả năng chịu tải và thông lượng (throughput) của hệ thống gợi ý du lịch gồm **Spring Boot API (Backend)** và **FastAPI AI Service (Python)**.

---

## 📌 1. Chuẩn bị
1. **Tải Apache JMeter**: Tải phiên bản mới nhất từ trang chủ [Apache JMeter](https://jmeter.apache.org/download_jmeter.cgi) và giải nén.
2. **Khởi chạy Hệ thống**:
   * Đảm bảo Spring Boot chạy ở cổng `8080`.
   * Đảm bảo FastAPI AI Service chạy ở cổng `5000` (hoặc thông qua Spring Boot Proxy).

---

## 🛠️ 2. Chạy JMeter Ở Giao Diện Đồ Họa (GUI Mode)
> [!IMPORTANT]
> GUI Mode chỉ nên dùng để thiết kế hoặc gỡ lỗi kịch bản, tránh dùng để chạy kiểm thử tải thật vì giao diện đồ họa làm hao phí tài nguyên CPU/RAM của máy trạm.

1. Mở thư mục `bin` của JMeter, chạy file `jmeter.bat` (trên Windows) hoặc `./jmeter` (trên Linux/macOS).
2. Chọn **File -> Open** và trỏ tới kịch bản: `d:\TLTN\FE\backend\jmeter\TravelAPI_LoadTest.jmx`.
3. Nhấp nút **Start** (màu xanh lá cây ▶️) ở thanh công cụ để khởi chạy.
4. Xem kết quả trực quan thời gian thực ở các Listener có sẵn:
   * **Aggregate Report**: Bảng thống kê Latency, Min, Max, Error, Throughput.
   * **View Results Tree**: Chi tiết phản hồi HTTP Header và JSON Body của từng request.

---

## 💻 3. Chạy Headless CLI Mode & Tạo Báo Cáo HTML (Khuyên Dùng Để Báo Cáo Đồ Án)
Để chạy tải thực tế mượt mà và tạo ra một thư mục báo cáo đồ thị HTML tĩnh siêu chuyên nghiệp cho giảng viên, hãy sử dụng câu lệnh dưới đây:

```bash
# Di chuyển vào thư mục chứa kịch bản
cd d:\TLTN\FE\backend\jmeter

# Chạy kiểm thử tải (CLI Mode) và xuất báo cáo HTML
jmeter -n -t TravelAPI_LoadTest.jmx -l results.jtl -e -o dashboard/
```

### Giải thích các tham số:
* `-n`: Chạy ở chế độ non-GUI (headless mode).
* `-t`: Đường dẫn đến file kịch bản `.jmx`.
* `-l`: File lưu kết quả kiểm thử dạng thô (`results.jtl`).
* `-e`: Tự động tạo báo cáo HTML sau khi hoàn thành.
* `-o`: Thư mục đầu ra để chứa trang web báo cáo đồ thị (`dashboard/`).

### Kết quả nhận được:
Mở file `dashboard/index.html` bằng trình duyệt web để xem:
* Biểu đồ **Response Times Over Time** (Thời gian phản hồi theo thời gian).
* Biểu đồ **Throughput / Transactions Per Second (TPS)**.
* Biểu đồ tỉ lệ lỗi (Active Threads Over Time, Latency vs Throughput).
* Bảng tổng quan APDEX (Application Performance Index) chứng minh độ ổn định của dịch vụ Spring Boot và Python Service.
