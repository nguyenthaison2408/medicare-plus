export function routeForClinicRole(role: string): 'main' | 'doctorPortal' | 'adminPortal' {
  if (role === 'patient') return 'main';
  if (role === 'doctor') return 'doctorPortal';
  if (role === 'admin' || role === 'reception') return 'adminPortal';
  throw new Error('Vai trò tài khoản không hợp lệ.');
}

export function parseClinicAuthCallback(incoming: string): {code?: string; accessToken?: string; refreshToken?: string} | null {
  let url: URL;
  try { url = new URL(incoming); } catch { return null; }
  const isStandaloneCallback =
    url.protocol === 'medicareplus:' &&
    url.hostname === 'auth-callback' &&
    (url.pathname === '' || url.pathname === '/');
  const isExpoGoCallback =
    url.protocol === 'exp:' &&
    (url.pathname === '' ||
      url.pathname === '/' ||
      url.pathname === '/--/auth-callback' ||
      url.pathname === '/--/auth-callback/');
  if (!isStandaloneCallback && !isExpoGoCallback) return null;
  const fragment = new URLSearchParams(url.hash.slice(1));
  if (url.searchParams.has('error') || fragment.has('error')) throw new Error('Đăng nhập Google chưa hoàn tất. Vui lòng thử lại.');
  const code = url.searchParams.get('code');
  if (code) return {code};
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');
  if (accessToken && refreshToken) return {accessToken, refreshToken};
  return null;
}
