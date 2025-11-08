import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DonationRequest {
  ongId: string;
  donorName: string;
  donorEmail: string;
  donorCpf?: string;
  donorBirthDate?: string;
  donorGender?: string;
  amount: number;
  donationType: 'one_time' | 'monthly';
  paymentMethod: 'mbway' | 'stripe' | 'multibanco' | 'pix';
  phoneNumber?: string; // For MB Way / PIX
  cardHolderName?: string; // For Stripe
}

export interface MBWayPaymentResponse {
  message: string;
  donation: {
    id: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
  };
  mbway: {
    transactionId: string;
    reference: string;
    qrCode: string; // Base64 data URL
    phoneNumber: string;
    expiresAt: string;
    instructions: string[];
  };
}

export interface PaymentStatusResponse {
  donationId: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  mbwayStatus?: 'pending' | 'paid' | 'expired' | 'cancelled';
}

export interface Ong {
  id: string;
  ongName: string;
  profileImageUrl?: string;
  location?: string;
  phone?: string;
  pixKey?: string;
  countryCode?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DonationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/donations`;
  private usersUrl = `${environment.apiUrl}/users`;

  getAllOngs(filters?: { search?: string; location?: string; countryCode?: string }): Observable<Ong[]> {
    let params: any = {};

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.location) params.location = filters.location;
      if (filters.countryCode) params.countryCode = filters.countryCode;
    }

    return this.http.get<Ong[]>(this.usersUrl, { params });
  }

  createDonation(donationData: DonationRequest): Observable<MBWayPaymentResponse> {
    return this.http.post<MBWayPaymentResponse>(this.apiUrl, donationData);
  }

  checkPaymentStatus(donationId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.apiUrl}/${donationId}/status`);
  }

  confirmMBWayPayment(transactionId: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/mbway/confirm/${transactionId}`,
      {},
    );
  }

  getDonationsByOng(ongId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/ong/${ongId}`);
  }
}
