# DỰ THẢO CÂU HỎI BẢO VỆ TIỂU LUẬN / ĐỒ ÁN

Dưới đây là một số câu hỏi mà Hội đồng / Giảng viên phản biện có thể hỏi khi bạn bảo vệ, kèm theo gợi ý trả lời dựa trên kiến trúc hệ thống hiện tại.

## 1. Về Thuật toán và AI (Phần cốt lõi)

**Câu hỏi 1: Sự khác biệt lớn nhất giữa Content-based Filtering và Collaborative Filtering là gì? Hệ thống của em dùng cái nào?**
**Trả lời:** 
*   **Content-based Filtering (CBF):** Dựa vào "nội dung, đặc trưng" của địa điểm (ví dụ: các Thẻ Tags sinh thái, rừng núi, biển). Hệ thống tính toán độ tương đương (Cosine Similarity) để gợi ý các địa điểm có đặc trưng giống với những địa điểm người dùng đã thích/xem. Nghĩa là gợi ý dựa trên hồ sơ quá khứ của chính User đó độc lập.
*   **Collaborative Filtering (CF):** Dựa vào "hành vi cộng đồng". Hệ thống không quan tâm địa điểm là cái gì, mà chỉ phân tích ma trận dữ liệu (Ai đánh giá cái nào mấy sao). Nó tìm những Người dùng có sở thích (pattern) đánh giá giống nhau, để từ đó gợi ý chéo địa điểm cho nhau.
*   Hệ thống của em **dùng cả hai** chạy trên môi trường Python độc lập. CBF dùng ở trang Chi tiết địa điểm, CF dùng ở Dashboard cho User.

**Câu hỏi 2: Bài toán Cold-start (Khởi đầu lạnh) trong Recommender System là gì và hệ thống của em giải quyết nó như thế nào?**
**Trả lời:** Cold-start xảy ra khi một Người dùng mới tinh vừa lập tài khoản, hệ thống không có bất kỳ dữ liệu (Reviews, lịch sử xem) nào để tính toán (vì ma trận bằng 0). 
Hệ thống giải quyết thông qua màn hình **Onboarding** lúc đăng ký. Yêu cầu User chọn một tập các Thẻ hiển thị sở thích (Tags). Hệ thống lấy tập Tags này làm bộ giá trị khởi tạo để chạy thuật toán Content-based ban đầu. Đồng thời, API CF (Collaborative) dùng cơ chế "Fallback" (dự phòng) để đẩy ra danh sách các địa điểm có Điểm trung bình cao nhất hệ thống (Popularity) cho User.

**Câu hỏi 3: Nếu bảng Reviews của em lên hàng chục triệu dòng, code em có chạy nổi không?**
**Trả lời:** Hiện tại em sử dụng Pandas (hàm read_sql) nạp vào RAM và xử lý Array. Giải pháp này xử lý rất nhanh cho quy mô dưới vài trăm ngàn records. Nhưng nếu lên hàng chục triệu dòng, việc load toàn bộ DB lên RAM sẽ gây Out of Memory (OOM) làm sụp Service Python. Hướng khắc phục ở quy mô Production (Thương mại) là sử dụng công cụ như Apache Spark, Hadoop, kết hợp với các CSDL NoSQL hoặc Data Warehouse chuyên dụng để tính toán bất đồng bộ.

## 2. Về Hệ thống và Kiến trúc 

**Câu hỏi 4: Tại sao không viết thuật toán Gợi ý luôn vào trong Java (Spring Boot) cho tiện mà phải tách thành 2 Service?**
**Trả lời:** 
Java (Spring Boot) rất mạnh trong quản lý Transaction ACID, CRUD Entity và Authentication. Nhưng Java lại yếu trong việc nhân chia các tập Matrics (Ma trận toán học) quy mô lớn. 
Hệ thống tách ra AI Service dùng Python để tận dụng hệ sinh thái thư viện `pandas` và `scikit-learn` tối ưu cực lớn cho Khoa học dữ liệu bằng C-binding (cực nhanh). Đồng thời kiến trúc Microservice này giúp Non-blocking: Server Java vẫn phản hồi bình thường hàng nghìn requests CRUD khác mà không bị đứng nghẽn CPU khi Server Python đang tính toán Ma trận Gợi ý.

**Câu hỏi 5: Luồng Context-aware Recommendation (Gợi ý theo ngữ cảnh thời gian thực) hoạt động thế nào?**
**Trả lời:** API `/recommend/context?lat=X&lng=Y` nhận vị trí hiện tại của user từ Leaflet. Trình xử lý Backend gọi API của nhà cung cấp Thời tiết (Weather API) để biết trời có mưa hay không, trời sáng hay tối. AI sẽ dùng logic để filter bỏ các địa điểm (locations) không phù hợp (ví dụ: bỏ bãi biển khi trời mưa, hoặc rừng sâu khi trời tối) và tiến hành gọi OSM. Xử lý thành file kết quả và trả ngược về máy chủ Java.

**Câu hỏi 6: Tính năng Background Task lấy ảnh tự động (Enrich Image) là gì? Lỡ nó làm đứt gãy hệ thống thì sao?**
**Trả lời:** Đó là tính năng cho Admin. Khi Admin dùng GIS Scanner rà quét thêm các địa điểm mới, tọa độ đó thiếu ảnh đẹp. API gửi 1 request `/recommend/enrich` xuống Python.
Python sẽ khởi tạo một `threading.Thread` ngầm lập tức. API báo "Thành công" và trả kết quả về Backend Java luôn, chứ không chờ tải ảnh. Tiến trình Threading tự dạo DuckDuckGo Search để tìm URL ảnh lưu lại CSDL. Nó chạy trên một lõi Core khác nên hoàn toàn không ảnh hưởng tiến trình chính.

## 3. Về Công nghệ cụ thể

**Câu hỏi 7: Em xử lý State Management (Quản lý trạng thái) trên React Frontend bằng công cụ gì? Tại sao không dùng Redux?**
**Trả lời:** Hệ thống sử dụng kết hợp `React Context` và `Zustand`. Zustand là một thư viện siêu nhẹ và không cần thiết lập boilerplate code dày đặc (như actions, reducers, types) như Redux. Việc xài Zustand giúp dự án gọn nhẹ, quản lý Token và User profile dễ bảo trì và debug hơn nhiều với React Hooks hiện đại.

**Câu hỏi 8: Frontend (React) tương tác với Backend (Java) bằng hình thức bảo mật nào?**
**Trả lời:** Hệ thống sử dụng cơ chế bảo mật xác thực dạng phi tập trung Stateless: **JWT (JSON Web Token)**. React gọi POST đến `/auth/login`, nhận JWT. Ở mọi API sau đó (như lưu chuyến đi, tạo review), Frontend gửi token này ở Header chuẩn `Bearer Token`. Máy chủ Spring Security của Java giải mã Token, nếu hợp lệ sẽ cấp quyền (phân role User/Admin) xử lý Database. Do Stateless, Backend tải nhẹ hơn vì không dùng Memory để lưu các phiên Session ID của Client.
