import { jwtDecode } from "jwt-decode";

export function getRoleFromToken(token) {
  try {
    const payload = jwtDecode(token);
    const rawRole =
      payload.role ||
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      null;

    if (Array.isArray(rawRole)) {
      return rawRole.length > 0 ? rawRole[0] : null;
    }
    return rawRole;
  } catch {
    return null;
  }
}
