// 处理图片URL，确保返回完整的URL
export function getImageUrl(url) {
  if (!url) return null;

  // 如果已经是完整URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // 如果是相对路径，添加后端服务器地址
  const apiUrl = import.meta.env.VITE_API_URL || 'http://13.57.220.226:3000/api';
  const baseURL = apiUrl.replace('/api', ''); // 移除 /api 后缀获取服务器根地址
  return `${baseURL}${url}`;
}

// 获取缩略图URL（优先使用缩略图，回退到原图）
export function getThumbnailUrl(image) {
  if (!image) return null;

  const url = image.thumbnail_url || image.original_url;
  return getImageUrl(url);
}

// 获取原图URL
export function getOriginalUrl(image) {
  if (!image) return null;

  return getImageUrl(image.original_url);
}