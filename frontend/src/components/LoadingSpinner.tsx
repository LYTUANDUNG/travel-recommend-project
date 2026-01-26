export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      <span className="ml-3 text-lg text-gray-600">Đang tải dữ liệu...</span>
    </div>
  );
}