export const generateCouponCode = (): string => {
  // Generate a random alphanumeric string as a coupon code
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};
