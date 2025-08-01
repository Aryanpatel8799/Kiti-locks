// Razorpay configuration
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_CjxI6ZFqFKX7Xs';

export default { loadRazorpay, razorpayKeyId };
