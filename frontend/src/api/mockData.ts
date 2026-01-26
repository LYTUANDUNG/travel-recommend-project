import type { Location } from '../types';

export const mockLocations: Location[] = [
  {
    id: 1,
    name: "Vũng Tàu",
    description: "Bãi biển đẹp, gần Sài Gòn, có hải sản tươi, phù hợp nghỉ dưỡng cuối tuần. Bãi Sau, Bãi Trước, đồi Con Heo.",
    latitude: 10.4114,
    longitude: 107.1362,
    category: "beach",
    rating_avg: 4.6,
    rating_count: 2834,
    city: "Vũng Tàu",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    priceRange: "500k - 2tr VND",
    discount: {
      content: "GIẢM 20%",
      amount: 20
    }
  },
  {
    id: 2,
    name: "Phú Quốc",
    description: "Đảo ngọc, bãi Sao, cáp treo Hòn Thơm, lặn ngắm san hô, safari, resort 5 sao, đêm chợ đêm.",
    latitude: 10.2167,
    longitude: 103.9667,
    category: "island",
    rating_avg: 4.8,
    rating_count: 5672,
    city: "Kiên Giang",
    image: "https://images.unsplash.com/photo-1577717904057-4e1b6b3c7f7c?w=800"
  },
  {
    id: 3,
    name: "Sapa",
    description: "Núi đồi, ruộng bậc thang, bản Cát Cát, Fansipan, chợ tình, homestay, trekking, văn hóa dân tộc.",
    latitude: 22.3364,
    longitude: 103.8438,
    category: "mountain",
    rating_avg: 4.7,
    rating_count: 4123,
    city: "Lào Cai",
    image: "https://images.unsplash.com/photo-1567605537850-8d6d8f2d3e7d?w=800"
  },
  {
    id: 4,
    name: "Đà Lạt",
    description: "Thành phố ngàn hoa, hồ Xuân Hương, thung lũng Tình Yêu, đồi chè, cà phê view đẹp, thời tiết mát mẻ.",
    latitude: 11.9404,
    longitude: 108.4583,
    category: "hill",
    rating_avg: 4.5,
    rating_count: 8921,
    city: "Lâm Đồng",
    image: "https://images.unsplash.com/photo-1551882546-4d1d8b7e2e5e?w=800",
    priceRange: "300k - 800k VND",
    discount: {
      content: "VOUCHER 50K",
      amount: 50000
    }
  },
  {
    id: 5,
    name: "Hạ Long",
    description: "Vịnh Hạ Long di sản thế giới, hang Sửng Sốt, đảo Ti Tốp, du thuyền, kayak, ngắm hoàng hôn.",
    latitude: 20.9101,
    longitude: 107.1839,
    category: "bay",
    rating_avg: 4.9,
    rating_count: 10342,
    city: "Quảng Ninh",
    image: "https://images.unsplash.com/photo-1543409975-4a2f2d7d7d6a?w=800"
  }
];