/**
 * Helper to resolve uploaded media, document, and backend file URLs.
 * Always resolves to the active backend server (PORT 5005) or configured VITE_API_BASE_URL.
 */
export const getFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://') || fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
    return fileUrl;
  }
  
  const envApiUrl = import.meta.env.VITE_API_BASE_URL || '';
  let backendOrigin = '';
  
  if (envApiUrl.startsWith('http')) {
    backendOrigin = envApiUrl.replace(/\/api\/?$/, '');
  } else {
    // Dynamic fallback to current hostname on backend port 5005
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    backendOrigin = `${protocol}//${hostname}:5005`;
  }
  
  const cleanPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  return `${backendOrigin}${cleanPath}`;
};

export const getApiBaseUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (envApiUrl.startsWith('http')) {
    return envApiUrl;
  }
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `${protocol}//${hostname}:5005/api`;
};

export default getFileUrl;
