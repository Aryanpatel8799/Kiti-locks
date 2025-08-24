// Razorpay configuration
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpay = () => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      // Razorpay already loaded
      return resolve(true);
    }

    // Loading Razorpay script...
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      // Razorpay script loaded successfully
      resolve(true);
    };
    script.onerror = (error) => {
      // Failed to load Razorpay script
      reject(error);
    };
    document.body.appendChild(script);
  });
};

export const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_CjxI6ZFqFKX7Xs';

// Razorpay Key ID logged for debugging

export default { loadRazorpay, razorpayKeyId };
