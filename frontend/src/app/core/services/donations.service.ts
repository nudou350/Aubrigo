import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentMethod,
  SupportedCountry,
  SupportedCurrency,
  DonationType,
  PaymentStatus
} from '../types';

export interface DonationRequest {
  ongId: string;
  donorName: string;
  donorEmail: string;
  donorCpf?: string;
  donorBirthDate?: string;
  donorGender?: string;
  amount: number;
  donationType: DonationType;
  country: SupportedCountry;
  currency: SupportedCurrency;
  paymentMethod: PaymentMethod;
  phoneNumber?: string; // For MB Way
  cardHolderName?: string; // For Cards
}

export interface DonationResponse {
  message: string;
  donation: {
    id: string;
    amount: number;
    currency: string;
    country: string;
    paymentMethod: string;
    paymentStatus: string;
  };
  payment: {
    paymentIntentId: string;
    clientSecret?: string;
    // MBWay
    requiresAction?: boolean;
    // Manual PIX (ONG's PIX key)
    pixKey?: string;
    pixKeyType?: string;
    // Gateway PIX (EBANX QR Code)
    pixQrCode?: string;
    pixPaymentString?: string;
    // Boleto
    boletoUrl?: string;
    boletoBarcode?: string;
    // Multibanco
    entity?: string;
    reference?: string;
    // Common
    expiresAt?: string;
    instructions?: string | string[];
  };
}

export interface PaymentStatusResponse {
  donationId: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  amount?: number;
  currency?: string;
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

export interface OngFilters {
  search?: string;
  location?: string;
  countryCode?: string;
}

export interface DonationFilters {
  ongId: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: PaymentStatus;
}

@Injectable({
  providedIn: 'root',
})
export class DonationsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/donations`;
  private usersUrl = `${environment.apiUrl}/users`;

  getAllOngs(filters?: OngFilters): Observable<Ong[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.location) params = params.set('location', filters.location);
      if (filters.countryCode) params = params.set('countryCode', filters.countryCode);
    }

    return this.http.get<Ong[]>(this.usersUrl, { params });
  }

  createDonation(donationData: DonationRequest): Observable<DonationResponse> {
    return this.http.post<DonationResponse>(this.apiUrl, donationData);
  }

  checkPaymentStatus(donationId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(`${this.apiUrl}/${donationId}/status`);
  }

  getDonationsByOng(filters: DonationFilters): Observable<DonationResponse[]> {
    let params = new HttpParams();

    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.paymentStatus) params = params.set('paymentStatus', filters.paymentStatus);

    return this.http.get<DonationResponse[]>(`${this.apiUrl}/ong/${filters.ongId}`, { params });
  }
}
