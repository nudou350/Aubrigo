import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SchedulingService, OngOperatingHours, AppointmentSettings } from '../../../core/services/scheduling.service';
import { ToastService } from '../../../core/services/toast.service';
import { OngService } from '../../../core/services/ong.service';

interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  hasLunchBreak: boolean;
}

@Component({
  selector: 'app-scheduling-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="scheduling-settings">
      <!-- Header -->
      <div class="header">
        <button class="back-button" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 class="title">{{ 'ong.schedulingSettings.title' | translate }}</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading">{{ 'ong.common.loading' | translate }}</div>
        </div>
      } @else {
        <div class="content">
          <!-- Operating Hours Section -->
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">{{ 'ong.schedulingSettings.operatingHours.title' | translate }}</h2>
              <p class="section-subtitle">{{ 'ong.schedulingSettings.operatingHours.subtitle' | translate }}</p>
            </div>

            <div class="days-list">
              @for (day of weekDays(); track day.dayOfWeek) {
                <div class="day-card" [class.closed]="!day.isOpen">
                  <div class="day-header">
                    <div class="day-info">
                      <label class="day-toggle">
                        <input
                          type="checkbox"
                          [(ngModel)]="day.isOpen"
                          (change)="onDayToggle(day)"
                        />
                        <span class="toggle-slider"></span>
                      </label>
                      <h3 class="day-name">{{ day.dayName }}</h3>
                      @if (!day.isOpen) {
                        <span class="closed-badge">{{ 'ong.schedulingSettings.operatingHours.closed' | translate }}</span>
                      }
                    </div>
                  </div>

                  @if (day.isOpen) {
                    <div class="day-times">
                      <div class="time-row">
                        <div class="time-group">
                          <label>{{ 'ong.schedulingSettings.operatingHours.opening' | translate }}</label>
                          <input
                            type="time"
                            [(ngModel)]="day.openTime"
                          />
                        </div>
                        <div class="time-group">
                          <label>{{ 'ong.schedulingSettings.operatingHours.closing' | translate }}</label>
                          <input
                            type="time"
                            [(ngModel)]="day.closeTime"
                          />
                        </div>
                      </div>

                      <label class="lunch-toggle">
                        <input
                          type="checkbox"
                          [(ngModel)]="day.hasLunchBreak"
                        />
                        <span>{{ 'ong.schedulingSettings.operatingHours.lunchBreak' | translate }}</span>
                      </label>

                      @if (day.hasLunchBreak) {
                        <div class="time-row">
                          <div class="time-group">
                            <label>{{ 'ong.schedulingSettings.operatingHours.lunchStart' | translate }}</label>
                            <input
                              type="time"
                              [(ngModel)]="day.lunchBreakStart"
                            />
                          </div>
                          <div class="time-group">
                            <label>{{ 'ong.schedulingSettings.operatingHours.lunchEnd' | translate }}</label>
                            <input
                              type="time"
                              [(ngModel)]="day.lunchBreakEnd"
                            />
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Appointment Settings Section -->
          <div class="section">
            <div class="section-header">
              <h2 class="section-title">{{ 'ong.schedulingSettings.visitSettings.title' | translate }}</h2>
              <p class="section-subtitle">{{ 'ong.schedulingSettings.visitSettings.subtitle' | translate }}</p>
            </div>

            <!-- Allow Appointments Toggle -->
            <div class="allow-appointments-toggle">
              <div class="toggle-content">
                <div class="toggle-info">
                  <h3>{{ 'ong.schedulingSettings.visitSettings.allowAppointments' | translate }}</h3>
                  <p>{{ 'ong.schedulingSettings.visitSettings.allowAppointmentsDesc' | translate }}</p>
                </div>
                <label class="main-toggle">
                  <input
                    type="checkbox"
                    [(ngModel)]="allowAppointments"
                    [checked]="allowAppointments()"
                    (change)="allowAppointments.set($any($event.target).checked)"
                  />
                  <span class="main-toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="settings-grid">
              <div class="form-group">
                <label>{{ 'ong.schedulingSettings.visitSettings.visitDuration' | translate }}</label>
                <input
                  type="number"
                  [(ngModel)]="appointmentSettings.visitDurationMinutes"
                  min="15"
                  step="15"
                />
                <p class="hint">{{ 'ong.schedulingSettings.visitSettings.visitDurationHint' | translate }}</p>
              </div>

              <div class="form-group">
                <label>{{ 'ong.schedulingSettings.visitSettings.concurrentVisits' | translate }}</label>
                <input
                  type="number"
                  [(ngModel)]="appointmentSettings.maxConcurrentVisits"
                  min="1"
                  max="10"
                />
                <p class="hint">{{ 'ong.schedulingSettings.visitSettings.concurrentVisitsHint' | translate }}</p>
              </div>

              <div class="form-group">
                <label>{{ 'ong.schedulingSettings.visitSettings.minAdvance' | translate }}</label>
                <input
                  type="number"
                  [(ngModel)]="appointmentSettings.minAdvanceBookingHours"
                  min="0"
                  max="168"
                />
                <p class="hint">{{ 'ong.schedulingSettings.visitSettings.minAdvanceHint' | translate }}</p>
              </div>

              <div class="form-group">
                <label>{{ 'ong.schedulingSettings.visitSettings.maxAdvance' | translate }}</label>
                <input
                  type="number"
                  [(ngModel)]="appointmentSettings.maxAdvanceBookingDays"
                  min="1"
                  max="365"
                />
                <p class="hint">{{ 'ong.schedulingSettings.visitSettings.maxAdvanceHint' | translate }}</p>
              </div>

              <div class="form-group">
                <label>{{ 'ong.schedulingSettings.visitSettings.slotInterval' | translate }}</label>
                <input
                  type="number"
                  [(ngModel)]="appointmentSettings.slotIntervalMinutes"
                  min="15"
                  step="15"
                />
                <p class="hint">{{ 'ong.schedulingSettings.visitSettings.slotIntervalHint' | translate }}</p>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    [(ngModel)]="appointmentSettings.allowWeekendBookings"
                  />
                  <span>{{ 'ong.schedulingSettings.visitSettings.allowWeekends' | translate }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="error-message">
              {{ errorMessage() }}
            </div>
          }

          <!-- Action Buttons -->
          <div class="actions">
            <button
              type="button"
              class="btn-secondary"
              (click)="goBack()"
              [disabled]="saving()"
            >
              {{ 'ong.common.cancel' | translate }}
            </button>
            <button
              type="button"
              class="btn-primary"
              (click)="saveAll()"
              [disabled]="saving()"
            >
              {{ saving() ? ('ong.common.saving' | translate) : ('ong.schedulingSettings.saveSettings' | translate) }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .scheduling-settings {
      min-height: 100vh;
      background: #fafafa;
      padding-bottom: 40px;
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
      transition: all 0.2s ease;
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

    /* Loading */
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 60px 20px;
    }

    .loading {
      font-size: 16px;
      color: #666666;
    }

    /* Content */
    .content {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Section */
    .section {
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .section-header {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0 0 8px 0;
    }

    .section-subtitle {
      font-size: 14px;
      color: #666666;
      margin: 0;
    }

    /* Allow Appointments Toggle */
    .allow-appointments-toggle {
      background: linear-gradient(135deg, #B8E3E1 0%, #5CB5B0 100%);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .toggle-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }

    .toggle-info h3 {
      font-size: 18px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0 0 6px 0;
    }

    .toggle-info p {
      font-size: 13px;
      color: #444;
      margin: 0;
      line-height: 1.4;
    }

    /* Main Toggle Switch (larger) */
    .main-toggle {
      position: relative;
      display: inline-block;
      width: 60px;
      height: 32px;
      flex-shrink: 0;
    }

    .main-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .main-toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.5);
      transition: 0.3s;
      border-radius: 32px;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .main-toggle-slider:before {
      position: absolute;
      content: "";
      height: 24px;
      width: 24px;
      left: 3px;
      bottom: 2px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    input:checked + .main-toggle-slider {
      background-color: #2C2C2C;
      border-color: #2C2C2C;
    }

    input:checked + .main-toggle-slider:before {
      transform: translateX(28px);
    }

    /* Days List */
    .days-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .day-card {
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .day-card.closed {
      background: #fafafa;
      border-color: #f0f0f0;
    }

    .day-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .day-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .day-name {
      font-size: 16px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0;
    }

    .closed-badge {
      font-size: 12px;
      color: #999999;
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
    }

    /* Toggle Switch */
    .day-toggle {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;
    }

    .day-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.3s;
      border-radius: 24px;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .toggle-slider {
      background-color: #4ca8a0;
    }

    input:checked + .toggle-slider:before {
      transform: translateX(24px);
    }

    /* Day Times */
    .day-times {
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }

    .time-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .time-group {
      display: flex;
      flex-direction: column;
    }

    .time-group label {
      font-size: 13px;
      font-weight: 500;
      color: #666666;
      margin-bottom: 6px;
    }

    .time-group input[type="time"] {
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      background: #fafafa;
    }

    .lunch-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #2c2c2c;
      margin-bottom: 12px;
      cursor: pointer;
    }

    .lunch-toggle input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    /* Settings Grid */
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 500;
      color: #2c2c2c;
      margin-bottom: 8px;
    }

    .form-group input[type="number"] {
      padding: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-size: 15px;
      background: #fafafa;
    }

    .hint {
      font-size: 12px;
      color: #999999;
      margin: 4px 0 0 0;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      margin-top: 8px;
    }

    .checkbox-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    /* Error */
    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }

    /* Actions */
    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn-secondary,
    .btn-primary {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-secondary {
      background: #f0f0f0;
      color: #666666;
    }

    .btn-primary {
      background: #4ca8a0;
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background: #3d9690;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 168, 160, 0.3);
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .settings-grid {
        grid-template-columns: 1fr;
      }

      .actions {
        flex-direction: column;
      }

      .btn-secondary,
      .btn-primary {
        width: 100%;
      }
    }
  `]
})
export class SchedulingSettingsComponent implements OnInit {
  private schedulingService = inject(SchedulingService);
  private ongService = inject(OngService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');

  weekDays = signal<DaySchedule[]>([]);

  allowAppointments = signal(true);

  appointmentSettings = {
    visitDurationMinutes: 60,
    maxConcurrentVisits: 2,
    minAdvanceBookingHours: 24,
    maxAdvanceBookingDays: 30,
    slotIntervalMinutes: 30,
    allowWeekendBookings: true,
  };

  ngOnInit() {
    this.initializeWeekDays();
    this.loadExistingSettings();
  }

  initializeWeekDays() {
    this.weekDays.set([
      { dayOfWeek: 0, dayName: this.translate.instant('ong.schedulingSettings.days.sunday'), isOpen: false, openTime: '09:00', closeTime: '17:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00', hasLunchBreak: false },
      { dayOfWeek: 1, dayName: this.translate.instant('ong.schedulingSettings.days.monday'), isOpen: true, openTime: '09:00', closeTime: '17:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00', hasLunchBreak: true },
      { dayOfWeek: 2, dayName: this.translate.instant('ong.schedulingSettings.days.tuesday'), isOpen: true, openTime: '09:00', closeTime: '17:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00', hasLunchBreak: true },
      { dayOfWeek: 3, dayName: this.translate.instant('ong.schedulingSettings.days.wednesday'), isOpen: true, openTime: '09:00', closeTime: '17:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00', hasLunchBreak: true },
      { dayOfWeek: 4, dayName: this.translate.instant('ong.schedulingSettings.days.thursday'), isOpen: true, openTime: '09:00', closeTime: '17:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00', hasLunchBreak: true },
      { dayOfWeek: 5, dayName: this.translate.instant('ong.schedulingSettings.days.friday'), isOpen: true, openTime: '09:00', closeTime: '17:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00', hasLunchBreak: true },
      { dayOfWeek: 6, dayName: this.translate.instant('ong.schedulingSettings.days.saturday'), isOpen: false, openTime: '09:00', closeTime: '17:00', lunchBreakStart: '12:00', lunchBreakEnd: '13:00', hasLunchBreak: false },
    ]);
  }

  loadExistingSettings() {
    this.loading.set(true);

    // Load operating hours, settings, and ONG profile in parallel
    Promise.all([
      this.schedulingService.getMyOperatingHours().toPromise(),
      this.schedulingService.getMyAppointmentSettings().toPromise(),
      this.ongService.getOngProfile().toPromise()
    ]).then(([hours, settings, profile]) => {
      // Apply loaded operating hours to weekDays
      if (hours && hours.length > 0) {
        const days = this.weekDays();
        hours.forEach((hour) => {
          const day = days.find(d => d.dayOfWeek === hour.dayOfWeek);
          if (day) {
            day.isOpen = hour.isOpen;
            day.openTime = hour.openTime;
            day.closeTime = hour.closeTime;
            day.lunchBreakStart = hour.lunchBreakStart || '12:00';
            day.lunchBreakEnd = hour.lunchBreakEnd || '13:00';
            day.hasLunchBreak = !!(hour.lunchBreakStart && hour.lunchBreakEnd);
          }
        });
        this.weekDays.set([...days]);
      }

      // Apply loaded appointment settings
      if (settings) {
        this.appointmentSettings = { ...settings };
      }

      // Apply allowAppointments from profile
      if (profile) {
        this.allowAppointments.set(profile.allowAppointments ?? true);
      }

      this.loading.set(false);
    }).catch((error) => {
      // If settings don't exist yet, that's okay - use defaults
      this.loading.set(false);
    });
  }

  onDayToggle(day: DaySchedule) {
    // Just reactive update - handled by ngModel
  }

  saveAll() {
    this.errorMessage.set('');
    this.saving.set(true);

    // Prepare operating hours payload
    const operatingHoursPayload = this.weekDays().map(day => ({
      dayOfWeek: day.dayOfWeek,
      isOpen: day.isOpen,
      openTime: day.openTime,
      closeTime: day.closeTime,
      lunchBreakStart: day.hasLunchBreak ? day.lunchBreakStart : undefined,
      lunchBreakEnd: day.hasLunchBreak ? day.lunchBreakEnd : undefined,
    }));

    // Prepare appointment settings payload (only allowed fields)
    const appointmentSettingsPayload = {
      visitDurationMinutes: this.appointmentSettings.visitDurationMinutes,
      maxConcurrentVisits: this.appointmentSettings.maxConcurrentVisits,
      minAdvanceBookingHours: this.appointmentSettings.minAdvanceBookingHours,
      maxAdvanceBookingDays: this.appointmentSettings.maxAdvanceBookingDays,
      slotIntervalMinutes: this.appointmentSettings.slotIntervalMinutes,
      allowWeekendBookings: this.appointmentSettings.allowWeekendBookings,
    };

    // Save operating hours, appointment settings, and allowAppointments
    Promise.all([
      this.schedulingService.bulkUpdateOperatingHours({ operatingHours: operatingHoursPayload }).toPromise(),
      this.schedulingService.updateAppointmentSettings(appointmentSettingsPayload).toPromise(),
      this.ongService.updateOngProfile({ allowAppointments: this.allowAppointments() }).toPromise()
    ]).then(() => {
      this.toastService.success(this.translate.instant('ong.schedulingSettings.saveSuccess'));
      this.saving.set(false);
      setTimeout(() => {
        this.router.navigate(['/ong/dashboard']);
      }, 1500);
    }).catch((error) => {
      this.errorMessage.set(error.error?.message || this.translate.instant('ong.schedulingSettings.saveError'));
      this.toastService.error(this.errorMessage());
      this.saving.set(false);
    });
  }

  goBack() {
    this.router.navigate(['/ong/dashboard']);
  }
}
