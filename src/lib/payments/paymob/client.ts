/**
 * Paymob API Client
 * Low-level client for interacting with Paymob API
 */

import crypto from 'crypto';
import { PAYMOB_CONFIG, getPaymobAmount, getPaymobIntegrationId } from './config';

// Types for Paymob API responses
export interface PaymobAuthResponse {
  token: string;
  profile: {
    id: number;
    user: {
      id: number;
      email: string;
    };
  };
}

export interface PaymobOrderResponse {
  id: number;
  created_at: string;
  delivery_needed: boolean;
  merchant: {
    id: number;
    company_name: string;
  };
  amount_cents: number;
  currency: string;
  items: PaymobItem[];
}

export interface PaymobItem {
  name: string;
  amount_cents: number;
  description: string;
  quantity: number;
}

export interface PaymobPaymentKeyResponse {
  token: string;
}

export interface PaymobIntentionResponse {
  intention_id: string;
  client_secret: string;
  intention_detail: {
    amount: number;
    currency: string;
    items: PaymobItem[];
  };
  payment_methods: string[];
  special_reference: string;
}

export interface PaymobBillingData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  apartment?: string;
  floor?: string;
  street?: string;
  building?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface PaymobTransactionCallback {
  obj: {
    id: number;
    pending: boolean;
    amount_cents: number;
    success: boolean;
    is_auth: boolean;
    is_capture: boolean;
    is_standalone_payment: boolean;
    is_voided: boolean;
    is_refunded: boolean;
    is_3d_secure: boolean;
    integration_id: number;
    profile_id: number;
    has_parent_transaction: boolean;
    order: {
      id: number;
      created_at: string;
      delivery_needed: boolean;
      merchant: { id: number };
      amount_cents: number;
      currency: string;
      shipping_data?: Record<string, unknown>;
    };
    created_at: string;
    currency: string;
    source_data: {
      type: string;
      pan: string;
      sub_type: string;
    };
    error_occured: boolean;
    owner: number;
    data: {
      klass?: string;
      gateway_integration_pk?: number;
      amount?: number;
      currency?: string;
      merchant?: string;
      txn_response_code?: string;
      message?: string;
      captured_amount?: number;
      refunded_amount?: number;
      card_num?: string;
      card_type?: string;
    };
    billing_data: PaymobBillingData;
  };
  type: string;
  hmac: string;
}

/**
 * Paymob API Client class
 */
export class PaymobClient {
  private baseUrl: string;
  private secretKey: string;
  private hmacSecret: string;

  constructor() {
    this.baseUrl = PAYMOB_CONFIG.baseUrl;
    this.secretKey = PAYMOB_CONFIG.secretKey;
    this.hmacSecret = PAYMOB_CONFIG.hmacSecret;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${this.secretKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Paymob API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    return response.json();
  }

  /**
   * Create a payment intention (modern API)
   */
  async createIntention(params: {
    amount: number;
    currency: string;
    items: PaymobItem[];
    billingData: PaymobBillingData;
    paymentMethods: string[];
    specialReference?: string;
    notificationUrl?: string;
    redirectUrl?: string;
    extras?: Record<string, unknown>;
  }): Promise<PaymobIntentionResponse> {
    const payload = {
      amount: params.amount,
      currency: params.currency,
      payment_methods: params.paymentMethods,
      items: params.items,
      billing_data: params.billingData,
      special_reference: params.specialReference,
      notification_url: params.notificationUrl,
      redirection_url: params.redirectUrl,
      extras: params.extras,
    };

    return this.request<PaymobIntentionResponse>('/v1/intention/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Create a checkout session for a subscription plan
   */
  async createCheckoutSession(params: {
    plan: 'pro' | 'team' | 'enterprise';
    billing: 'monthly' | 'yearly';
    userEmail: string;
    userName: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{
    checkoutUrl: string;
    clientSecret: string;
    intentionId: string;
  }> {
    const amount = getPaymobAmount(params.plan, params.billing);
    const integrationId = getPaymobIntegrationId(params.plan, params.billing);

    // Parse name
    const nameParts = params.userName.split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    // Create intention
    const intention = await this.createIntention({
      amount,
      currency: PAYMOB_CONFIG.currency,
      items: [
        {
          name: `${params.plan.charAt(0).toUpperCase() + params.plan.slice(1)} Plan (${params.billing})`,
          amount_cents: amount,
          description: `Markdown to PDF ${params.plan} subscription - ${params.billing} billing`,
          quantity: 1,
        },
      ],
      billingData: {
        first_name: firstName,
        last_name: lastName,
        email: params.userEmail,
        phone_number: '+201000000000', // Placeholder
        country: 'EG',
      },
      paymentMethods: [integrationId],
      specialReference: `${params.userId}_${params.plan}_${params.billing}_${Date.now()}`,
      notificationUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/paymob`,
      redirectUrl: params.successUrl,
      extras: {
        userId: params.userId,
        userEmail: params.userEmail,
        plan: params.plan,
        billing: params.billing,
      },
    });

    // Build checkout URL
    const checkoutUrl = `${PAYMOB_CONFIG.checkoutUrl}?publicKey=${PAYMOB_CONFIG.publicKey}&clientSecret=${intention.client_secret}`;

    return {
      checkoutUrl,
      clientSecret: intention.client_secret,
      intentionId: intention.intention_id,
    };
  }

  /**
   * Verify webhook HMAC signature
   */
  verifyWebhookSignature(payload: PaymobTransactionCallback): boolean {
    if (!this.hmacSecret) {
      console.warn('PAYMOB_HMAC_SECRET not configured, skipping signature verification');
      return true; // Skip verification if not configured (not recommended for production)
    }

    const { obj, hmac } = payload;

    // Concatenate the values in the specific order Paymob expects
    const concatenatedString = [
      obj.amount_cents,
      obj.created_at,
      obj.currency,
      obj.error_occured,
      obj.has_parent_transaction,
      obj.id,
      obj.integration_id,
      obj.is_3d_secure,
      obj.is_auth,
      obj.is_capture,
      obj.is_refunded,
      obj.is_standalone_payment,
      obj.is_voided,
      obj.order.id,
      obj.owner,
      obj.pending,
      obj.source_data.pan,
      obj.source_data.sub_type,
      obj.source_data.type,
      obj.success,
    ].join('');

    // Calculate HMAC
    const calculatedHmac = crypto
      .createHmac('sha512', this.hmacSecret)
      .update(concatenatedString)
      .digest('hex');

    return calculatedHmac === hmac;
  }

  /**
   * Parse transaction callback data
   */
  parseTransactionCallback(payload: PaymobTransactionCallback): {
    success: boolean;
    transactionId: number;
    orderId: number;
    amount: number;
    currency: string;
    isRefunded: boolean;
    isVoided: boolean;
    errorOccurred: boolean;
    specialReference?: string;
    billingEmail?: string;
    extras?: Record<string, unknown>;
  } {
    const { obj } = payload;

    return {
      success: obj.success && !obj.error_occured,
      transactionId: obj.id,
      orderId: obj.order.id,
      amount: obj.amount_cents,
      currency: obj.currency,
      isRefunded: obj.is_refunded,
      isVoided: obj.is_voided,
      errorOccurred: obj.error_occured,
      billingEmail: obj.billing_data?.email,
    };
  }

  /**
   * Legacy: Authenticate and get token (for older integrations)
   */
  async authenticate(): Promise<string> {
    const response = await fetch(PAYMOB_CONFIG.authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: PAYMOB_CONFIG.apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error('Paymob authentication failed');
    }

    const data: PaymobAuthResponse = await response.json();
    return data.token;
  }

  /**
   * Legacy: Create order (for older integrations)
   */
  async createOrder(
    authToken: string,
    amount: number,
    currency: string,
    items: PaymobItem[]
  ): Promise<PaymobOrderResponse> {
    const response = await fetch(PAYMOB_CONFIG.orderUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: authToken,
        delivery_needed: false,
        amount_cents: amount,
        currency,
        items,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create Paymob order');
    }

    return response.json();
  }

  /**
   * Legacy: Get payment key (for older integrations)
   */
  async getPaymentKey(params: {
    authToken: string;
    orderId: number;
    amount: number;
    currency: string;
    integrationId: string;
    billingData: PaymobBillingData;
    lockOrderWhenPaid?: boolean;
  }): Promise<string> {
    const response = await fetch(PAYMOB_CONFIG.paymentKeyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_token: params.authToken,
        order_id: params.orderId,
        amount_cents: params.amount,
        currency: params.currency,
        integration_id: params.integrationId,
        billing_data: params.billingData,
        lock_order_when_paid: params.lockOrderWhenPaid ?? true,
        expiration: 3600, // 1 hour
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get Paymob payment key');
    }

    const data: PaymobPaymentKeyResponse = await response.json();
    return data.token;
  }

  /**
   * Get iframe URL for card payment
   */
  getIframeUrl(paymentToken: string): string {
    return `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_CONFIG.iframeId}?payment_token=${paymentToken}`;
  }
}

// Export singleton instance
export const paymobClient = new PaymobClient();
