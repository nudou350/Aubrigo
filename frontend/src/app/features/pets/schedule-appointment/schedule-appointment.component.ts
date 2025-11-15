import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { AppointmentsService, CreateAppointmentDto } from '../../../core/services/appointments.service';
import { SchedulingService, AvailableSlot } from '../../../core/services/scheduling.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import { AnalyticsService, EventType } from '../../../core/services/analytics.service';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  images: { url: string; isPrimary: boolean }[];
  ong: {
    id: string;
    ongName: string;
    location: string;
  };
}

interface AppointmentForm {
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  notes: string;
}

@Component({
  selector: 'app-schedule-appointment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, BottomNavComponent, TranslateModule],
  template: `
    <div class="schedule-screen">
      <!-- Header -->
      <div class="header">
        <button class="back-button" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 class="title">{{ 'pets.appointment.title' | translate }}</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading">{{ 'common.loading' | translate }}</div>
        </div>
      } @else if (pet()) {
        <div class="content">
          <!-- Pet Info Card -->
          <div class="pet-card">
            <div class="pet-image-container">
              @if (primaryImage()) {
                <img [src]="primaryImage()" [alt]="pet()!.name" class="pet-image" />
              } @else {
                <div class="pet-image-placeholder">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>
              }
            </div>
            <div class="pet-info">
              <h2 class="pet-name">{{ pet()!.name }}</h2>
              <p class="pet-breed">{{ pet()!.breed }}</p>
              <p class="pet-ong">{{ pet()!.ong.ongName }}</p>
            </div>
          </div>

          <!-- Step Indicator -->
          <div class="steps">
            <div class="step" [class.active]="currentStep() === 1" [class.completed]="currentStep() > 1">
              <div class="step-circle">1</div>
              <span class="step-label">{{ 'pets.appointment.preferredDate' | translate }}</span>
            </div>
            <div class="step-line" [class.completed]="currentStep() > 1"></div>
            <div class="step" [class.active]="currentStep() === 2" [class.completed]="currentStep() > 2">
              <div class="step-circle">2</div>
              <span class="step-label">{{ 'pets.appointment.preferredTime' | translate }}</span>
            </div>
            <div class="step-line" [class.completed]="currentStep() > 2"></div>
            <div class="step" [class.active]="currentStep() === 3" [class.completed]="currentStep() > 3">
              <div class="step-circle">3</div>
              <span class="step-label">{{ 'profile.personalInfo' | translate }}</span>
            </div>
          </div>

          <!-- Step 1: Choose Date -->
          @if (currentStep() === 1) {
            <div class="step-content">
              <h3 class="step-title">{{ 'pets.appointment.preferredDate' | translate }}</h3>

              @if (loadingCalendar()) {
                <div class="calendar-loading">{{ 'common.loading' | translate }}</div>
              } @else {
                <!-- Month Navigation -->
                <div class="month-nav">
                  <button class="nav-button" (click)="previousMonth()" [disabled]="!canGoPrevious()">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                  </button>
                  <h3 class="month-title">{{ currentMonthName() }}</h3>
                  <button class="nav-button" (click)="nextMonth()">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                  </button>
                </div>

                <!-- Calendar Grid -->
                <div class="calendar">
                  <div class="calendar-header">
                    <div class="day-name">Dom</div>
                    <div class="day-name">Seg</div>
                    <div class="day-name">Ter</div>
                    <div class="day-name">Qua</div>
                    <div class="day-name">Qui</div>
                    <div class="day-name">Sex</div>
                    <div class="day-name">Sáb</div>
                  </div>
                  <div class="calendar-body">
                    @for (day of calendarDays(); track day.dateStr) {
                      <button
                        class="calendar-day"
                        [class.empty]="!day.dayNumber"
                        [class.available]="day.isAvailable"
                        [class.selected]="selectedDate() === day.dateStr"
                        [disabled]="!day.isAvailable"
                        (click)="selectDate(day.dateStr)"
                      >
                        {{ day.dayNumber }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- Step 2: Choose Time Slot -->
          @if (currentStep() === 2) {
            <div class="step-content">
              <h3 class="step-title">{{ 'pets.appointment.preferredTime' | translate }}</h3>
              <p class="step-subtitle">{{ formatSelectedDate() }}</p>

              @if (loadingSlots()) {
                <div class="slots-loading">{{ 'common.loading' | translate }}</div>
              } @else {
                @if (availableSlots().length === 0) {
                  <div class="no-slots">
                    <p>{{ 'errors.notFound' | translate }}</p>
                    <button class="btn-secondary" (click)="backToStep(1)">
                      {{ 'common.back' | translate }}
                    </button>
                  </div>
                } @else {
                  <div class="slots-grid">
                    @for (slot of availableSlots(); track slot.startTime) {
                      <button
                        class="slot-button"
                        [class.selected]="selectedSlot() === slot.startTime"
                        (click)="selectSlot(slot.startTime)"
                      >
                        {{ formatTime(slot.startTime) }}
                      </button>
                    }
                  </div>

                  <div class="step-actions">
                    <button class="btn-secondary" (click)="backToStep(1)">
                      {{ 'common.back' | translate }}
                    </button>
                    <button class="btn-primary" (click)="nextStep()" [disabled]="!selectedSlot()">
                      {{ 'common.next' | translate }}
                    </button>
                  </div>
                }
              }
            </div>
          }

          <!-- Step 3: Fill Personal Data -->
          @if (currentStep() === 3) {
            <div class="step-content">
              <h3 class="step-title">{{ 'profile.personalInfo' | translate }}</h3>
              <p class="step-subtitle">
                {{ formatSelectedDate() }} às {{ formatTime(selectedSlot()!) }}
              </p>

              <form class="appointment-form" (ngSubmit)="submitAppointment()">
                <div class="form-group">
                  <label for="visitorName">{{ 'pets.appointment.visitorName' | translate }} *</label>
                  <input
                    type="text"
                    id="visitorName"
                    name="visitorName"
                    [(ngModel)]="formData.visitorName"
                    [placeholder]="'pets.appointment.visitorName' | translate"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="visitorEmail">{{ 'pets.appointment.visitorEmail' | translate }} *</label>
                  <input
                    type="email"
                    id="visitorEmail"
                    name="visitorEmail"
                    [(ngModel)]="formData.visitorEmail"
                    [placeholder]="'pets.appointment.visitorEmail' | translate"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="visitorPhone">{{ 'pets.appointment.visitorPhone' | translate }} *</label>
                  <input
                    type="tel"
                    id="visitorPhone"
                    name="visitorPhone"
                    [(ngModel)]="formData.visitorPhone"
                    [placeholder]="'pets.appointment.visitorPhone' | translate"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="notes">{{ 'pets.appointment.notes' | translate }}</label>
                  <textarea
                    id="notes"
                    name="notes"
                    [(ngModel)]="formData.notes"
                    [placeholder]="'pets.appointment.notes' | translate"
                    rows="4"
                  ></textarea>
                </div>

                @if (errorMessage()) {
                  <div class="error-message">
                    {{ errorMessage() }}
                  </div>
                }

                <div class="step-actions">
                  <button
                    type="button"
                    class="btn-secondary"
                    (click)="backToStep(2)"
                    [disabled]="submitting()"
                  >
                    {{ 'common.back' | translate }}
                  </button>
                  <button
                    type="submit"
                    class="btn-primary"
                    [disabled]="submitting()"
                  >
                    {{ (submitting() ? 'common.loading' : 'pets.appointment.scheduleButton') | translate }}
                  </button>
                </div>
              </form>
            </div>
          }
        </div>
      } @else {
        <div class="error-container">
          <p class="error-text">{{ 'errors.notFound' | translate }}</p>
          <button class="back-button-full" (click)="goBack()">
            {{ 'common.back' | translate }}
          </button>
        </div>
      }

      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [`
    .schedule-screen {
      min-height: 100vh;
      background: #fafafa;
      padding-bottom: 80px;
    }

    /* Header */
    .header {
      background: #ffffff;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .back-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(184, 227, 225, 0.3);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .back-button svg {
      width: 24px;
      height: 24px;
      color: #4ca8a0;
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0;
    }

    .content {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
    }

    /* Pet Card */
    .pet-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .pet-image-container {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
      background: #f0f0f0;
    }

    .pet-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .pet-image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%);
    }

    .pet-image-placeholder svg {
      width: 40px;
      height: 40px;
      color: #4ca8a0;
      opacity: 0.5;
    }

    .pet-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .pet-name {
      font-size: 18px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0 0 4px 0;
    }

    .pet-breed {
      font-size: 14px;
      color: #666666;
      margin: 0 0 4px 0;
    }

    .pet-ong {
      font-size: 13px;
      color: #4ca8a0;
      margin: 0;
    }

    /* Steps Indicator */
    .steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 32px;
      padding: 0 20px;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e0e0e0;
      color: #999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
    }

    .step.active .step-circle {
      background: #4ca8a0;
      color: #ffffff;
    }

    .step.completed .step-circle {
      background: #4caf50;
      color: #ffffff;
    }

    .step-label {
      font-size: 12px;
      color: #999999;
      text-align: center;
    }

    .step.active .step-label {
      color: #2c2c2c;
      font-weight: 600;
    }

    .step-line {
      width: 40px;
      height: 2px;
      background: #e0e0e0;
      margin: 0 4px;
      margin-bottom: 24px;
    }

    .step-line.completed {
      background: #4caf50;
    }

    /* Step Content */
    .step-content {
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .step-title {
      font-size: 20px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0 0 8px 0;
      text-align: center;
    }

    .step-subtitle {
      font-size: 14px;
      color: #666666;
      margin: 0 0 24px 0;
      text-align: center;
    }

    /* Month Navigation */
    .month-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .nav-button {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #f0f0f0;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .nav-button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .nav-button:not(:disabled):hover {
      background: #e0e0e0;
    }

    .month-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0;
    }

    /* Calendar */
    .calendar {
      margin-bottom: 20px;
    }

    .calendar-header {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .day-name {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #666666;
      padding: 8px 0;
    }

    .calendar-body {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 8px;
    }

    .calendar-day {
      aspect-ratio: 1;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
      font-size: 14px;
      font-weight: 500;
      color: #999999;
      cursor: not-allowed;
      transition: all 0.2s ease;
    }

    .calendar-day.empty {
      border: none;
      background: transparent;
    }

    .calendar-day.available {
      border-color: #b8e3e1;
      background: #ffffff;
      color: #2c2c2c;
      cursor: pointer;
    }

    .calendar-day.available:hover {
      border-color: #4ca8a0;
      background: #e0f2f1;
    }

    .calendar-day.selected {
      border-color: #4ca8a0;
      background: #4ca8a0;
      color: #ffffff;
    }

    /* Slots Grid */
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }

    .slot-button {
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: #ffffff;
      font-size: 15px;
      font-weight: 500;
      color: #2c2c2c;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .slot-button:hover {
      border-color: #4ca8a0;
      background: #e0f2f1;
    }

    .slot-button.selected {
      border-color: #4ca8a0;
      background: #4ca8a0;
      color: #ffffff;
    }

    /* Form */
    .appointment-form {
      margin-top: 24px;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #2c2c2c;
      margin-bottom: 8px;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 15px;
      font-family: inherit;
      background: #fafafa;
      box-sizing: border-box;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 100px;
    }

    /* Step Actions */
    .step-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .btn-primary,
    .btn-secondary {
      flex: 1;
      padding: 14px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #4ca8a0;
      color: #ffffff;
    }

    .btn-primary:disabled {
      background: #cccccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #666666;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .calendar-loading,
    .slots-loading {
      text-align: center;
      padding: 40px 20px;
      color: #666666;
    }

    .no-slots {
      text-align: center;
      padding: 40px 20px;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 40px 20px;
    }

    .loading,
    .error-text {
      font-size: 16px;
      color: #666666;
      text-align: center;
    }

    .back-button-full {
      margin-top: 20px;
      background: #4ca8a0;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 600px) {
      .calendar-body {
        gap: 4px;
      }

      .calendar-day {
        font-size: 12px;
      }

      .slots-grid {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      }
    }
  `]
})
export class ScheduleAppointmentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private appointmentsService = inject(AppointmentsService);
  private schedulingService = inject(SchedulingService);
  private toastService = inject(ToastService);
  private analyticsService = inject(AnalyticsService);
  private translate = inject(TranslateService);

  pet = signal<Pet | null>(null);
  loading = signal(true);
  loadingCalendar = signal(false);
  loadingSlots = signal(false);
  submitting = signal(false);
  errorMessage = signal('');
  primaryImage = signal('');

  currentStep = signal(1);
  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth() + 1);
  availableDates = signal<string[]>([]);
  availableSlots = signal<AvailableSlot[]>([]);
  selectedDate = signal<string | null>(null);
  selectedSlot = signal<string | null>(null);

  formData: AppointmentForm = {
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    notes: ''
  };

  currentMonthName = computed(() => {
    const date = new Date(this.currentYear(), this.currentMonth() - 1, 1);
    return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
  });

  calendarDays = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { dayNumber: number | null; dateStr: string; isAvailable: boolean }[] = [];

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ dayNumber: null, dateStr: '', isAvailable: false });
    }

    // Days of the month
    const available = this.availableDates();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateStr,
        isAvailable: available.includes(dateStr)
      });
    }

    return days;
  });

  ngOnInit() {
    const petId = this.route.snapshot.paramMap.get('id');
    if (petId) {
      this.loadPetInfo(petId);
    }
  }

  loadPetInfo(petId: string) {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/pets/${petId}`).subscribe({
      next: (response) => {
        const petData = response.data || response;
        this.pet.set(petData);

        // Set primary image
        if (petData.images && petData.images.length > 0) {
          const primaryImg = petData.images.find((img: any) => img.isPrimary);
          this.primaryImage.set(primaryImg?.url || petData.images[0].url);
        }

        this.loading.set(false);

        // Load available dates for current month
        this.loadAvailableDates();
      },
      error: (error) => {
        this.toastService.error(this.translate.instant('pets.form.error'));
        this.loading.set(false);
      }
    });
  }

  loadAvailableDates() {
    const pet = this.pet();
    if (!pet) return;

    this.loadingCalendar.set(true);
    this.schedulingService.getAvailableDates(
      pet.ong.id,
      this.currentYear(),
      this.currentMonth()
    ).subscribe({
      next: (response) => {
        this.availableDates.set(response.availableDates);
        this.loadingCalendar.set(false);
      },
      error: (error) => {
        this.toastService.error(this.translate.instant('pets.appointment.error'));
        this.loadingCalendar.set(false);
      }
    });
  }

  selectDate(dateStr: string) {
    this.selectedDate.set(dateStr);
    this.selectedSlot.set(null);
    this.loadAvailableSlots(dateStr);
    this.currentStep.set(2);
  }

  loadAvailableSlots(dateStr: string) {
    const pet = this.pet();
    if (!pet) return;

    this.loadingSlots.set(true);
    this.schedulingService.getAvailableSlots(pet.ong.id, dateStr).subscribe({
      next: (response) => {
        const available = response.slots.filter(s => s.available);
        this.availableSlots.set(available);
        this.loadingSlots.set(false);
      },
      error: (error) => {
        this.toastService.error(this.translate.instant('pets.appointment.error'));
        this.loadingSlots.set(false);
      }
    });
  }

  selectSlot(slotTime: string) {
    this.selectedSlot.set(slotTime);
  }

  nextStep() {
    this.currentStep.set(this.currentStep() + 1);
  }

  backToStep(step: number) {
    this.currentStep.set(step);
  }

  previousMonth() {
    let month = this.currentMonth() - 1;
    let year = this.currentYear();

    if (month < 1) {
      month = 12;
      year--;
    }

    this.currentMonth.set(month);
    this.currentYear.set(year);
    this.loadAvailableDates();
  }

  nextMonth() {
    let month = this.currentMonth() + 1;
    let year = this.currentYear();

    if (month > 12) {
      month = 1;
      year++;
    }

    this.currentMonth.set(month);
    this.currentYear.set(year);
    this.loadAvailableDates();
  }

  canGoPrevious(): boolean {
    const now = new Date();
    const currentMonth = new Date(this.currentYear(), this.currentMonth() - 1);
    return currentMonth > now;
  }

  submitAppointment() {
    const pet = this.pet();
    const slotTime = this.selectedSlot();

    if (!pet || !slotTime || this.submitting()) return;

    this.errorMessage.set('');

    if (!this.formData.visitorName || !this.formData.visitorEmail || !this.formData.visitorPhone) {
      this.errorMessage.set(this.translate.instant('validation.required'));
      return;
    }

    this.submitting.set(true);

    const appointmentData: CreateAppointmentDto = {
      petId: pet.id,
      visitorName: this.formData.visitorName,
      visitorEmail: this.formData.visitorEmail,
      visitorPhone: this.formData.visitorPhone,
      scheduledStartTime: slotTime, // ISO 8601 format
      notes: this.formData.notes
    };

    this.appointmentsService.createAppointment(appointmentData).subscribe({
      next: () => {
        this.submitting.set(false);
        this.toastService.success(this.translate.instant('pets.appointment.success'));

        // Track appointment creation
        this.analyticsService.track(EventType.APPOINTMENT_CREATE, {
          petId: pet.id,
          ongId: pet.ong?.id,
          metadata: {
            scheduledDate: slotTime
          }
        });

        setTimeout(() => {
          this.router.navigate(['/pets', pet.id]);
        }, 2000);
      },
      error: (error) => {
        this.submitting.set(false);
        this.errorMessage.set(this.translate.instant('pets.appointment.error'));
        this.toastService.error(this.errorMessage());
      }
    });
  }

  formatSelectedDate(): string {
    const date = this.selectedDate();
    if (!date) return '';
    // Parse date string (YYYY-MM-DD) as local date
    const [year, month, day] = date.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  formatTime(isoString: string): string {
    // Parse ISO string and format time in local timezone
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  goBack() {
    const pet = this.pet();
    if (pet) {
      this.router.navigate(['/pets', pet.id]);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
