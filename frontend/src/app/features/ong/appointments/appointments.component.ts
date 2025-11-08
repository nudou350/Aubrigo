import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentsService, Appointment } from '../../../core/services/appointments.service';
import { ToastService } from '../../../core/services/toast.service';
import { AnalyticsService, EventType } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-ong-appointments',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="appointments-page">
      <header class="page-header">
        <a routerLink="/ong/dashboard" class="back-link">
          ← Voltar
        </a>
        <div>
          <h1>Visitas Agendadas</h1>
          <p>Gerencie os agendamentos de visitas aos pets</p>
        </div>
      </header>

      <div class="filters">
        <select class="filter-select" [(ngModel)]="filterStatus" (change)="filterAppointments()">
          <option value="">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="confirmed">Confirmadas</option>
          <option value="completed">Concluídas</option>
          <option value="cancelled">Canceladas</option>
        </select>
        <input
          type="text"
          placeholder="🔍 Buscar por nome do visitante..."
          class="search-input"
          [(ngModel)]="searchTerm"
          (input)="filterAppointments()"
        />
      </div>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando agendamentos...</p>
        </div>
      } @else if (filteredAppointments().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>Nenhuma visita agendada</h3>
          <p>{{ appointments().length === 0 ? 'Quando visitantes agendarem visitas, elas aparecerão aqui' : 'Nenhuma visita encontrada com esses filtros' }}</p>
        </div>
      } @else {
        <div class="appointments-list">
          @for (appointment of filteredAppointments(); track appointment.id) {
            <div class="appointment-card" [class]="appointment.status">
              <div class="pet-info">
                <img
                  [src]="getPetImage(appointment.pet)"
                  [alt]="appointment.pet?.name || 'Pet'"
                  class="pet-image"
                  (error)="onImageError($event)"
                />
                <div>
                  <h3>{{ appointment.pet?.name || 'Pet' }}</h3>
                  <span class="pet-species">{{ getSpeciesLabel(appointment.pet?.species || '') }}</span>
                </div>
              </div>

              <div class="appointment-details">
                <div class="detail-row">
                  <span class="label">👤 Visitante:</span>
                  <span class="value">{{ appointment.visitorName }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">📧 Email:</span>
                  <a [href]="'mailto:' + appointment.visitorEmail" class="value link">
                    {{ appointment.visitorEmail }}
                  </a>
                </div>
                @if (appointment.visitorPhone) {
                  <div class="detail-row">
                    <span class="label">📞 Telefone:</span>
                    <a [href]="'tel:' + appointment.visitorPhone" class="value link">
                      {{ appointment.visitorPhone }}
                    </a>
                  </div>
                }
                @if (appointment.scheduledStartTime) {
                  <div class="detail-row">
                    <span class="label">📅 Data/Horário:</span>
                    <span class="value">{{ formatDateTime(appointment.scheduledStartTime) }}</span>
                  </div>
                } @else {
                  <div class="detail-row">
                    <span class="label">📅 Data:</span>
                    <span class="value">{{ appointment.preferredDate ? formatDate(appointment.preferredDate) : 'Não definida' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🕒 Horário:</span>
                    <span class="value">{{ appointment.preferredTime || 'Não definido' }}</span>
                  </div>
                }
                @if (appointment.notes) {
                  <div class="detail-row">
                    <span class="label">💬 Observações:</span>
                    <span class="value">{{ appointment.notes }}</span>
                  </div>
                }
                <div class="detail-row">
                  <span class="label">📊 Status:</span>
                  <span class="status-badge" [class]="appointment.status">
                    {{ getStatusLabel(appointment.status) }}
                  </span>
                </div>
              </div>

              @if (appointment.status === 'pending') {
                <div class="appointment-actions">
                  <button class="btn-action confirm" (click)="updateStatus(appointment.id, 'confirmed')">
                    ✓ Confirmar
                  </button>
                  <button class="btn-action cancel" (click)="updateStatus(appointment.id, 'cancelled')">
                    ✗ Cancelar
                  </button>
                </div>
              } @else if (appointment.status === 'confirmed') {
                <div class="appointment-actions">
                  <button class="btn-action complete" (click)="updateStatus(appointment.id, 'completed')">
                    ✓ Marcar como Concluída
                  </button>
                  <button class="btn-action cancel" (click)="updateStatus(appointment.id, 'cancelled')">
                    ✗ Cancelar
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .appointments-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 24px;
      padding-bottom: 100px;
    }

    .page-header {
      margin-bottom: 32px;

      .back-link {
        color: #5CB5B0;
        text-decoration: none;
        font-weight: 600;
        margin-bottom: 16px;
        display: inline-flex;
        align-items: center;
        gap: 4px;

        &:hover {
          text-decoration: underline;
        }
      }

      h1 {
        font-size: 32px;
        color: #2C2C2C;
        margin: 0 0 8px 0;
      }

      p {
        color: #666;
        margin: 0;
      }
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 250px;
      padding: 12px 16px;
      border: 2px solid #E0E0E0;
      border-radius: 8px;
      font-size: 16px;

      &:focus {
        outline: none;
        border-color: #5CB5B0;
      }
    }

    .filter-select {
      padding: 12px 16px;
      border: 2px solid #E0E0E0;
      border-radius: 8px;
      font-size: 16px;
      background: white;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: #5CB5B0;
      }
    }

    .loading {
      text-align: center;
      padding: 80px 20px;

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #B8E3E1;
        border-top-color: #5CB5B0;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;

      .empty-icon {
        font-size: 80px;
        margin-bottom: 24px;
        opacity: 0.3;
      }

      h3 {
        font-size: 24px;
        color: #2C2C2C;
        margin: 0 0 12px 0;
      }

      p {
        color: #666;
        margin: 0;
      }
    }

    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .appointment-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border-left: 4px solid #E0E0E0;
      transition: all 0.2s;

      &:hover {
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }

      &.pending {
        border-left-color: #F5A623;
      }

      &.confirmed {
        border-left-color: #5CB5B0;
      }

      &.completed {
        border-left-color: #27AE60;
      }

      &.cancelled {
        border-left-color: #E74C3C;
        opacity: 0.7;
      }
    }

    .pet-info {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #E0E0E0;

      .pet-image {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        object-fit: cover;
      }

      h3 {
        font-size: 20px;
        color: #2C2C2C;
        margin: 0 0 4px 0;
      }

      .pet-species {
        background: #B8E3E1;
        color: #2C2C2C;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
      }
    }

    .appointment-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .detail-row {
      display: flex;
      gap: 8px;

      .label {
        font-weight: 600;
        color: #666;
        min-width: 110px;
      }

      .value {
        color: #2C2C2C;
        flex: 1;

        &.link {
          color: #5CB5B0;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;

        &.pending {
          background: #FFF3E0;
          color: #F5A623;
        }

        &.confirmed {
          background: #E8F5E9;
          color: #27AE60;
        }

        &.completed {
          background: #E3F2FD;
          color: #1976D2;
        }

        &.cancelled {
          background: #FFEBEE;
          color: #E74C3C;
        }
      }
    }

    .appointment-actions {
      display: flex;
      gap: 12px;
      padding-top: 20px;
      border-top: 1px solid #E0E0E0;

      .btn-action {
        flex: 1;
        padding: 12px;
        border-radius: 8px;
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &.confirm {
          background: #27AE60;
          color: white;

          &:hover {
            background: #229954;
          }
        }

        &.complete {
          background: #1976D2;
          color: white;

          &:hover {
            background: #1565C0;
          }
        }

        &.cancel {
          background: #FFEBEE;
          color: #E74C3C;

          &:hover {
            background: #E74C3C;
            color: white;
          }
        }
      }
    }

    @media (max-width: 768px) {
      .appointments-page {
        padding: 24px 16px;
      }

      .filters {
        flex-direction: column;

        .search-input, .filter-select {
          width: 100%;
        }
      }

      .appointment-details {
        grid-template-columns: 1fr;
      }

      .appointment-actions {
        flex-direction: column;
      }
    }
  `]
})
export class OngAppointmentsComponent implements OnInit {
  private appointmentsService = inject(AppointmentsService);
  private toastService = inject(ToastService);
  private analytics = inject(AnalyticsService);

  isLoading = signal(true);
  appointments = signal<Appointment[]>([]);
  filteredAppointments = signal<Appointment[]>([]);

  searchTerm = '';
  filterStatus = '';

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    this.isLoading.set(true);
    this.appointmentsService.getOngAppointments().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.filteredAppointments.set(appointments);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastService.error('Erro ao carregar agendamentos');
        this.isLoading.set(false);
      }
    });
  }

  filterAppointments() {
    let filtered = this.appointments();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(apt =>
        apt.visitorName.toLowerCase().includes(term) ||
        apt.visitorEmail.toLowerCase().includes(term) ||
        apt.pet?.name?.toLowerCase().includes(term)
      );
    }

    if (this.filterStatus) {
      filtered = filtered.filter(apt => apt.status === this.filterStatus);
    }

    this.filteredAppointments.set(filtered);
  }

  updateStatus(id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') {
    const messages: Record<string, string> = {
      confirmed: 'Confirmar esta visita?',
      cancelled: 'Cancelar esta visita?',
      completed: 'Marcar esta visita como concluída?'
    };

    const successMessages: Record<string, string> = {
      confirmed: 'Visita confirmada com sucesso!',
      cancelled: 'Visita cancelada',
      completed: 'Visita marcada como concluída!'
    };

    if (!confirm(messages[status])) {
      return;
    }

    this.appointmentsService.updateAppointmentStatus(id, status).subscribe({
      next: () => {
        const appointment = this.appointments().find(apt => apt.id === id);

        this.appointments.update(list =>
          list.map(apt => apt.id === id ? { ...apt, status } : apt)
        );
        this.filterAppointments();
        this.toastService.success(successMessages[status]);

        // Track appointment cancellation
        if (status === 'cancelled' && appointment) {
          this.analytics.track(EventType.APPOINTMENT_CANCEL, {
            petId: appointment.petId,
            ongId: appointment.ongId,
            metadata: {
              appointmentId: appointment.id,
              cancelledAt: new Date().toISOString()
            }
          });
        }
      },
      error: (error) => {
        this.toastService.error('Erro ao atualizar status da visita');
      }
    });
  }

  getPetImage(pet: any): string {
    const primaryImage = pet.images?.find((img: any) => img.isPrimary);
    return primaryImage?.imageUrl || pet.images?.[0]?.imageUrl || '/assets/images/placeholder-pet.jpg';
  }

  onImageError(event: any) {
    event.target.src = '/assets/images/placeholder-pet.jpg';
  }

  getSpeciesLabel(species: string): string {
    const labels: any = {
      dog: 'Cachorro',
      cat: 'Gato',
      fish: 'Peixe',
      hamster: 'Hamster'
    };
    return labels[species] || species;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      pending: 'Pendente',
      confirmed: 'Confirmada',
      completed: 'Concluída',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  formatDateTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
