import { Injectable, inject } from '@angular/core';
import { Observable, interval, timer } from 'rxjs';
import { switchMap, takeWhile, distinctUntilChanged, map, takeUntil, startWith } from 'rxjs/operators';
import { DonationsService, PaymentStatusResponse } from './donations.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentPollingService {
  private donationsService = inject(DonationsService);

  /**
   * Poll payment status with automatic stop conditions
   * @param donationId - The donation ID to check
   * @param intervalMs - Polling interval in milliseconds (default: 5000 = 5 seconds)
   * @param maxDuration - Maximum polling duration in milliseconds (default: 600000 = 10 minutes)
   * @returns Observable that emits payment status updates
   */
  pollPaymentStatus(
    donationId: string,
    intervalMs = 5000,
    maxDuration = 600000
  ): Observable<PaymentStatusResponse> {
    const stopPolling$ = timer(maxDuration);

    return interval(intervalMs).pipe(
      startWith(0), // Check immediately
      switchMap(() => this.donationsService.checkPaymentStatus(donationId)),
      distinctUntilChanged((prev, curr) => prev.paymentStatus === curr.paymentStatus),
      takeWhile((response) => {
        // Continue polling while payment is pending or processing
        const continuePoll = response.paymentStatus === 'pending' || response.paymentStatus === 'processing';
        return continuePoll;
      }, true), // true = emit the final value that failed the predicate
      takeUntil(stopPolling$)
    );
  }

  /**
   * Poll payment status with custom stop condition
   * @param donationId - The donation ID to check
   * @param stopCondition - Function that returns true when polling should stop
   * @param intervalMs - Polling interval in milliseconds
   * @param maxDuration - Maximum polling duration in milliseconds
   */
  pollWithCustomCondition(
    donationId: string,
    stopCondition: (response: PaymentStatusResponse) => boolean,
    intervalMs = 5000,
    maxDuration = 600000
  ): Observable<PaymentStatusResponse> {
    const stopPolling$ = timer(maxDuration);

    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.donationsService.checkPaymentStatus(donationId)),
      distinctUntilChanged((prev, curr) => prev.paymentStatus === curr.paymentStatus),
      takeWhile((response) => !stopCondition(response), true),
      takeUntil(stopPolling$)
    );
  }

  /**
   * Check payment status once (no polling)
   */
  checkOnce(donationId: string): Observable<PaymentStatusResponse> {
    return this.donationsService.checkPaymentStatus(donationId);
  }

  /**
   * Create a polling observable for PIX payments (24-hour expiration)
   */
  pollPixPayment(donationId: string): Observable<PaymentStatusResponse> {
    // Poll every 5 seconds for up to 24 hours (PIX typical expiration)
    return this.pollPaymentStatus(donationId, 5000, 24 * 60 * 60 * 1000);
  }

  /**
   * Create a polling observable for Boleto payments (3-day expiration)
   */
  pollBoletoPayment(donationId: string): Observable<PaymentStatusResponse> {
    // Poll every 30 seconds for up to 3 days (Boleto typical expiration)
    return this.pollPaymentStatus(donationId, 30000, 3 * 24 * 60 * 60 * 1000);
  }

  /**
   * Create a polling observable for Multibanco payments
   */
  pollMultibancoPayment(donationId: string): Observable<PaymentStatusResponse> {
    // Poll every 10 seconds for up to 30 minutes
    return this.pollPaymentStatus(donationId, 10000, 30 * 60 * 1000);
  }

  /**
   * Create a polling observable for MBWay payments
   */
  pollMBWayPayment(donationId: string): Observable<PaymentStatusResponse> {
    // Poll every 3 seconds for up to 5 minutes (MBWay is fast)
    return this.pollPaymentStatus(donationId, 3000, 5 * 60 * 1000);
  }
}
