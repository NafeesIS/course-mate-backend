/* eslint-disable indent */
export function formatCurrencyINR(value: string | number) {
  const amount = typeof value === 'string' ? parseInt(value, 10) : value; // Ensure the value is an integer
  if (isNaN(amount)) return ''; // Return empty string if value is not a number

  // Directly return for amounts less than 1 lakh
  if (amount < 100000) {
    return `₹${amount}`;
  }
  // Format for lakhs
  else if (amount >= 100000 && amount < 10000000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  // Format for crores
  else {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
}

export function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const getCurrencySymbol = (currency: string) => {
  switch (currency.toUpperCase()) {
    case 'USD':
      return '$';
    case 'INR':
      return '₹';
    default:
      return currency; // Fallback to the currency code if not recognized
  }
};
