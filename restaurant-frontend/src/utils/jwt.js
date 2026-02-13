import { jwtDecode } from "jwt-decode";

export function getRoleFromToken(token) {
  try {
    const payload = jwtDecode(token);
    return (
      payload.role ||
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      null
    );
  } catch {
    return null;
  }
}
