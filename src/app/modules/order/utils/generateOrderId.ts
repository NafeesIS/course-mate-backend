function generateOrderId() {
  const timestampPart = Date.now().toString().slice(-4); // Last 4 digits of the current timestamp
  const randomPart = Math.floor(10 + Math.random() * 90).toString(); // Generate a random 2-digit number
  return `order_${timestampPart}${randomPart}`;
}

export default generateOrderId;
