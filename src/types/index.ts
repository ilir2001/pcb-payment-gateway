export interface OrderParams {
    amount: string;
    userId: string;
  }
  
  export interface OrderResponse {
    redirectUrl: string;
    orderId: any;
  }
  
  export interface OrderData {
    order: {
      typeRid: string;
      amount: string;
      currency: string;
      description: string;
      language: string;
      hppRedirectUrl: string;
      initiationEnvKind: string;
      consumerDevice: {
        browser: {
          javaEnabled: boolean;
          jsEnabled: boolean;
          acceptHeader: string;
          ip: string;
          colorDepth: string;
          screenW: string;
          screenH: string;
          tzOffset: string;
          language: string;
          userAgent: string;
        };
      };
    };
  }
  
  export interface PaymentGatewayConfig {
    apiUrl: string;
    merchantId: string;
    clientUrl: string;
    encryptionKey: string;
    sslCert: string;
    sslKey: string;
    sslCa: string;
  }