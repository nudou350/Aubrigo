import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Appointment {
  id: string;
  petId: string;
  ongId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  preferredDate: string;
  preferredTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  pet?: {
    id: string;
    name: string;
    primaryImage?: string;
    species: string;
  };
  ong?: {
    id: string;
    ongName: string;
    email: string;
    phone?: string;
    location?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  petId: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone?: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface UpdateAppointmentStatusDto {
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export interface AppointmentResponse {
  message: string;
  appointment: Appointment;
}

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/appointments`;

  /**
   * Create a new appointment (public endpoint)
   */
  createAppointment(data: CreateAppointmentDto): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(this.apiUrl, data);
  }

  /**
   * Get all appointments for the authenticated ONG
   */
  getOngAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/ong`);
  }

  /**
   * Get a specific appointment by ID
   */
  getAppointmentById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  /**
   * Update appointment status (ONG only)
   */
  updateAppointmentStatus(
    id: string,
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  ): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.apiUrl}/${id}/status`, {
      status,
    });
  }

  /**
   * Delete an appointment (ONG only)
   */
  deleteAppointment(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get appointments by visitor email (for users to see their appointments)
   */
  getVisitorAppointments(email: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/visitor/${email}`);
  }

  /**
   * Get appointment statistics for ONG dashboard
   */
  getAppointmentStats(): Observable<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  }> {
    return this.http.get<{
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    }>(`${this.apiUrl}/stats`);
  }
}
