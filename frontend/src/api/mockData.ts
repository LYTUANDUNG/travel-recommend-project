import type { Location } from '../types/schema';

export const mockLocations: Location[] = [
  {
    location_id: 1,
    name: "Vũng Tàu",
    description: "Bãi biển đẹp, gần Sài Gòn, có hải sản tươi, phù hợp nghỉ dưỡng cuối tuần. Bãi Sau, Bãi Trước, đồi Con Heo.",
    latitude: 10.4114,
    longitude: 107.1362,
    category_id: 1,
    category_name: "Biển", // Computed field
    average_rating: 4.6,
    total_reviews: 2834,
    province: "Vũng Tàu",
    thumbnail_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    price_range_str: "500k - 2tr VND",
    price_level: 2,
  },
  {
    location_id: 2,
    name: "Phú Quốc",
    description: "Đảo ngọc, bãi Sao, cáp treo Hòn Thơm, lặn ngắm san hô, safari, resort 5 sao, đêm chợ đêm.",
    latitude: 10.2167,
    longitude: 103.9667,
    category_id: 2,
    category_name: "Đảo",
    average_rating: 4.8,
    total_reviews: 5672,
    province: "Kiên Giang",
    thumbnail_url: "https://images.unsplash.com/photo-1577717904057-4e1b6b3c7f7c?w=800",
    price_level: 3
  },
  {
    location_id: 3,
    name: "Sapa",
    description: "Núi đồi, ruộng bậc thang, bản Cát Cát, Fansipan, chợ tình, homestay, trekking, văn hóa dân tộc.",
    latitude: 22.3364,
    longitude: 103.8438,
    category_id: 3,
    category_name: "Núi",
    average_rating: 4.7,
    total_reviews: 4123,
    province: "Lào Cai",
    thumbnail_url: "https://images.unsplash.com/photo-1567605537850-8d6d8f2d3e7d?w=800",
    price_level: 2
  },
  {
    location_id: 4,
    name: "Đà Lạt",
    description: "Thành phố ngàn hoa, hồ Xuân Hương, thung lũng Tình Yêu, đồi chè, cà phê view đẹp, thời tiết mát mẻ.",
    latitude: 11.9404,
    longitude: 108.4583,
    category_id: 4,
    category_name: "Đồi",
    average_rating: 4.5,
    total_reviews: 8921,
    province: "Lâm Đồng",
    thumbnail_url: "https://images.unsplash.com/photo-1551882546-4d1d8b7e2e5e?w=800",
    price_range_str: "300k - 800k VND",
    price_level: 2
  },
  {
    location_id: 5,
    name: "Hạ Long",
    description: "Vịnh Hạ Long di sản thế giới, hang Sửng Sốt, đảo Ti Tốp, du thuyền, kayak, ngắm hoàng hôn.",
    latitude: 20.9101,
    longitude: 107.1839,
    category_id: 5,
    category_name: "Vịnh",
    average_rating: 4.9,
    total_reviews: 10342,
    province: "Quảng Ninh",
    thumbnail_url: "https://images.unsplash.com/photo-1543409975-4a2f2d7d7d6a?w=800",
    price_level: 3
  }
];