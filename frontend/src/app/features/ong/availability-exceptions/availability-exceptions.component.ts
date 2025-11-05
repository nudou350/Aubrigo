import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SchedulingService, AvailabilityException } from '../../../core/services/scheduling.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-availability-exceptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="exceptions-screen">
      <!-- Header -->
      <div class="header">
        <button class="back-button" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <h1 class="title">Bloqueios e Férias</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="loading">Carregando...</div>
        </div>
      } @else {
        <div class="content">
          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="btn-primary" (click)="showAddModal()">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Adicionar Bloqueio
            </button>
            <button class="btn-secondary" (click)="createHolidays()">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              Auto-criar Feriados 2025
            </button>
            <button class="btn-outline" (click)="cleanupExpired()">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              Limpar Expirados
            </button>
          </div>

          <!-- Active Exceptions List -->
          <div class="section">
            <h2 class="section-title">Bloqueios Ativos</h2>

            @if (exceptions().length === 0) {
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                </svg>
                <p>Nenhum bloqueio configurado</p>
                <p class="hint">Adicione bloqueios para férias, feriados ou manutenção</p>
              </div>
            } @else {
              <div class="exceptions-list">
                @for (exception of exceptions(); track exception.id) {
                  <div class="exception-card" [class.blocked]="exception.exceptionType === 'blocked'">
                    <div class="exception-header">
                      <div class="exception-icon">
                        @if (exception.exceptionType === 'blocked') {
                          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/>
                          </svg>
                        } @else {
                          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                          </svg>
                        }
                      </div>
                      <div class="exception-info">
                        <h3 class="exception-reason">{{ exception.reason }}</h3>
                        <p class="exception-type">
                          {{ exception.exceptionType === 'blocked' ? 'Bloqueado' : 'Disponível' }}
                        </p>
                      </div>
                      <button class="btn-delete" (click)="deleteException(exception.id)" title="Remover">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                      </button>
                    </div>
                    <div class="exception-dates">
                      <div class="date-range">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                        </svg>
                        <span>{{ formatDate(exception.startDate) }} - {{ formatDate(exception.endDate) }}</span>
                      </div>
                      @if (exception.startTime && exception.endTime) {
                        <div class="time-range">
                          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                          </svg>
                          <span>{{ exception.startTime }} - {{ exception.endTime }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Add Exception Modal -->
          @if (showModal()) {
            <div class="modal-overlay" (click)="closeModal()">
              <div class="modal" (click)="$event.stopPropagation()">
                <div class="modal-header">
                  <h2>Adicionar Bloqueio</h2>
                  <button class="close-button" (click)="closeModal()">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                  </button>
                </div>

                <form class="modal-form" (ngSubmit)="submitException()">
                  <div class="form-group">
                    <label>Motivo *</label>
                    <input
                      type="text"
                      [(ngModel)]="newException.reason"
                      name="reason"
                      placeholder="Ex: Férias, Feriado, Manutenção"
                      required
                    />
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Data Início *</label>
                      <input
                        type="date"
                        [(ngModel)]="newException.startDate"
                        name="startDate"
                        required
                      />
                    </div>
                    <div class="form-group">
                      <label>Data Fim *</label>
                      <input
                        type="date"
                        [(ngModel)]="newException.endDate"
                        name="endDate"
                        required
                      />
                    </div>
                  </div>

                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      [(ngModel)]="newException.partialDay"
                      name="partialDay"
                    />
                    <span>Bloquear apenas parte do dia</span>
                  </label>

                  @if (newException.partialDay) {
                    <div class="form-row">
                      <div class="form-group">
                        <label>Hora Início</label>
                        <input
                          type="time"
                          [(ngModel)]="newException.startTime"
                          name="startTime"
                        />
                      </div>
                      <div class="form-group">
                        <label>Hora Fim</label>
                        <input
                          type="time"
                          [(ngModel)]="newException.endTime"
                          name="endTime"
                        />
                      </div>
                    </div>
                  }

                  @if (modalError()) {
                    <div class="error-message">
                      {{ modalError() }}
                    </div>
                  }

                  <div class="modal-actions">
                    <button type="button" class="btn-secondary" (click)="closeModal()">
                      Cancelar
                    </button>
                    <button type="submit" class="btn-primary" [disabled]="submitting()">
                      {{ submitting() ? 'Salvando...' : 'Salvar Bloqueio' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .exceptions-screen {
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

    /* Content */
    .content {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .btn-primary,
    .btn-secondary,
    .btn-outline {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-primary {
      background: #4ca8a0;
      color: #ffffff;
    }

    .btn-secondary {
      background: #5c6bc0;
      color: #ffffff;
    }

    .btn-outline {
      background: #ffffff;
      color: #666666;
      border: 2px solid #e0e0e0;
    }

    /* Section */
    .section {
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0 0 20px 0;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #999999;
    }

    .empty-state svg {
      color: #cccccc;
      margin-bottom: 16px;
    }

    .empty-state p {
      font-size: 16px;
      margin: 8px 0;
    }

    .empty-state .hint {
      font-size: 14px;
      color: #cccccc;
    }

    /* Exceptions List */
    .exceptions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .exception-card {
      border: 2px solid #e3f2fd;
      border-radius: 8px;
      padding: 16px;
      background: #f5f9ff;
      transition: all 0.2s ease;
    }

    .exception-card.blocked {
      border-color: #ffebee;
      background: #fff5f5;
    }

    .exception-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
    }

    .exception-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .exception-card.blocked .exception-icon {
      color: #e74c3c;
    }

    .exception-info {
      flex: 1;
    }

    .exception-reason {
      font-size: 16px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0 0 4px 0;
    }

    .exception-type {
      font-size: 13px;
      color: #666666;
      margin: 0;
    }

    .btn-delete {
      width: 36px;
      height: 36px;
      border-radius: 6px;
      background: rgba(231, 76, 60, 0.1);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #e74c3c;
    }

    .exception-dates {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-left: 52px;
    }

    .date-range,
    .time-range {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666666;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal {
      background: #ffffff;
      border-radius: 12px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: #2c2c2c;
      margin: 0;
    }

    .close-button {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #f0f0f0;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .modal-form {
      padding: 20px;
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

    .form-group input {
      width: 100%;
      padding: 10px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-size: 15px;
      background: #fafafa;
      box-sizing: border-box;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      cursor: pointer;
    }

    .checkbox-label input {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 60px 20px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .quick-actions {
        flex-direction: column;
      }

      .btn-primary,
      .btn-secondary,
      .btn-outline {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class AvailabilityExceptionsComponent implements OnInit {
  private schedulingService = inject(SchedulingService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  loading = signal(true);
  submitting = signal(false);
  showModal = signal(false);
  modalError = signal('');
  exceptions = signal<AvailabilityException[]>([]);

  newException = {
    reason: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    partialDay: false,
  };

  ngOnInit() {
    this.loadExceptions();
  }

  loadExceptions() {
    this.loading.set(true);
    this.schedulingService.getMyActiveExceptions().subscribe({
      next: (data) => {
        this.exceptions.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading exceptions:', error);
        this.toastService.error('Erro ao carregar bloqueios');
        this.loading.set(false);
      }
    });
  }

  showAddModal() {
    this.newException = {
      reason: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      partialDay: false,
    };
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  submitException() {
    this.modalError.set('');

    if (!this.newException.reason || !this.newException.startDate || !this.newException.endDate) {
      this.modalError.set('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    this.submitting.set(true);

    const payload = {
      exceptionType: 'blocked' as const,
      reason: this.newException.reason,
      startDate: this.newException.startDate,
      endDate: this.newException.endDate,
      startTime: this.newException.partialDay ? this.newException.startTime : undefined,
      endTime: this.newException.partialDay ? this.newException.endTime : undefined,
    };

    this.schedulingService.createException(payload).subscribe({
      next: () => {
        this.toastService.success('Bloqueio criado com sucesso!');
        this.submitting.set(false);
        this.closeModal();
        this.loadExceptions();
      },
      error: (error) => {
        console.error('Error creating exception:', error);
        this.modalError.set(error.error?.message || 'Erro ao criar bloqueio');
        this.submitting.set(false);
      }
    });
  }

  deleteException(id: string) {
    if (!confirm('Tem certeza que deseja remover este bloqueio?')) {
      return;
    }

    this.schedulingService.deleteException(id).subscribe({
      next: () => {
        this.toastService.success('Bloqueio removido com sucesso!');
        this.loadExceptions();
      },
      error: (error) => {
        console.error('Error deleting exception:', error);
        this.toastService.error('Erro ao remover bloqueio');
      }
    });
  }

  createHolidays() {
    if (!confirm('Deseja criar automaticamente todos os feriados nacionais de 2025?')) {
      return;
    }

    this.schedulingService.createHolidays(2025).subscribe({
      next: (response) => {
        this.toastService.success(`${response.created} feriados criados com sucesso!`);
        this.loadExceptions();
      },
      error: (error) => {
        console.error('Error creating holidays:', error);
        this.toastService.error(error.error?.message || 'Erro ao criar feriados');
      }
    });
  }

  cleanupExpired() {
    if (!confirm('Deseja remover todos os bloqueios expirados?')) {
      return;
    }

    this.schedulingService.cleanupExpiredExceptions().subscribe({
      next: (response) => {
        this.toastService.success(`${response.deleted} bloqueios expirados removidos!`);
        this.loadExceptions();
      },
      error: (error) => {
        console.error('Error cleaning up:', error);
        this.toastService.error('Erro ao limpar bloqueios expirados');
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  goBack() {
    this.router.navigate(['/ong/dashboard']);
  }
}
