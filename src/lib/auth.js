export function authorizeRequest(request, allowedRoles = []) {
  const authHeader = request.headers.get('authorization');
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    token = cookies.admin_session || cookies.session_token || null;
  }

  if (!token) return null;

  // In prototype mode, validate token presence or simple token mock.
  // In production SQL target, decode JWT or query session table.
  try {
    // Basic mock session parsing for prototype
    const role = token.includes('admin') ? 'admin' : (token.includes('editor') ? 'editor' : 'reader');
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(role) && !allowedRoles.includes('admin')) {
      return null;
    }

    return {
      userId: 'usr-1',
      role,
      token,
      hasActiveSubscription: role === 'admin' || role === 'editor' || token.includes('sub')
    };
  } catch (error) {
    return null;
  }
}
