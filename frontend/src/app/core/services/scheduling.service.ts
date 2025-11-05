import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ========== OPERATING HOURS ==========
export interface OngOperatingHours {
  id: string;
  dayOfWeek: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "17:00"
  lunchBreakStart?: string; // "12:00"
  lunchBreakEnd?: string; // "13:00"
}

export interface CreateOperatingHoursDto {
  dayOfWeek: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
}

export interface BulkOperatingHoursDto {
  operatingHours: CreateOperatingHoursDto[];
}

// ========== APPOINTMENT SETTINGS ==========
export interface AppointmentSettings {
  id: string;
  visitDurationMinutes: number;
  maxConcurrentVisits: number;
  minAdvanceBookingHours: number;
  maxAdvanceBookingDays: number;
  slotIntervalMinutes: number;
  allowWeekendBookings: boolean;
}

export interface CreateAppointmentSettingsDto {
  visitDurationMinutes: number;
  maxConcurrentVisits: number;
  minAdvanceBookingHours: number;
  maxAdvanceBookingDays: number;
  slotIntervalMinutes: number;
  allowWeekendBookings: boolean;
}

// ========== AVAILABILITY EXCEPTIONS ==========
export interface AvailabilityException {
  id: string;
  exceptionType: 'blocked' | 'available';
  startDate: string; // "2025-12-24"
  endDate: string; // "2025-12-26"
  startTime?: string; // "09:00"
  endTime?: string; // "12:00"
  reason: string;
  createdAt: string;
}

export interface CreateAvailabilityExceptionDto {
  exceptionType: 'blocked' | 'available';
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
}

// ========== AVAILABLE SLOTS ==========
export interface AvailableSlot {
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  available: boolean;
  reason?: string;
}

export interface AvailableSlotsResponse {
  date: string;
  ongOperatingHours: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    lunchBreakStart?: string;
    lunchBreakEnd?: string;
  };
  slots: AvailableSlot[];
}

export interface AvailableDatesResponse {
  year: number;
  month: number;
  availableDates: string[]; // ["2025-01-02", "2025-01-03", ...]
}

@Injectable({
  providedIn: 'root',
})
export class SchedulingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ========== OPERATING HOURS (ONG) ==========

  /**
   * Get operating hours for my ONG
   */
  getMyOperatingHours(): Observable<OngOperatingHours[]> {
    return this.http.get<OngOperatingHours[]>(`${this.apiUrl}/ongs/my-ong/operating-hours`);
  }

  /**
   * Get operating hours for any ONG (public)
   */
  getOngOperatingHours(ongId: string): Observable<OngOperatingHours[]> {
    return this.http.get<OngOperatingHours[]>(`${this.apiUrl}/ongs/${ongId}/operating-hours`);
  }

  /**
   * Create or update all operating hours at once (bulk)
   */
  bulkUpdateOperatingHours(data: BulkOperatingHoursDto): Observable<OngOperatingHours[]> {
    return this.http.post<OngOperatingHours[]>(`${this.apiUrl}/ongs/my-ong/operating-hours/bulk`, data);
  }

  /**
   * Update operating hours for a specific day
   */
  updateDayOperatingHours(dayOfWeek: number, data: Partial<CreateOperatingHoursDto>): Observable<OngOperatingHours> {
    return this.http.put<OngOperatingHours>(`${this.apiUrl}/ongs/my-ong/operating-hours/${dayOfWeek}`, data);
  }

  // ========== APPOINTMENT SETTINGS (ONG) ==========

  /**
   * Get appointment settings for my ONG
   */
  getMyAppointmentSettings(): Observable<AppointmentSettings> {
    return this.http.get<AppointmentSettings>(`${this.apiUrl}/ongs/my-ong/appointment-settings`);
  }

  /**
   * Get appointment settings for any ONG (public)
   */
  getOngAppointmentSettings(ongId: string): Observable<AppointmentSettings> {
    return this.http.get<AppointmentSettings>(`${this.apiUrl}/ongs/${ongId}/appointment-settings`);
  }

  /**
   * Create or update appointment settings
   */
  updateAppointmentSettings(data: CreateAppointmentSettingsDto): Observable<AppointmentSettings> {
    return this.http.post<AppointmentSettings>(`${this.apiUrl}/ongs/my-ong/appointment-settings`, data);
  }

  // ========== AVAILABILITY EXCEPTIONS (ONG) ==========

  /**
   * Get all availability exceptions for my ONG
   */
  getMyExceptions(): Observable<AvailabilityException[]> {
    return this.http.get<AvailabilityException[]>(`${this.apiUrl}/ongs/my-ong/exceptions`);
  }

  /**
   * Get only active exceptions
   */
  getMyActiveExceptions(): Observable<AvailabilityException[]> {
    return this.http.get<AvailabilityException[]>(`${this.apiUrl}/ongs/my-ong/exceptions/active`);
  }

  /**
   * Create a new exception (block or make available)
   */
  createException(data: CreateAvailabilityExceptionDto): Observable<AvailabilityException> {
    return this.http.post<AvailabilityException>(`${this.apiUrl}/ongs/my-ong/exceptions`, data);
  }

  /**
   * Auto-create Portuguese holidays for a year
   */
  createHolidays(year: number): Observable<{ message: string; created: number }> {
    return this.http.post<{ message: string; created: number }>(
      `${this.apiUrl}/ongs/my-ong/exceptions/holidays/${year}`,
      {}
    );
  }

  /**
   * Update an exception
   */
  updateException(id: string, data: Partial<CreateAvailabilityExceptionDto>): Observable<AvailabilityException> {
    return this.http.put<AvailabilityException>(`${this.apiUrl}/ongs/my-ong/exceptions/${id}`, data);
  }

  /**
   * Delete an exception
   */
  deleteException(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/ongs/my-ong/exceptions/${id}`);
  }

  /**
   * Clean up expired exceptions
   */
  cleanupExpiredExceptions(): Observable<{ message: string; deleted: number }> {
    return this.http.delete<{ message: string; deleted: number }>(
      `${this.apiUrl}/ongs/my-ong/exceptions/cleanup/expired`
    );
  }

  // ========== AVAILABLE SLOTS & DATES (PUBLIC) ==========

  /**
   * Get available dates for a specific month
   */
  getAvailableDates(ongId: string, year: number, month: number): Observable<AvailableDatesResponse> {
    return this.http.get<AvailableDatesResponse>(
      `${this.apiUrl}/ongs/${ongId}/available-dates`,
      { params: { year: year.toString(), month: month.toString() } }
    );
  }

  /**
   * Get available time slots for a specific date
   */
  getAvailableSlots(ongId: string, date: string): Observable<AvailableSlotsResponse> {
    return this.http.get<AvailableSlotsResponse>(
      `${this.apiUrl}/ongs/${ongId}/available-slots`,
      { params: { date } }
    );
  }
}
