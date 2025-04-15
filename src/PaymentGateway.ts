import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { OrderParams, OrderResponse, PaymentGatewayConfig, OrderData } from './types';
import { encryptData } from './utils/encryption';
import { generateUniqueToken } from './utils/tokenGenerator';
import { getHttpsAgent } from './utils/httpsAgent';
import CryptoJS from 'crypto-js';
export class PaymentGateway {
  private config: PaymentGatewayConfig;
  private orderModel: any;

  constructor(config: PaymentGatewayConfig, orderModel: any) {
    this.config = config;
    this.orderModel = orderModel;
  }

  async createOrder(
    amount: string,
    userId: string,
  ): Promise<OrderResponse> {
    const uniqueToken = generateUniqueToken();
    const orderData: OrderData = {
      order: {
        typeRid: '1',
        amount,
        currency: 'EUR',
        description: 'Payment for order',
        language: 'en',
        hppRedirectUrl: `${this.config.clientUrl}/successfully-payment/${uniqueToken}`,
        initiationEnvKind: 'Browser',
        consumerDevice: {
          browser: {
            javaEnabled: false,
            jsEnabled: true,
            acceptHeader: 'application/json,application/xml;charset=utf-8',
            ip: '127.0.0.1',
            colorDepth: '24',
            screenW: '1080',
            screenH: '1920',
            tzOffset: '-300',
            language: 'en-EN',
            userAgent:
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.80 Safari/537.36',
          },
        },
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Merchant-ID': this.config.merchantId,
    };

    const port = this.config.apiPort || '8000'; // Use config port or default to 8000
    const endpoint = `${this.config.apiUrl}:${port}/order`;


    try {
      const httpsAgent = getHttpsAgent(
        this.config.sslCert,
        this.config.sslKey,
        this.config.sslCa
      );
      
      const response = await axios.post(endpoint, orderData, {
        headers,
        httpsAgent,
      });

      const { id, password, status, hppUrl } = response.data.order;

      if (!id || !password || !hppUrl) {
        throw new Error('Invalid response from payment gateway');
      }

      const encryptedPassword = encryptData(
        password,
        this.config.encryptionKey
      );

      const newOrder = new this.orderModel({
        _id: uuidv4(),
        orderId: id,
        password: encryptedPassword,
        status,
        urlToken: uniqueToken,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await newOrder.save();

      return {
        redirectUrl: `${hppUrl}?id=${id}&password=${password}`,
        orderId: id,
      };
    } catch (error) {
      console.error('Error creating order:', (error as any).message);

      if (axios.isAxiosError(error) && error.response) {
        console.error('Response Data:', error.response.data);
        console.error('Response Status:', error.response.status);
        console.error('Response Headers:', error.response.headers);
      }

      throw new Error('Failed to create order');
    }
  }

  async completeOrder(
    orderId: string,
    encryptionKey: string,
    procreditApi: string,
  ): Promise<string> {
    const order = await this.orderModel.findOne({ orderId: orderId });

    if (!order) {
      throw new Error('Order not found');
    }

    // Function to decrypt the password
    const decryptPassword = (
      encryptedPassword: string,
      key: string,
    ): string => {
      const bytes = CryptoJS.AES.decrypt(encryptedPassword, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    };

    // Decrypt the password
    const decryptedPassword = decryptPassword(order.password, encryptionKey);

    
    // Call the bank API
    const endpoint = `${procreditApi}:8000/order/${orderId}?password=${decryptedPassword}&tokenDetailLevel=2&tranDetailLevel=1`;

    try {
      const apiResponse = await axios.get(endpoint);
      console.log('API Response:', apiResponse);
      if (apiResponse.data.order.status === 'Expired') {
        throw new Error('Order expired');
      }

      const returnedStatus = apiResponse.data.order.status;

      await this.orderModel.updateOne(
        { orderId: orderId },
        { $set: { status: returnedStatus } },
      );

      return 'Order status updated successfully';
    } catch (error) {
      throw new Error(`Error from bank API: ${(error as any).message}`);
    }
  }
}