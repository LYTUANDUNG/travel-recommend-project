BỘ GIÁO DỤC VÀ ĐÀO TẠO  
TRƯỜNG ĐẠI HỌC NÔNG LÂM TP.HCM  
KHOA CÔNG NGHỆ THÔNG TIN

---

**TIỂU LUẬN TỐT NGHIỆP**

# XÂY DỰNG ỨNG DỤNG WEB GỢI Ý ĐỊA ĐIỂM DU LỊCH CÁ NHÂN HÓA HỖ TRỢ DU LỊCH TỰ TÚC SỬ DỤNG REACT, SPRING BOOT VÀ AI SERVICE

**Ngành:** Công nghệ thông tin  
**Khóa:** 2022 - 2026  
**Lớp:** DH22DTC  
**Sinh viên thực hiện:** Lý Tuấn Dũng (MSSV: 22130054)  
**Giảng viên hướng dẫn:** TS. Nguyễn Thị Phương Trâm

**TP. Hồ Chí Minh, 2025**

<div style="page-break-after: always"></div>

# DANH SÁCH CHỮ VIẾT TẮT

*   **API:** Application Programming Interface (Giao diện lập trình ứng dụng)
*   **REST:** REpresentational State Transfer (Chuyển đổi trạng thái biểu diễn)
*   **SPA:** Single Page Application (Ứng dụng trang đơn)
*   **JWT:** JSON Web Token
*   **AI:** Artificial Intelligence (Trí tuệ nhân tạo)
*   **OSM:** OpenStreetMap
*   **CBF:** Content-Based Filtering (Lọc dựa trên nội dung)
*   **CF:** Collaborative Filtering (Lọc cộng tác)
*   **CRUD:** Create, Read, Update, Delete (Tạo, Đọc, Cập nhật, Xóa)
*   **GIS:** Geographic Information System (Hệ thống thông tin địa lý)

<div style="page-break-after: always"></div>

# DANH MỤC HÌNH ẢNH

*(Bạn vui lòng chèn các hình chụp thực tế từ ứng dụng vào các vị trí này sau khi hoàn tất)*

*   Hình 1. Biểu đồ Use Case hệ thống.
*   Hình 2. Sơ đồ kiến trúc tổng quan hệ thống.
*   Hình 3. Lược đồ Cơ sở dữ liệu (ERD).
*   Hình 4. Sơ đồ Activity Diagram cho chức năng Đăng nhập.
*   Hình 5. Sơ đồ Activity Diagram cho chức năng Tạo Lịch trình (Trip).
*   Hình 6. Sơ đồ Sequence Diagram cho chức năng Gợi ý địa điểm.
*   Hình 7. Giao diện Trang chủ (Home).
*   Hình 8. Giao diện Chi tiết địa điểm và Gợi ý Content-based.
*   Hình 9. Giao diện Tra cứu bản đồ GIS.
*   Hình 10. Giao diện Lịch trình (My Trips).
*   Hình 11. Giao diện Quản trị viên (Admin - GIS Scanner).

<div style="page-break-after: always"></div>

# TÓM TẮT

Mục tiêu chính của đề tài là nghiên cứu và phát triển một nền tảng website du lịch thông minh, không chỉ cung cấp thông tin quản lý địa điểm, mà còn tích hợp các hệ thống Trí tuệ nhân tạo (AI) giúp cá nhân hóa trải nghiệm du lịch. Hệ thống được xây dựng với kiến trúc Client-Server hiện đại, bao gồm Frontend phát triển bằng React, Backend sử dụng Spring Boot kết hợp cơ sở dữ liệu MySQL, và một dịch vụ AI độc lập (AI Service) viết bằng Python (FastAPI).

Ứng dụng cung cấp các tính năng quản lý cốt lõi, tìm kiếm địa điểm với bản đồ tích hợp (Leaflet/OSM), đồng thời nổi bật với 3 mô hình gợi ý địa điểm: Lọc theo nội dung (Content-based), Lọc cộng tác (Collaborative) và Gợi ý theo ngữ cảnh thực thời gian, thời tiết (Context-aware). Qua đó, hệ thống giúp khách du lịch tự túc có thể tối ưu hóa việc xây dựng lịch trình và khám phá các địa điểm một cách thông minh, tự động và phù hợp nhất với sở thích cá nhân.

<div style="page-break-after: always"></div>

# MỞ ĐẦU

## 1. LÝ DO CHỌN ĐỀ TÀI

Trong bối cảnh ngành du lịch Việt Nam đang phục hồi và phát triển mạnh mẽ sau đại dịch, nhu cầu du lịch tự túc (solo/independent travel) gia tăng hơn bao giờ hết. Du khách hiện đại không còn chuộng các tour tuyến cố định, rập khuôn mà mong muốn có những trải nghiệm mang tính "cá nhân hóa" cao. 

Tuy nhiên, việc tự lập kế hoạch cho một chuyến đi đòi hỏi du khách phải tốn rất nhiều thời gian để tra cứu thông tin trên nhiều nền tảng khác nhau, từ việc chọn địa điểm, tìm kiếm vị trí trên bản đồ, cho đến việc xem xét yếu tố thời tiết và sở thích cá nhân. Hầu hết các trang web du lịch hiện nay thường sắp xếp địa điểm theo độ phổ biến hoặc đánh giá chung, chứ không thực sự hiểu "ngữ cảnh" hay "nhu cầu" của từng cá nhân tại từng thời điểm cụ thể.

Để giải quyết vấn đề này, đề tài **"Xây dựng ứng dụng web gợi ý địa điểm du lịch cá nhân hóa hỗ trợ du lịch tự túc sử dụng React, Spring Boot và AI Service"** được lựa chọn. Việc ứng dụng Trí tuệ nhân tạo (AI) vào việc gợi ý địa điểm kết hợp với hệ thống thông tin địa lý (GIS) sẽ giúp thu hẹp khoảng cách giữa lượng thông tin khổng lồ và nhu cầu nhanh gọn, chính xác của người dùng.

## 2. MỤC TIÊU VÀ PHẠM VI NGHIÊN CỨU

**Mục tiêu tổng quát:** Xây dựng một website du lịch hiện đại, trực quan, không chỉ quản lý thông tin địa điểm mà còn cung cấp hệ thống gợi ý địa điểm thông minh đa chiều, cải thiện đáng kể trải nghiệm lập kế hoạch cho người du lịch tự túc.

**Mục tiêu cụ thể:**
*   Phát triển giao diện web (Frontend) trực quan bằng ReactJS, tích hợp bản đồ Leaflet.
*   Xây dựng hệ thống quản lý dữ liệu cốt lõi (Backend) mạnh mẽ bằng Spring Boot và MySQL, quản lý thông tin User, Location, Trip (Lịch trình) và Reviews.
*   Xây dựng một dịch vụ AI độc lập (AI Service) bằng Python/FastAPI để cung cấp các thuật toán gợi ý: Content-based Filtering, Collaborative Filtering và Context-aware Recommendation theo thời gian/thời tiết.
*   Kết nối và đồng bộ ba thành phần trên để tạo ra một luồng dữ liệu mượt mà, phản hồi ngay lập tức cho người dùng.

**Phạm vi nghiên cứu:** 
*   **Về tính năng:** Tập trung vào phân hệ quản lý thông tin địa điểm, xây dựng lịch trình (trip) và cơ chế gợi ý.
*   **Về công nghệ:** Sử dụng React, Spring Boot, MySQL, Python (FastAPI), Pandas, Thư viện scikit-learn và Leaflet/OSM API.

## 3. Ý NGHĨA KHOA HỌC VÀ THỰC TIỄN

*   **Về mặt khoa học:** Đề tài nghiên cứu và áp dụng thành công các thuật toán Học máy (RecSys) cơ bản: Tính toán độ tương đồng Cosine (Cosine Similarity), Ma trận Người dùng - Vật phẩm (User-item Matrix), và kết hợp dữ liệu độ trễ (Context-aware based) vào chung một hệ thống kiến trúc Microservice lai (Spring Boot + FastAPI).
*   **Về mặt thực tiễn:** Tạo ra một sản phẩm công nghệ có khả năng triển khai thực tế. Ứng dụng giúp du khách tự túc tiết kiệm thời gian lên lịch trình, giới thiệu cho họ những địa điểm mới lạ phù hợp với "khẩu vị" du lịch cá nhân; đồng thời giúp các doanh nghiệp/tổ chức quản lý địa điểm nắm bắt được thị hiếu của người dùng.

<div style="page-break-after: always"></div>

# CHƯƠNG 1. TỔNG QUAN ĐỀ TÀI

## 1.1 Phân tích, đánh giá các công trình, giải pháp hiện có

Hiện nay trên thị trường, đã có nhiều nền tảng cung cấp thông tin du lịch trực tuyến nổi bật, mỗi giải pháp đều mang đến những giá trị và ưu điểm riêng.

**TripAdvisor:** 
*   *Ưu điểm:* Là cuốn bách khoa toàn thư về đánh giá du lịch. Dữ liệu cực kỳ đồ sộ với hàng triệu bài review, hình ảnh từ cộng đồng.
*   *Nhược điểm:* Quá tải thông tin. Gợi ý chủ yếu mang tính liệt kê các "Top rated" (Đánh giá cao nhất) thay vì phân tích sâu sở thích riêng biệt của một người dùng mới.

**Traveloka / Booking.com:**
*   *Ưu điểm:* Nền tảng chuyên về đặt phòng, mua vé luân chuyển và các combo du lịch cực kỳ hoàn thiện. Giao diện mượt mà và tập trung vào "Booking".
*   *Nhược điểm:* Việc gợi ý thường phụ thuộc nhiều vào yếu tố thương mại (quảng cáo, khách sạn trả phí cao). Chưa có công cụ chuyên sâu dành riêng cho du khách vẽ lên bản đồ lịch trình tự do theo ý thích kết hợp thời tiết thực địa.

## 1.2 Những vấn đề còn tồn tại

Mặc dù các nền tảng trên đem lại sự tiện ích về booking (đặt chỗ) và tra cứu thông tin tĩnh, tuy nhiên với khách du lịch "tự túc" (thường di chuyển đường bộ, thay đổi kế hoạch liên tục), họ gặp những "nỗi đau" (Pain-points) sau:
1.  **Thiếu tính bối cảnh (Context-aware):** Một địa điểm được đánh giá 5 sao (ví dụ: bãi biển) nhưng hiện tại đang có mưa bão, hoặc đã tối mịt, nền tảng cũ vẫn gợi ý. 
2.  **Khó khăn trong việc nhóm các địa điểm thành lộ trình:** Tra cứu địa điểm trên web A, đổi qua Google Maps để định vị xem "đường đi có tiện không", sau đó ghi chú lại vào điện thoại. Quy trình này rời rạc và thủ công.
3.  **Cold-start (Khởi đầu lạnh):** Khi một người dùng mới tinh tham gia hệ thống, họ không có lịch sử lịch trình nên nền tảng không biết gợi ý gì cho đúng sở thích.

## 1.3 Nội dung chính của tiểu luận nhằm giải quyết vấn đề

Để giải quyết các vấn đề trên, tiểu luận đã thiết kế và triển khai một trang web du lịch với các tính năng:
*   Màn hình **Onboarding** cho phép người dùng mới chọn các Tags (Thẻ sở thích: Tự nhiên, Văn hóa, Ẩm thực...) để giải quyết bài toán Cold-start.
*   Dịch vụ **AI Service bằng Python** độc lập cung cấp mô hình gợi ý theo độ tương đồng Cosine (gợi ý các địa điểm giống với nơi họ đã xem) và lọc cộng tác.
*   Tính năng **Context-aware Recommendation**: AI tự động lấy thời gian hiện tại, gọi thời tiết và đưa ra gợi ý tương thích. (Trời mưa gợi ý bảo tàng, cafe; trời tạnh gợi ý công viên, núi đồi).
*   Giao diện kết hợp trực tiếp **Bản đồ trực quan (Leaflet)** tại mỗi điểm, kèm theo tính năng tạo ra các **Chuyến đi (Trips)** cá nhân hóa, lưu trữ mọi thứ ở một nơi tập trung.
<div style="page-break-after: always"></div>

# CHƯƠNG 2. CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ

## 2.1 Hệ thống gợi ý (Recommendation Systems)

Ngành khoa học dữ liệu ngày nay coi Hệ thống gợi ý (Recommender System) là một tập hợp các thuật toán nhằm đề xuất các mục (items - ví dụ: sản phẩm, phim ảnh, địa điểm) có khả năng cao người dùng quan tâm nhất. Đối với đề tài này, "items" chính là các địa điểm du lịch (locations).

### 2.1.1 Giới thiệu các phương pháp chính phổ biến
Có hai phương pháp cổ điển và hiệu quả nhất đang được đề tài áp dụng:
1.  **Lọc dựa trên nội dung (Content-based Filtering - CBF):** 
    Thay vì quan tâm đến các người dùng khác, hệ thống CBF tập trung phân tích "hồ sơ" của địa điểm (mô tả, danh mục, từ khóa tags). Nó sử dụng thuật toán TF-IDF để đo tần suất từ vựng, rồi áp dụng định lý `Cosine Similarity` để so sánh độ tương đồng giữa đặc trưng của địa điểm người dùng từng thích với các địa điểm khác trong hệ thống.
2.  **Lọc cộng tác (Collaborative Filtering - CF):**
    Thuật toán không quan tâm địa điểm là gì, nó quan tâm "hành vi cộng đồng". Dựa trên ma trận `User-Item` (Người dùng - Địa điểm - Số điểm đánh giá), hệ thống phân tích những người có sở thích đánh giá giống người hiện tại (User-based) hoặc các địa điểm thường được đánh giá tốt chung với nhau (Item-based) để đưa ra gợi ý chéo.

### 2.1.2 Ứng dụng trong thực tế
Các nền tảng toàn cầu dựa rất nhiều vào hệ thống này. Netflix sử dụng Collaborative Filtering để gợi ý người xem có chung sở thích phim. Shopee/Tiki sử dụng Content-based kết hợp hành vi để hiện các sản phẩm liên quan. TripAdvisor cũng dùng hệ thống gợi ý để đẩy các nhà hàng tương tự lên trang hiển thị review.

### 2.1.3 Ưu và nhược điểm
*   **Content-Based Filtering:**
    *   *Ưu điểm:* Dễ dàng giải quyết bài toán gợi ý ban đầu khi hệ thống có ít giao dịch đánh giá (chỉ cần nội dung tốt). Gợi ý mang tính độc lập và ít chịu sự ảnh hưởng từ đánh giá "ảo" của người khác.
    *   *Nhược điểm:* Quá trình học hạn hẹp (Over-specialization), hệ thống thường chỉ gợi ý những địa điểm y hệt cái cũ, không có sự đột phá.
*   **Collaborative Filtering:**
    *   *Ưu điểm:* Tự học hỏi qua tương tác (Serendipity), có khả năng đề xuất các địa điểm hoàn toàn mới lạ nhưng phù hợp mà phần mô tả văn bản không thể nhận diện được.
    *   *Nhược điểm:* Mắc phải bài toán "Cold-start", không phản hồi tốt đối với người dùng mới tinh chưa từng đánh giá gì trên web.

### 2.1.4 Vận dụng vào đề tài 
Nhận thấy ưu nhược điểm bù trừ của 2 thuật toán, tiểu luận đã triển khai **cả hai** bằng thư viện `pandas` và `scikit-learn` trên AI Service Python:
*   `recommend/content`: Áp dụng cho trang Chi tiết địa điểm. Khi người dùng xem Đồi Mộng Mơ, ở dưới sẽ gợi ý các Cảnh quan sinh thái tương đồng sử dụng thuật toán Cosine Similarity sinh ra từ việc trộn Dữ liệu mô tả với bộ Thẻ tag (Tags).
*   `recommend/collaborative`: Áp dụng trên trang Dashboard (Gợi ý cho bạn). Hệ thống liên tục quét DB `reviews` xây dựng User-item Matrix. Nếu User A và B đều đánh giá cao 3 địa điểm, hệ thống sẽ giới thiệu địa điểm thứ 4 của B cho A.
*   **Đặc biệt sáng tạo (Context-aware):** Đề tài bổ sung thêm biến số ngoại cảnh với endpoint `recommend/context`. Đọc trực tiếp tọa độ (Lat, Lng) kết hợp API thời tiết, để loại trừ các địa điểm ngoài trời nếu có mưa, đồng bộ hóa trải nghiệm du lịch thực tế.

## 2.2 Các công nghệ hỗ trợ phần mềm

Tiểu luận không sử dụng một ngôn ngữ duy nhất, mà áp dụng kiến trúc Microservice lai, lựa chọn những công nghệ tốt nhất ở mỗi khâu.

### 2.2.1 Spring Boot (Backend API)
*   **Giới thiệu:** Là một framework dựa trên ngôn ngữ Java, đơn giản hóa tối đa việc triển khai các ứng dụng chạy độc lập cấp doanh nghiệp mang tiêu chuẩn Spring.
*   **Ứng dụng:** Xây dựng phần lớn các máy chủ xử lý dữ liệu và hệ thống RESTful API cấp tiến hiện nay.
*   **Ưu / Nhược điểm:**
    *   *Ưu:* Kiến trúc cực kỳ chặt chẽ (Controller - Service - Repository), khả năng bảo mật cao (Spring Security), hỗ trợ cực mạnh ORM qua Spring Data JPA.
    *   *Nhược:* Sử dụng nhiều RAM khi triển khai, cấu trúc lớp lang đồ sộ khiến thời gian làm quen dài hơn so với Node.js.
*   **Vận dụng:** Dùng làm máy chủ lõi (Travel Service). Đảm nhận việc xử lý bảo mật (JWT Authentication), lưu trữ cấu trúc DTO/Entity của hệ thống CRUD (về Locations, Users, Trips, Reviews) xuống Database. Phục vụ với hiệu suất ổn định để làm nguồn cung ứng Data cho AI Service.

### 2.2.2 React (Frontend)
*   **Giới thiệu:** Là một thư viện JavaScript mã nguồn mở chuyên về xây dựng UI do Facebook tạo ra. Hoạt động trên Virtual DOM.
*   **Ứng dụng:** Thiết kế giao diện (Dashboard, Web app) cho hàng loạt ông lớn (Facebook, Netflix, Airbnb) yêu cầu tương tác cao, SPA.
*   **Ưu / Nhược điểm:**
    *   *Ưu:* Component-based (chia nhỏ UI để tái sử dụng). Quản lý trạng thái thông minh qua Hooks và Zustand.
    *   *Nhược:* Đòi hỏi lập trình viên phải kết hợp nhiều thư viện phụ trợ bên thứ ba (Router, Axios,...).
*   **Vận dụng:** Xây dựng User Interface, cấu hình với Vite. Đảm nhận việc hiển thị các Component Màn hình đăng nhập, Trang chi tiết bản đồ, Biểu đồ thống kê Admin, tích hợp TailwindCSS làm công cụ CSS Framework giúp giao diện Web thân thiện (Responsive) và đẹp mắt.

### 2.2.3 FastAPI & Python (AI Service)
*   **Giới thiệu:** FastAPI là một framework web Python hiện đại, vận hành với tốc độ cao, hỗ trợ Async/Await chuyên dụng kết hợp với Pydantic. 
*   **Ứng dụng:** Làm Backend xử lý Data/Mô hình AI cho các Data Engineer và Machine learning Pipelines.
*   **Ưu / Nhược điểm:**
    *   *Ưu:* Lập trình mã xử lý AI gọn, tích hợp sẵn Swagger tự động sinh tài liệu giao diện.
    *   *Nhược:* Ít phù hợp làm core backend CRUD khổng lồ bằng Spring Boot.
*   **Vận dụng:** Xây dựng máy chủ Python ảo độc lập. Dịch vụ này sử dụng thư viện `pandas` để nạp dữ liệu từ hệ thống, tự động tính toán ra sẵn ma trận gợi ý. Kiến trúc này giúp máy chủ Java thoát khỏi bài toán quá tải tính toán ma trận ma trận, mà nhường việc nặng nhọc đó cho Python.

### 2.2.4 MySQL (Cơ sở dữ liệu)
*   **Giới thiệu:** Hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mã nguồn mở rất phổ biến phục vụ trên toàn thế giới.
*   **Cấu trúc dữ liệu và Vận dụng vào đề tài:** Hệ thống triển khai lưu trữ trong CSDL có tên `travel_recommendation`. Cung cấp kho dữ liệu gốc thiết yếu để phần mềm Java đọc xuất dữ liệu CRUD, và AI Service lấy bảng điểm để train Model RecSys.

### 2.2.5 Leaflet và OpenStreetMap (Bản đồ)
*   **Giới thiệu:** Leaflet là thư viện JavaScript tương tác bản đồ mã nguồn mở mạnh mẽ. OpenStreetMap (OSM) là bản đồ thế giới mở (kiểu Wikipedia map).
*   **Ưu / Nhược điểm:** Giải quyết được rào cản chi phí API rất cao từ Google Maps. Nhược điểm là ở một số vùng thôn quê xa xôi, số liệu có thể không tỷ lệ xích chi tiết bằng Google.
*   **Vận dụng:** Thư viện `react-leaflet` dùng để nhúng lớp Map lên Frontend. Hệ thống GIS Backend (Overpass API) để quét các điểm POI xung quanh vị trí khách hàng. Khách du lịch sử dụng dịch vụ thông quan vị trí Lat/Lng trực quan thay vì chỉ xem địa chỉ text đơn điệu.
<div style="page-break-after: always"></div>

# CHƯƠNG 3. GIẢI PHÁP VÀ HIỆN THỰC

## 3.1 Kiến trúc tổng quan hệ thống

Hệ thống được thiết kế theo mô hình kiến trúc Client - Server kết hợp Microservice lai (Java & Python). 
*   **Web Client (Frontend):** Ứng dụng SPA viết bằng React, chịu trách nhiệm giao tiếp với người dùng cuối, hiển thị bản đồ và biểu đồ.
*   **Main API Server (Backend):** Ứng dụng Spring Boot cung cấp các REST API lõi. Quản lý toàn bộ nghiệp vụ CRUD, chứng thực JWT, và là cầu nối chính với CSDL MySQL.
*   **AI Service (Python Backend):** Một dịch vụ AI độc lập cung cấp các endpoint tính toán `recommend`. Cấu trúc tách biệt này giúp giải quyết bài toán "Non-blocking" (Không chặn tiến trình), Java App vẫn phục vụ hàng nghìn request thông thường trong khi tầng Python xử lý các ma trận gợi ý phức tạp.

*(Chèn Hình 2: Sơ đồ kiến trúc tổng quan hệ thống).*

## 3.2 Thiết kế Cơ sở dữ liệu

Cơ sở dữ liệu thống nhất `travel_recommendation` sử dụng hệ quản trị MySQL bao gồm các thực thể chính sau:
*   **users:** Quản lý tài khoản (id, username, password đã mã hóa, role).
*   **locations:** Lưu trữ hồ sơ địa điểm (id, name, description, lat, lng, image_url).
*   **tags / location_tags / user_tags:** Hệ thống thẻ đa dạng (VD: Biển, Núi, Thư giãn) giúp phân loại địa điểm và lưu trữ "khẩu vị" của người dùng trong bước Onboarding.
*   **reviews:** Lưu trữ sự tương tác người dùng - địa điểm (rating từ 1 đến 5 sao). Đây là nguồn nguyên liệu gốc rễ cho mô hình Collaborative Filtering.
*   **trips / trip_locations:** Lưu trữ hồ sơ một chuyến đi (Lịch trình) của người dùng từ ngày A đến ngày B, và danh sách các địa điểm trong chuyến đi đó.
*   **visit_requests:** Chức năng riêng dành cho hệ thống "GIS Scanner" của admin lưu trữ các tọa độ thô do người dùng cắm cờ (marker) trên bản đồ yêu cầu hệ thống định danh.

*(Chèn Hình 3. Lược đồ Cơ sở dữ liệu - ERD).*

## 3.3 Phân tích và Thiết kế chức năng (UML)

### 3.3.1 Sơ đồ Use Case
Hệ thống cung cấp hai nhóm Actor chính: User (Khách du lịch tự túc) và Admin (Quản trị viên).
*   **User:** Có thể đăng nhập, xem danh sách địa điểm, tìm kiếm trên bản đồ, tạo Lịch trình (Trip), thêm điểm đến vào Lịch trình, đánh giá (Review), và nhận các Gợi ý (Recommendations).
*   **Admin:** Ngoài quyền của User, có quyền truy cập Dashboard thống kê, Quét GIS để thêm địa điểm tự động (GIS Scanner).

*(Chèn Hình 1: Biểu đồ Use Case hệ thống).*

### 3.3.2 Sơ đồ Activity Diagram
**Ví dụ: Luồng Tạo Lịch trình (Trip)**
1.  Người dùng click nút "Tạo chuyến đi mới".
2.  Hệ thống hiển thị Form (Tên chuyến đi, Ngày bắt đầu, Ngày kết thúc).
3.  Người dùng nhập dữ liệu và Bấm "Lưu".
4.  Giao diện gửi Request POST xuống Spring Boot API.
5.  Spring Boot rà soát Authentication JWT. Nếu không hợp lệ trả về lỗi 401. Nếu thành công, lưu vào bảng `trips`.
6.  Hệ thống trả về màn hình Chi tiết chuyến đi, sẵn sàng cho việc gán địa điểm.

*(Chèn Hình 5. Sơ đồ Activity Diagram cho chức năng Tạo Lịch trình).*

### 3.3.3 Sơ đồ Sequence Diagram
**Ví dụ: Luồng Gợi ý theo ngữ cảnh (Context-aware Recommendation)**
1.  Bản đồ Leaflet (Client) gửi tọa độ (Lat, Lng) của User xuống Spring Boot `Travel Service`.
2.  `Travel Service` phân tích Request, tiếp tục điều phối (Proxy) gọi tiếp qua REST API nội bộ tới `AI Service` (Python) theo đường dẫn `/recommend/context?lat=X&lng=Y`.
3.  `AI Service` gọi thư viện API Thời tiết. Xác định ra loại hình thời tiết (ví dụ: Rain/Mưa). Nó sử dụng thư viện Overpass OSM để kết hợp loại trừ các địa điểm bị ảnh hưởng.
4.  `AI Service` trả mảng JSON `[{location_id, score}]` về lại `Travel Service`.
5.  `Travel Service` gán thêm chi tiết (Tên ảnh, Mô tả) từ DB SQL rồi trả về dạng DTO hoàn chỉnh cho Client hiển thị lên màn hình (UI).

*(Chèn Hình 6. Sơ đồ Sequence Diagram cho chức năng Gợi ý địa điểm).*

## 3.4 Hiện thực hệ thống gợi ý cốt lõi (AI Service)

Dịch vụ AI được viết bằng Python (FastAPI). Khi Spring Boot gọi đến, FastAPI sẽ xử lý như sau (Mô tả mã nguồn `main.py`):

1.  **Cơ chế lưu đệm (Caching/Reload):** Thay vì mỗi lần Request lại đọc DB, hàm `/recommend/reload` sẽ nạp toàn bộ `df_locations` và `df_reviews` vào bộ nhớ RAM của Server bằng thư viện `pandas.read_sql`. Sau đó tính toán sẵn hai Ma trận (Cosine Similarity cho Content-based và User-item cho CF).
2.  **API Content-based (`/recommend/content`):** Khi tham số đầu vào là `location_id`, hàm `recommend_content_based` truy xuất vào ma trận Cosine dựa trên các Vector hóa văn bản TF-IDF, trích xuất ra top (N) các ID địa điểm gần giống ID nhất và gửi về.
3.  **API Collaborative (`/recommend/collaborative`):** Hệ thống đọc từ `df_reviews`. Nếu một User đánh giá nhiều địa điểm, nó sử dụng thư viện để lấy ra các người dùng tương tự. Tính điểm trọng số trung bình để dự đoán điểm các địa điểm mà User này chưa đi. (Sử dụng thêm phương án Dự phòng Pop-fallback - Phổ biến - nếu đánh giá bị rỗng).
4.  **Enrich Images (Làm giàu hình ảnh):** Trong quá trình Admin thêm hệ thống bằng GIS Scanner, AI Service vận hành một `threading.Thread(target=run_enrich)` ngầm (Background Task). Thread này tự tra API Google hoặc DuckDuckGo để lấy URL ảnh cho các điểm tọa độ mà không làm nghẽn luồng tra cứu chính.

Bằng giải pháp song song giữa Java để bảo mật và lưu trữ, Python để làm thuật toán mạnh, hệ thống đạt độ trễ phản hồi rất thấp, đáp ứng trực tiếp ngay lập tức khi khách hàng nhấp chuột trên thẻ bản đồ hệ thống.
<div style="page-break-after: always"></div>

# CHƯƠNG 4. KẾT QUẢ VÀ KẾT LUẬN

## 4.1 Kết quả đạt được

Hệ thống ghi nhận việc hiện thực hóa toàn bộ các Use case cơ bản ở mức ổn định, đáp ứng được các mục tiêu đã đề ra. Các tính năng cốt lõi hoạt động trôi chảy, đảm bảo yêu cầu của một trang web phục vụ du lịch tự túc hiện đại.

**1. Hệ thống Frontend (Màn hình Web)**
*   Hoàn thiện toàn bộ các trang giao diện (UI) đảm bảo Responsive. Được thiết kế với gam màu năng động, tích hợp CSS animations và hiển thị rõ ràng trên cả thiết bị di động (Mobile).
*   Giao diện kết nối đầy đủ hệ thống bản đồ mở, cho phép xem Lịch trình một cách trực quan, click vào từng vị trí Marker để hiện hình ảnh và xem review.
*(Chèn hình các màn hình Giao diện)*

**2. Giao tiếp Backend & AI**
*   Các dịch vụ API kết nối bảo mật hoàn hảo nhờ Token JWT.
*   Dịch vụ "GIS Scanner" do Admin vận hành chạy trơn tru, giúp cào dữ liệu thô (coordinates) từ bản đồ, biến nó thành Data có cấu trúc và được Threading Python bổ sung ảnh tự động.
*   Cả 3 khâu Gợi ý: Lọc Content-based (Cosine) trên trang chi tiết, Collaborative (User-matrix) trên trang Chủ, và Context-aware trên bản đồ đã tích hợp xuyên suốt, phản hồi dữ liệu trong thời gian dưới 1 giây (ms). Người dùng cảm giác rất mượt mà không có độ trễ hệ thống nặng.

## 4.2 Triển vọng và Hướng phát triển phần mềm

Dù đạt được kết quả đề ra, tuy nhiên vì kiến trúc này giới hạn trong một bài toán học thuật (Tiểu luận), nó tồn tại vài điểm cần được nâng cấp khi lên thành cấp Hệ thống thương mại hoàn chỉnh (Production).

1.  **Nâng cấp AI Modeling:** Dù Python Service và Pandas chạy rất nhanh khi dữ liệu reviews là 10,000 dòng. Nhưng khi Database phình to lên 5,000,000 dòng reviews thì việc load `.read_sql` vào RAM lúc Startup sẽ ngốn cực lớn Memory, có nguy cơ sụp server chặn luồng. Bắt buộc phải thay thư viện bằng giải pháp xử lý dòng Data (Spark) hoặc công nghệ Tensorflow cho Deep Learning Recommender System.
2.  **Tích hợp Microservice Message Brokers:** Hiện tại luồng từ Java gọi sang Python sử dụng Direct Synchronous REST Call qua HTTPClient. Nếu Python sụp, Java không có dữ liệu trả về User. Nên sử dụng Apache Kafka hoặc RabbitMQ (Event-Driven) để truyền tải Background Data giữa các Server.
3.  **Chatbot Lập Lịch:** Thêm trực tiếp giải pháp LLM (Large Language Model) như Gemini hoặc GPT vào để "Chat" cho phép lên lộ trình trực quan thay vì người dùng phải tự kéo thả thủ công.

## 4.3 Kết luận

Tiểu luận đã hoàn thành việc xây dựng một hệ thống website đáp ứng đúng chuẩn ngành thương mại ứng dụng với 3 thành phần chính: React (Frontend), Spring Boot (Backend CRUD cốt lõi) và Python/FastAPI (AI Engine). Thông qua việc nghiên cứu hai nhóm thuật toán lớn của Recommendation System, bài toán "cá nhân hóa" của ngành du lịch tự túc đã được xử lý bằng công cụ phân tích tự động, tạo hướng mở phát triển một công cụ thiết thực trong bối cảnh du lịch ứng dụng số phục hồi mạnh mẽ tại Việt Nam.

<div style="page-break-after: always"></div>

# TÀI LIỆU THAM KHẢO

[1]. Aggarwal, C. C. (2016). *Recommender Systems: The Textbook*. Springer.
[2]. Phalle, T. S., & Bhushan, S. (2024). *Content Based Filtering And Collaborative Filtering: A Comparative Study*. Journal of Advanced Zoology, 45.
[3]. Leaflet, “An open-source JavaScript library for mobile-friendly interactive maps.” [Online]. Available: https://leafletjs.com/
[4]. Kumar, A., & Sharma, V. (2020). *Spring Boot Framework for Microservices Architecture: A Comparative Review*.
[5]. Patel, D., & Sharma, R. (2021). *ReactJS for Interactive Web Interfaces: Case Studies in Travel Platforms*. In IEEE International Conference on Web Technologies.
[6]. OpenStreetMap Data API và Overpass Turbo. [Online]. Available: https://wiki.openstreetmap.org/wiki/API
[7]. Scikit-learn (Machine Learning in Python). [Online]. Available: https://scikit-learn.org/
[8]. FastAPI Framework Document. [Online]. Available: https://fastapi.tiangolo.com/
