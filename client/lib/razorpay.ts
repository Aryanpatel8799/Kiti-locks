// Razorpay configuration
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpay = () => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log("✅ Razorpay already loaded");
      resolve(true);
      return;
    }

    console.log("📦 Loading Razorpay script...");
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log("✅ Razorpay script loaded successfully");
      resolve(true);
    };
    script.onerror = (error) => {
      console.error("❌ Failed to load Razorpay script:", error);
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_CjxI6ZFqFKX7Xs';

console.log("Razorpay Key ID:", razorpayKeyId);

export default { loadRazorpay, razorpayKeyId };
