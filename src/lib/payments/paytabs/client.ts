/**
 * PayTabs API Client
 * Low-level client for interacting with PayTabs API
 */

import crypto from 'crypto';
import { PAYTABS_CONFIG, getPayTabsAmount, getPayTabsCurrency } from './config';

// PayTabs API request types
export interface PayTabsCustomerDetails {
  name: string;
  email: string;
  phone?: string;
  street1?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  ip?: string;
}

export interface PayTabsShippingDetails {
  name?: string;
  email?: string;
  phone?: string;
  street1?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export interface PayTabsPaymentRequest {
  profile_id: string;
  tran_type: 'sale' | 'auth' | 'register';
  tran_class: 'ecom' | 'recurring' | 'moto';
  cart_id: string;
  cart_description: string;
  cart_currency: string;
  cart_amount: number;
  callback: string;
  return: string;
  customer_details: PayTabsCustomerDetails;
  shipping_details?: PayTabsShippingDetails;
  hide_shipping?: boolean;
  framed?: boolean;
  framed_return_top?: boolean;
  framed_return_parent?: boolean;
  tokenise?: number;
  show_save_card?: boolean;
  user_defined?: {
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
    udf6?: string;
    udf7?: string;
    udf8?: string;
    udf9?: string;
  };
}

export interface PayTabsPaymentResponse {
  tran_ref: string;
  tran_type: string;
  cart_id: string;
  cart_description: string;
  cart_currency: string;
  cart_amount: string;
  tran_currency: string;
  tran_total: string;
  customer_details: PayTabsCustomerDetails;
  shipping_details: PayTabsShippingDetails;
  payment_result: {
    response_status: string;
    response_code: string;
    response_message: string;
    transaction_time: string;
  };
  payment_info: {
    payment_method: string;
    card_type: string;
    card_scheme: string;
    payment_description: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  redirect_url: string;
  trace: string;
  serviceId?: number;
  profileId?: number;
  merchantId?: number;
  token?: string;
}

export interface PayTabsQueryResponse {
  tran_ref: string;
  tran_type: string;
  cart_id: string;
  cart_description: string;
  cart_currency: string;
  cart_amount: string;
  tran_currency: string;
  tran_total: string;
  customer_details: PayTabsCustomerDetails;
  payment_result: {
    response_status: string;
    response_code: string;
    response_message: string;
    transaction_time: string;
  };
  payment_info: {
    payment_method: string;
    card_type: string;
    card_scheme: string;
    payment_description: string;
  };
}

export interface PayTabsCallbackData {
  tran_ref: string;
  merchant_id: string;
  profile_id: string;
  cart_id: string;
  cart_description: string;
  cart_currency: string;
  cart_amount: string;
  tran_currency: string;
  tran_total: string;
  tran_type: string;
  customer_details: {
    name: string;
    email: string;
    phone: string;
    street1: string;
    city: string;
    state: string;
    country: string;
    zip: string;
    ip: string;
  };
  payment_result: {
    response_status: string;
    response_code: string;
    response_message: string;
    acquirer_message: string;
    acquirer_rrn: string;
    transaction_time: string;
  };
  payment_info: {
    payment_method: string;
    card_type: string;
    card_scheme: string;
    payment_description: string;
    expiryMonth: number;
    expiryYear: number;
  };
  user_defined?: {
    udf1?: string;
    udf2?: string;
    udf3?: string;
    udf4?: string;
    udf5?: string;
    udf6?: string;
    udf7?: string;
    udf8?: string;
    udf9?: string;
  };
  signature: string;
}

/**
 * PayTabs API Client class
 */
export class PayTabsClient {
  private profileId: string;
  private serverKey: string;
  private baseUrl: string;

  constructor() {
    this.profileId = PAYTABS_CONFIG.profileId;
    this.serverKey = PAYTABS_CONFIG.serverKey;
    this.baseUrl = PAYTABS_CONFIG.baseUrl;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T, D = Record<string, unknown>>(endpoint: string, data: D): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.serverKey,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayTabs API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Create a payment page (hosted checkout)
   */
  async createPaymentPage(params: {
    cartId: string;
    cartDescription: string;
    amount: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerCountry?: string;
    returnUrl: string;
    callbackUrl: string;
    metadata?: Record<string, string>;
    tokenise?: boolean;
  }): Promise<PayTabsPaymentResponse> {
    const payload: PayTabsPaymentRequest = {
      profile_id: this.profileId,
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: params.cartId,
      cart_description: params.cartDescription,
      cart_currency: params.currency,
      cart_amount: params.amount,
      callback: params.callbackUrl,
      return: params.returnUrl,
      customer_details: {
        name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone || '',
        country: params.customerCountry || 'AE',
      },
      hide_shipping: true,
      tokenise: params.tokenise ? 2 : 0,
      user_defined: params.metadata
        ? {
            udf1: params.metadata.userId,
            udf2: params.metadata.plan,
            udf3: params.metadata.billing,
            udf4: params.metadata.userEmail,
          }
        : undefined,
    };

    return this.request<PayTabsPaymentResponse>(
      '/payment/request',
      payload as unknown as Record<string, unknown>
    );
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
    callbackUrl: string;
    region?: string;
  }): Promise<{
    redirectUrl: string;
    transactionRef: string;
  }> {
    const amount = getPayTabsAmount(params.plan, params.billing, params.region);
    const currency = getPayTabsCurrency(params.region);
    const cartId = `${params.userId}_${params.plan}_${params.billing}_${Date.now()}`;

    const response = await this.createPaymentPage({
      cartId,
      cartDescription: `Markdown to PDF ${params.plan} subscription - ${params.billing} billing`,
      amount,
      currency,
      customerName: params.userName,
      customerEmail: params.userEmail,
      returnUrl: params.successUrl,
      callbackUrl: params.callbackUrl,
      metadata: {
        userId: params.userId,
        plan: params.plan,
        billing: params.billing,
        userEmail: params.userEmail,
      },
      tokenise: true, // Save card for future payments
    });

    return {
      redirectUrl: response.redirect_url,
      transactionRef: response.tran_ref,
    };
  }

  /**
   * Query transaction status
   */
  async queryTransaction(transactionRef: string): Promise<PayTabsQueryResponse> {
    return this.request<PayTabsQueryResponse>('/payment/query', {
      profile_id: this.profileId,
      tran_ref: transactionRef,
    });
  }

  /**
   * Process a refund
   */
  async refund(params: {
    transactionRef: string;
    amount: number;
    currency: string;
    cartId: string;
    cartDescription: string;
  }): Promise<PayTabsPaymentResponse> {
    return this.request<PayTabsPaymentResponse>('/payment/refund', {
      profile_id: this.profileId,
      tran_type: 'refund',
      tran_class: 'ecom',
      tran_ref: params.transactionRef,
      cart_id: params.cartId,
      cart_description: params.cartDescription,
      cart_currency: params.currency,
      cart_amount: params.amount,
    });
  }

  /**
   * Verify callback signature
   * PayTabs sends a signature with callbacks that should be verified
   */
  verifyCallbackSignature(
    callback: PayTabsCallbackData,
    serverKey: string = this.serverKey
  ): boolean {
    // PayTabs callback signature verification
    // The signature is SHA256 hash of (ServerKey + TranRef + CartId + CartAmount + CartCurrency + CustomerEmail + ResponseStatus)
    const dataToHash = [
      serverKey,
      callback.tran_ref,
      callback.cart_id,
      callback.cart_amount,
      callback.cart_currency,
      callback.customer_details.email,
      callback.payment_result.response_status,
    ].join('');

    const calculatedSignature = crypto.createHash('sha256').update(dataToHash).digest('hex');

    return calculatedSignature.toLowerCase() === callback.signature.toLowerCase();
  }

  /**
   * Parse callback data and extract relevant information
   */
  parseCallbackData(callback: PayTabsCallbackData): {
    success: boolean;
    transactionRef: string;
    cartId: string;
    amount: number;
    currency: string;
    responseStatus: string;
    responseCode: string;
    responseMessage: string;
    customerEmail: string;
    userId?: string;
    plan?: string;
    billing?: string;
  } {
    const isSuccess = callback.payment_result.response_status === 'A';

    return {
      success: isSuccess,
      transactionRef: callback.tran_ref,
      cartId: callback.cart_id,
      amount: parseFloat(callback.cart_amount),
      currency: callback.cart_currency,
      responseStatus: callback.payment_result.response_status,
      responseCode: callback.payment_result.response_code,
      responseMessage: callback.payment_result.response_message,
      customerEmail: callback.customer_details.email,
      userId: callback.user_defined?.udf1,
      plan: callback.user_defined?.udf2,
      billing: callback.user_defined?.udf3,
    };
  }
}

// Export singleton instance
export const paytabsClient = new PayTabsClient();
