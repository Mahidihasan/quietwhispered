const trimTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');

export const getAdminAppBaseUrl = () => {
  const configured = trimTrailingSlash(process.env.REACT_APP_ADMIN_APP_URL);
  return configured || '/admin';
};

export const buildAdminAppUrl = (path = '/login') => {
  const baseUrl = getAdminAppBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return `${baseUrl}${normalizedPath}`;
  }

  return `${baseUrl}${normalizedPath}`;
};
