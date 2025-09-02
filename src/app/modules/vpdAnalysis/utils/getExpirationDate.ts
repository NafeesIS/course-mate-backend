import jwt, { JwtPayload } from 'jsonwebtoken';
export function getExpirationDate(token: string) {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded || !decoded.exp) {
      throw new Error('No expiration time found in the token');
    }

    // The 'exp' is a Unix timestamp in seconds
    return new Date(decoded.exp * 1000);
  } catch (error) {
    console.error('Failed to decode token:', error);
    throw error;
  }
}
