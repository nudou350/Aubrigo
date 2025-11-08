import { Injectable, Logger } from "@nestjs/common";
import * as QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
export interface MBWayPaymentRequest {
  amount: number;
  phoneNumber: string;
  reference: string;
  description: string;
}
export interface MBWayPaymentResponse {
  transactionId: string;
  reference: string;
  amount: number;
  phoneNumber: string;
  qrCodeDataUrl: string;
  expiresAt: Date;
  status: "pending" | "paid" | "expired" | "cancelled";
}
@Injectable()
export class MBWayService {
  private readonly logger = new Logger(MBWayService.name);
  private pendingTransactions = new Map<string, MBWayPaymentResponse>();
  /**
   * Creates an MB Way payment request and generates a QR code
   * Note: This is a simplified implementation. In production, you would integrate
   * with the actual MB Way API (SIBS or payment gateway that supports MB Way)
   */
  async createPaymentRequest(
    request: MBWayPaymentRequest
  ): Promise<MBWayPaymentResponse> {
    try {
      // Generate unique transaction ID
      const transactionId = uuidv4();
      // Generate reference (in production, this would come from MB Way API)
      const reference = this.generateReference();
      // Create MB Way payment URL/data
      // Format: MB Way payment data includes amount, reference, and merchant info
      const paymentData = this.generatePaymentData({
        transactionId,
        amount: request.amount,
        reference,
        phoneNumber: request.phoneNumber,
        description: request.description,
      });
      // Generate QR Code
      const qrCodeDataUrl = await QRCode.toDataURL(paymentData, {
        errorCorrectionLevel: "M",
        type: "image/png",
        width: 300,
        margin: 1,
      });
      // Set expiration (15 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      const response: MBWayPaymentResponse = {
        transactionId,
        reference,
        amount: request.amount,
        phoneNumber: request.phoneNumber,
        qrCodeDataUrl,
        expiresAt,
        status: "pending",
      };
      // Store in memory (in production, store in database)
      this.pendingTransactions.set(transactionId, response);
      // Set timeout to expire transaction
      setTimeout(
        () => {
          this.expireTransaction(transactionId);
        },
        15 * 60 * 1000
      );
      this.logger.log(
        `MB Way payment request created: ${transactionId} for €${request.amount}`
      );
      return response;
    } catch (error) {
      this.logger.error("Error creating MB Way payment request:", error);
      throw error;
    }
  }
  /**
   * Check payment status
   * In production, this would query the MB Way API
   */
  async checkPaymentStatus(
    transactionId: string
  ): Promise<MBWayPaymentResponse | null> {
    return this.pendingTransactions.get(transactionId) || null;
  }
  /**
   * Simulate payment confirmation (for testing)
   * In production, this would be called by webhook from MB Way
   */
  async confirmPayment(transactionId: string): Promise<boolean> {
    const transaction = this.pendingTransactions.get(transactionId);
    if (transaction && transaction.status === "pending") {
      transaction.status = "paid";
      this.pendingTransactions.set(transactionId, transaction);
      this.logger.log(`Payment confirmed for transaction: ${transactionId}`);
      return true;
    }
    return false;
  }
  /**
   * Cancel payment
   */
  async cancelPayment(transactionId: string): Promise<boolean> {
    const transaction = this.pendingTransactions.get(transactionId);
    if (transaction && transaction.status === "pending") {
      transaction.status = "cancelled";
      this.pendingTransactions.set(transactionId, transaction);
      this.logger.log(`Payment cancelled for transaction: ${transactionId}`);
      return true;
    }
    return false;
  }
  /**
   * Generate a payment reference (9 digits)
   */
  private generateReference(): string {
    return Math.floor(100000000 + Math.random() * 900000000).toString();
  }
  /**
   * Generate payment data for QR code
   * In production, this would follow the MB Way standard format
   */
  private generatePaymentData(data: {
    transactionId: string;
    amount: number;
    reference: string;
    phoneNumber: string;
    description: string;
  }): string {
    // MB Way QR Code format (simplified)
    // In production, use the actual MB Way QR code specification
    const paymentInfo = {
      merchant: "Aubrigo",
      reference: data.reference,
      amount: data.amount.toFixed(2),
      currency: "EUR",
      phone: data.phoneNumber,
      description: data.description,
      transactionId: data.transactionId,
    };
    return JSON.stringify(paymentInfo);
  }
  /**
   * Expire a transaction
   */
  private expireTransaction(transactionId: string): void {
    const transaction = this.pendingTransactions.get(transactionId);
    if (transaction && transaction.status === "pending") {
      transaction.status = "expired";
      this.pendingTransactions.set(transactionId, transaction);
      this.logger.log(`Transaction expired: ${transactionId}`);
    }
  }
  /**
   * Clean up old transactions
   */
  cleanupOldTransactions(): void {
    const now = new Date();
    let cleanedCount = 0;
    this.pendingTransactions.forEach((transaction, id) => {
      if (transaction.expiresAt < now) {
        this.pendingTransactions.delete(id);
        cleanedCount++;
      }
    });
    if (cleanedCount > 0) {
      this.logger.log(`Cleaned up ${cleanedCount} expired transactions`);
    }
  }
}
