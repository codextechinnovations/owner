import api from '../services/api';

const APP_LOGO_URL = '/logo.png';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.manageyourpg.com/api';

export const resolveLogoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL.replace(/\/api$/, '')}${cleanPath}`;
};

export const urlToBase64 = async (url) => {
  if (!url) return null;

  if (url.startsWith('data:image')) {
    try {
      return url.split(',')[1] || null;
    } catch (e) {
      console.error('Error parsing data URI:', e);
      return null;
    }
  }

  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result?.split(',')[1];
        resolve(base64 || null);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('Error converting image to base64:', e);
    return null;
  }
};

export const getAppLogoBase64 = async () => {
  try {
    return await urlToBase64(APP_LOGO_URL);
  } catch (e) {
    console.error('Error getting app logo:', e);
    return null;
  }
};

export const fetchPgFromServer = async (pgId) => {
  if (!pgId) return null;
  try {
    const res = await api.get(`/pg/${pgId}`);
    return res?.data?.data || res?.data || null;
  } catch (e) {
    console.error('Error fetching PG from server:', e);
    return null;
  }
};

export const getPgLogoBase64 = async (pgId, pgs = []) => {
  try {
    let logoUrl = null;
    const storedPg = pgs.find((p) => p._id === pgId) || pgs[0];
    logoUrl = storedPg?.logo;

    if (!logoUrl && pgId) {
      const serverPg = await fetchPgFromServer(pgId);
      if (serverPg?.logo) {
        logoUrl = serverPg.logo;
      }
    }

    if (logoUrl) {
      const resolvedUrl = resolveLogoUrl(logoUrl);
      const base64 = await urlToBase64(resolvedUrl);
      if (base64) return base64;
    }

    return await getAppLogoBase64();
  } catch (e) {
    console.error('Error getting PG logo:', e);
    return getAppLogoBase64();
  }
};

export const getImageHtml = (base64, sizeStyle = '', mimeType = 'image/png') => {
  if (!base64) return '';
  return `<img src="data:${mimeType};base64,${base64}" style="${sizeStyle}" />`;
};

export const getLogoHtml = (base64, size = 40) => {
  if (!base64) return '';
  return `<img src="data:image/png;base64,${base64}" style="width:${size}px; height:${size}px; object-fit:contain; border-radius:8px;" />`;
};
