import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  images: Array<{ url: string; isPrimary: boolean }>;
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
  preferredDate: string;
  preferredTime: string;
  notes: string;
}

@Component({
  selector: 'app-schedule-appointment',
  standalone: true,
  imports: [CommonModule, FormsModule, BottomNavComponent],
  template: `
    <div class="schedule-screen">
      <!-- Header -->
      <div class="header">
        <button class="back-button" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 class="title">Agendar Visita</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading">Carregando...</div>
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

          <!-- Appointment Form -->
          <form class="appointment-form" (ngSubmit)="submitAppointment()">
            <h3 class="form-title">Seus Dados</h3>

            <div class="form-group">
              <label for="visitorName">Nome Completo *</label>
              <input
                type="text"
                id="visitorName"
                name="visitorName"
                [(ngModel)]="formData.visitorName"
                placeholder="Digite seu nome"
                required
              />
            </div>

            <div class="form-group">
              <label for="visitorEmail">Email *</label>
              <input
                type="email"
                id="visitorEmail"
                name="visitorEmail"
                [(ngModel)]="formData.visitorEmail"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="visitorPhone">Telefone *</label>
              <input
                type="tel"
                id="visitorPhone"
                name="visitorPhone"
                [(ngModel)]="formData.visitorPhone"
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            <h3 class="form-title">Data e Horário Preferencial</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="preferredDate">Data *</label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  [(ngModel)]="formData.preferredDate"
                  [min]="minDate"
                  required
                />
              </div>

              <div class="form-group">
                <label for="preferredTime">Horário *</label>
                <input
                  type="time"
                  id="preferredTime"
                  name="preferredTime"
                  [(ngModel)]="formData.preferredTime"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label for="notes">Observações (Opcional)</label>
              <textarea
                id="notes"
                name="notes"
                [(ngModel)]="formData.notes"
                placeholder="Alguma informação adicional que gostaria de compartilhar..."
                rows="4"
              ></textarea>
            </div>

            @if (errorMessage()) {
              <div class="error-message">
                {{ errorMessage() }}
              </div>
            }

            <button
              type="submit"
              class="submit-button"
              [disabled]="submitting()"
            >
              {{ submitting() ? 'Enviando...' : 'CONFIRMAR AGENDAMENTO' }}
            </button>
          </form>
        </div>
      } @else {
        <div class="error-container">
          <p class="error-text">Pet não encontrado</p>
          <button class="back-button-full" (click)="goBack()">
            Voltar
          </button>
        </div>
      }

      <!-- Bottom Navigation -->
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
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .back-button svg {
      width: 24px;
      height: 24px;
      color: #4ca8a0;
    }

    .back-button:hover {
      background: rgba(184, 227, 225, 0.5);
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0;
    }

    /* Loading & Error States */
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

    /* Content */
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

    /* Form */
    .appointment-form {
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .form-title {
      font-size: 16px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0 0 16px 0;
    }

    .form-title:not(:first-child) {
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
      transition: all 0.2s ease;
      box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #4ca8a0;
      background: #ffffff;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    /* Submit Button */
    .submit-button {
      width: 100%;
      background: #4ca8a0;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      padding: 16px;
      font-size: 16px;
      font-weight: 600;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 8px;
    }

    .submit-button:hover:not(:disabled) {
      background: #3d9690;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(76, 168, 160, 0.3);
    }

    .submit-button:disabled {
      background: #cccccc;
      cursor: not-allowed;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ScheduleAppointmentComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);

  pet = signal<Pet | null>(null);
  loading = signal(true);
  submitting = signal(false);
  errorMessage = signal('');
  primaryImage = signal('');
  minDate = this.getMinDate();

  formData: AppointmentForm = {
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    preferredDate: '',
    preferredTime: '',
    notes: ''
  };

  ngOnInit() {
    const petId = this.route.snapshot.paramMap.get('id');
    if (petId) {
      this.loadPetInfo(petId);
    }
  }

  loadPetInfo(petId: string) {
    this.loading.set(true);
    this.http.get<any>(`http://localhost:3002/api/pets/${petId}`).subscribe({
      next: (response) => {
        const petData = response.data || response;
        this.pet.set(petData);

        // Set primary image
        if (petData.images && petData.images.length > 0) {
          const primaryImg = petData.images.find((img: any) => img.isPrimary);
          this.primaryImage.set(primaryImg?.url || petData.images[0].url);
        }

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading pet:', error);
        this.loading.set(false);
        this.pet.set(null);
      }
    });
  }

  submitAppointment() {
    const pet = this.pet();
    if (!pet || this.submitting()) return;

    // Reset error
    this.errorMessage.set('');

    // Validate form
    if (!this.formData.visitorName || !this.formData.visitorEmail ||
        !this.formData.visitorPhone || !this.formData.preferredDate ||
        !this.formData.preferredTime) {
      this.errorMessage.set('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    this.submitting.set(true);

    const appointmentData = {
      petId: pet.id,
      visitorName: this.formData.visitorName,
      visitorEmail: this.formData.visitorEmail,
      visitorPhone: this.formData.visitorPhone,
      preferredDate: this.formData.preferredDate,
      preferredTime: this.formData.preferredTime,
      notes: this.formData.notes
    };

    this.http.post('http://localhost:3002/api/appointments', appointmentData).subscribe({
      next: (response) => {
        this.submitting.set(false);
        // Show success message and navigate back
        alert('Agendamento realizado com sucesso! A ONG entrará em contato em breve.');
        this.router.navigate(['/pets', pet.id]);
      },
      error: (error) => {
        console.error('Error scheduling appointment:', error);
        this.submitting.set(false);
        this.errorMessage.set(
          error.error?.message || 'Erro ao agendar visita. Por favor, tente novamente.'
        );
      }
    });
  }

  goBack() {
    const pet = this.pet();
    if (pet) {
      this.router.navigate(['/pets', pet.id]);
    } else {
      this.router.navigate(['/home']);
    }
  }

  private getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
}
