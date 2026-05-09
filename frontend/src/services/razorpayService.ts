/**
 * razorpayService.ts — Phase 6
 * Loads Razorpay checkout script and opens the payment modal.
 * Key ID is read from Vite env (VITE_RAZORPAY_KEY_ID) — never hardcoded.
 */

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface RazorpayOptions {
  orderId: string;
  amount: number;       // in paise
  currency: string;
  keyId: string;        // returned from backend — not hardcoded here
  doctorName: string;
  hospitalName: string;
  patientName: string;
  patientEmail: string;
  onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  onFailure: (error: any) => void;
}

export const openRazorpayCheckout = async (opts: RazorpayOptions): Promise<void> => {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    opts.onFailure(new Error('Razorpay SDK failed to load. Check your internet connection.'));
    return;
  }

  const razorpay = new window.Razorpay({
    key:         opts.keyId,
    amount:      opts.amount,
    currency:    opts.currency,
    order_id:    opts.orderId,
    name:        'MediFlowIQ',
    description: `Consultation with ${opts.doctorName} at ${opts.hospitalName}`,
    image:       '/logo.svg',
    prefill: {
      name:  opts.patientName,
      email: opts.patientEmail,
    },
    theme: { color: '#0EA5E9' },
    handler: opts.onSuccess,
    modal: {
      ondismiss: () => opts.onFailure(new Error('Payment cancelled')),
    },
  });

  razorpay.open();
};
