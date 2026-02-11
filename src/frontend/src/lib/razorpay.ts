import { RAZORPAY_CONFIG } from '../config/razorpay';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

let razorpayScriptLoaded = false;
let razorpayScriptLoading = false;
const scriptLoadCallbacks: Array<(loaded: boolean) => void> = [];

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (razorpayScriptLoaded) {
      resolve(true);
      return;
    }

    if (razorpayScriptLoading) {
      scriptLoadCallbacks.push(resolve);
      return;
    }

    razorpayScriptLoading = true;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      razorpayScriptLoaded = true;
      razorpayScriptLoading = false;
      resolve(true);
      scriptLoadCallbacks.forEach((cb) => cb(true));
      scriptLoadCallbacks.length = 0;
    };

    script.onerror = () => {
      razorpayScriptLoading = false;
      resolve(false);
      scriptLoadCallbacks.forEach((cb) => cb(false));
      scriptLoadCallbacks.length = 0;
    };

    document.body.appendChild(script);
  });
}

export interface OpenCheckoutParams {
  amount: number;
  competitionName: string;
  userEmail?: string;
  userName?: string;
}

export function openRazorpayCheckout(params: OpenCheckoutParams): Promise<RazorpaySuccessResponse> {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('Razorpay script not loaded'));
      return;
    }

    const options: RazorpayOptions = {
      key: RAZORPAY_CONFIG.keyId,
      amount: params.amount * 100, // Convert to paise
      currency: RAZORPAY_CONFIG.currency,
      name: RAZORPAY_CONFIG.companyName,
      description: `Entry fee for ${params.competitionName}`,
      image: RAZORPAY_CONFIG.companyLogo,
      handler: (response: RazorpaySuccessResponse) => {
        resolve(response);
      },
      prefill: {
        name: params.userName,
        email: params.userEmail,
      },
      theme: RAZORPAY_CONFIG.theme,
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
    };

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  });
}
