// Razorpay live configuration
// Key ID is loaded from public config file at runtime
// Key Secret is NEVER exposed to the frontend

let cachedConfig: RazorpayConfig | null = null;

export interface RazorpayConfig {
  keyId: string;
  currency: string;
  companyName: string;
  companyLogo: string;
  theme: {
    color: string;
  };
}

export async function loadRazorpayConfig(): Promise<RazorpayConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/razorpay.config.json');
    if (!response.ok) {
      throw new Error('Failed to load Razorpay configuration');
    }
    cachedConfig = await response.json();
    return cachedConfig!;
  } catch (error) {
    console.error('Failed to load Razorpay config:', error);
    // Fallback to default config
    cachedConfig = {
      keyId: 'rzp_live_kyn4dKuIvsesAX',
      currency: 'INR',
      companyName: 'MCubes',
      companyLogo: '',
      theme: {
        color: '#FF6B35',
      },
    };
    return cachedConfig;
  }
}
