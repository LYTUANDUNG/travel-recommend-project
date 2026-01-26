# Thiết kế Cơ sở dữ liệu - Hệ thống Gợi ý Du lịch Cá nhân hóa (Travel Recommendation System)

**Công nghệ**: MySQL  
**Mục tiêu**: Hỗ trợ thuật toán **Gợi ý theo nội dung (Content-Based)** hoặc **Gợi ý cộng tác (Collaborative Filtering)**.

---

## 1. Quản lý Người dùng (Users)

### Bảng: `users`
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `user_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID định danh duy nhất của người dùng. |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Tên đăng nhập hệ thống. |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | Địa chỉ email (dùng để liên lạc/nhận vé). |
| `password_hash` | VARCHAR(255) | NOT NULL | Mật khẩu đã được mã hóa (Bcrypt/Argon2). |
| `full_name` | VARCHAR(100) | | Họ và tên đầy đủ. |
| `phone_number` | VARCHAR(20) | | Số điện thoại liên hệ. |
| `avatar_url` | VARCHAR(255) | | Đường dẫn ảnh đại diện. |
| `gender` | ENUM | 'MALE', 'FEMALE', 'OTHER' | Giới tính (Dùng cho thống kê/gợi ý nhóm). |
| `birth_year` | INT | | Năm sinh (Tính độ tuổi để gợi ý phù hợp). |
| `nationality` | VARCHAR(50) | | Quốc tịch (Gợi ý theo ngôn ngữ/văn hóa). |
| `role` | ENUM | DEFAULT 'USER' | Vai trò: 'USER', 'ADMIN', 'PARTNER'. |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái kích hoạt tài khoản. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời điểm tạo tài khoản. |
| `last_login` | TIMESTAMP | | Thời điểm đăng nhập gần nhất. |

---

## 2. Dữ liệu Địa điểm (Locations - Item Profile)

### Bảng: `locations`
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `location_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID định danh địa điểm. |
| `name` | VARCHAR(255) | NOT NULL | Tên địa điểm du lịch. |
| `description` | TEXT | | Mô tả chi tiết (Nguồn dữ liệu chính cho NLP/Text Mining). |
| `address` | VARCHAR(255) | | Địa chỉ cụ thể. |
| `ward` | VARCHAR(100) | | Phường/Xã. |
| `district` | VARCHAR(100) | | Quận/Huyện. |
| `province` | VARCHAR(100) | | Tỉnh/Thành phố (Dùng để lọc theo khu vực). |
| `latitude` | DOUBLE | NOT NULL | Vĩ độ (Cho Google Maps & Tính khoảng cách). |
| `longitude` | DOUBLE | NOT NULL | Kinh độ (Cho Google Maps & Tính khoảng cách). |
| `category_id` | BIGINT | FK -> categories | Loại hình du lịch chính (Biển, Núi, Di tích...). |
| `price_level` | INT | 1..4 | Mức giá: 1 (Rẻ), 2 (Vừa), 3 (Đắt), 4 (Sang trọng). |
| `price_range_str`| VARCHAR(50) | | Chuỗi hiển thị giá (VD: "200k - 500k"). |
| `opening_hour` | TIME | | Giờ mở cửa. |
| `closing_hour` | TIME | | Giờ đóng cửa. |
| `thumbnail_url` | VARCHAR(255) | | Ảnh đại diện của địa điểm. |
| `average_rating` | DOUBLE | DEFAULT 0.0 | Điểm đánh giá trung bình. |
| `total_reviews` | INT | DEFAULT 0 | Tổng số lượng đánh giá. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời điểm tạo địa điểm. |

---

## 3. Danh mục & Đặc điểm (Categories & Features)

### Bảng: `categories`
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `category_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID danh mục. |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Tên danh mục (VD: 'Du lịch sinh thái', 'Resort', 'Bảo tàng'). |
| `slug` | VARCHAR(50) | | Đường dẫn tĩnh (SEO friendly). |

### Bảng: `tags`
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `tag_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID thẻ/tiện ích. |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Tên thẻ (VD: 'Wifi', 'Leo núi', 'Cho thú cưng', 'Ăn chay'). |
| `weight` | DOUBLE | DEFAULT 1.0 | Trọng số quan trọng của thẻ này trong thuật toán gợi ý. |

### Bảng: `location_tags` (Quan hệ N-N)
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `location_id` | BIGINT | PK, FK -> locations | ID địa điểm. |
| `tag_id` | BIGINT | PK, FK -> tags | ID thẻ. |
| `score` | DOUBLE | DEFAULT 1.0 | Mức độ phù hợp của thẻ với địa điểm (1.0 = Rất đúng, 0.5 = Có chút ít). |

---

## 4. Tương tác Người dùng (Explicit Feedback)

### Bảng: `reviews`
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `review_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID bài đánh giá. |
| `user_id` | BIGINT | FK -> users | Người đánh giá. |
| `location_id` | BIGINT | FK -> locations | Địa điểm được đánh giá. |
| `rating` | INT | 1..5 | Điểm số (Star Rating). |
| `comment` | TEXT | | Nội dung bình luận (Dùng phân tích cảm xúc - Sentiment Analysis). |
| `images_json` | JSON | | Danh sách URL ảnh người dùng upload. |
| `verify_status` | ENUM | 'PENDING', 'APPROVED' | Trạng thái kiểm duyệt bình luận. |
| `visit_date` | DATE | | Ngày thực tế đi du lịch. |
| `trip_type` | VARCHAR(50)| | Loại chuyến đi: (Solo, Gia đình, Cặp đôi, Nhóm bạn). |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian viết đánh giá. |

---

## 5. Hành vi Người dùng (Implicit Feedback)


### Bảng: `user_behavior_logs`
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `log_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID nhật ký hành vi. |
| `user_id` | BIGINT | Nullable | ID người dùng (Null nếu là khách vãng lai). |
| `session_id` | VARCHAR(100)| | ID phiên làm việc (Dùng track khách vãng lai). |
| `location_id` | BIGINT | FK -> locations | Địa điểm tương tác. |
| `action_type` | ENUM | NOT NULL | Loại hành động: 'VIEW_DETAILS' (Xem chi tiết), 'CLICK_BOOKING' (Nhấn đặt), 'ADD_FAVORITE' (Thêm yêu thích), 'VIEW_MAP' (Xem bản đồ). |
| `time_spent_seconds`| INT | DEFAULT 0 | Thời gian dừng lại xem trang (Dwell time) - Tín hiệu quan trọng. |
| `device_type` | VARCHAR(50)| | Thiết bị sử dụng (Mobile/Desktop/Tablet). |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Thời gian thực hiện hành động. |

---

## 6. Hồ sơ Sở thích (Personalization Cold-Start)

### Bảng: `user_interest_profiles`
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `user_id` | BIGINT | PK, FK -> users | Người dùng. |
| `category_id` | BIGINT | PK, FK -> categories | Danh mục quan tâm. |
| `affinity_score` | DOUBLE | DEFAULT 0.5 | Điểm hứng thú (0.0 - 1.0). Có thể do người dùng chọn lúc đăng ký hoặc hệ thống tự học. |

---

## 7. Khuyến mãi & Voucher (Business)

### Bảng: `vouchers`
| Tên Trường | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `voucher_id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | ID khuyến mãi. |
| `location_id` | BIGINT | FK -> locations | Địa điểm áp dụng (Null nếu áp dụng toàn sàn). |
| `code` | VARCHAR(50) | UNIQUE, NOT NULL | Mã nhập voucher (VD: SUMMER2024). |
| `title` | VARCHAR(100)| | Tên chương trình khuyến mãi. |
| `description` | TEXT | | Điều kiện áp dụng chi tiết. |
| `discount_value`| DOUBLE | | Giá trị giảm (VD: 50000 hoặc 20). |
| `discount_type` | ENUM | 'PERCENT', 'FIXED' | Loại giảm: Theo % hoặc Số tiền cố định. |
| `quantity_total`| INT | DEFAULT 100 | Tổng số lượng mã phát hành. |
| `quantity_used` | INT | DEFAULT 0 | Số lượng đã sử dụng. |
| `valid_from` | TIMESTAMP | | Thời gian bắt đầu hiệu lực. |
| `valid_to` | TIMESTAMP | | Thời gian hết hạn. |
| `is_active` | BOOLEAN | DEFAULT TRUE | Trạng thái kích hoạt. |

---

## 8. Sử dụng Dữ liệu cho Thuật toán 

### 1. Content-Based Filtering (Lọc theo nội dung)
*   **Đầu vào**: `locations` (mô tả, giá, địa chỉ), `location_tags` (đặc điểm), `user_interest_profiles`.
*   **Cơ chế**: Xây dựng **Vector Địa điểm** từ tags/categories. Xây dựng **Vector Người dùng** từ hồ sơ sở thích. Tính toán **Cosine Similarity** (độ tương đồng cosin) giữa vector người dùng và vector địa điểm.
*   **Ứng dụng**: Khi người dùng xem một địa điểm "leo núi", hệ thống gợi ý các địa điểm "leo núi" khác có đặc tính tương tự.

### 2. Collaborative Filtering (Lọc cộng tác)
*   **Đầu vào**: `reviews` (Ma trận đánh giá), `user_behavior_logs` (Ma trận hành vi ẩn).
*   **Cơ chế**: Sử dụng Matrix Factorization (SVD) hoặc Neural Collaborative Filtering (NCF).
*   **Quy trình**:
    1.  Trích xuất bộ ba `user_id`, `location_id`, `rating` từ bảng `reviews`.
    2.  Kết hợp thêm dữ liệu từ `user_behavior_logs` với trọng số quy đổi (VD: Xem = 1 điểm, Yêu thích = 3 điểm, Đặt vé = 5 điểm).
    3.  Huấn luyện mô hình để dự đoán điểm số cho các cặp (User, Location) chưa từng tương tác.

### 3. Context-Aware Recommendation (Gợi ý theo ngữ cảnh)
*   **Đầu vào**: API Thời tiết (Real-time), `month` (Mùa trong năm), `trip_type` (Loại chuyến đi).
*   **Logic**: Lọc lại kết quả từ 2 thuật toán trên.
    *   *Ví dụ*: Nếu trời đang mưa -> Loại bỏ/Giảm ưu tiên các địa điểm có tag 'Hoạt động ngoài trời'.
    *   *Ví dụ*: Nếu khách đi kiểu "Gia đình" -> Ưu tiên địa điểm có tag 'Trẻ em', 'An toàn'.
