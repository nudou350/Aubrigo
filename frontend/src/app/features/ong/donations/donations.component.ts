import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OngService, Donation, DonationStatistics } from '../../../core/services/ong.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-ong-donations',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="donations-page">
      <header class="page-header">
        <a routerLink="/ong/dashboard" class="back-link">
          ← Voltar
        </a>
        <div>
          <h1>Doações Recebidas</h1>
          <p>Acompanhe o histórico de doações da sua ONG</p>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando doações...</p>
        </div>
      } @else {
        <!-- Statistics -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total">💰</div>
            <div class="stat-content">
              <h3>€{{ stats().totalAmount.toFixed(2) }}</h3>
              <p>Total Recebido</p>
              <span class="subtext">{{ stats().totalDonations }} doações</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon recurring">🔄</div>
            <div class="stat-content">
              <h3>€{{ stats().monthlyRecurring.toFixed(2) }}</h3>
              <p>Doações Mensais</p>
              <span class="subtext">Recorrente</span>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters">
          <select class="filter-select" [(ngModel)]="filterType" (change)="filterDonations()">
            <option value="">Todos os tipos</option>
            <option value="one_time">Única</option>
            <option value="monthly">Mensal</option>
          </select>
          <select class="filter-select" [(ngModel)]="filterStatus" (change)="filterDonations()">
            <option value="">Todos os status</option>
            <option value="completed">Concluída</option>
            <option value="pending">Pendente</option>
            <option value="failed">Falhada</option>
          </select>
          <input
            type="text"
            placeholder="🔍 Buscar por nome do doador..."
            class="search-input"
            [(ngModel)]="searchTerm"
            (input)="filterDonations()"
          />
        </div>

        <!-- Donations Table -->
        @if (filteredDonations().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">💸</div>
            <h3>Nenhuma doação encontrada</h3>
            <p>{{ donations().length === 0 ? 'Quando receberem doações, elas aparecerão aqui' : 'Nenhuma doação encontrada com esses filtros' }}</p>
          </div>
        } @else {
          <div class="donations-table-container">
            <table class="donations-table">
              <thead>
                <tr>
                  <th>Doador</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                @for (donation of filteredDonations(); track donation.id) {
                  <tr>
                    <td>
                      <div class="donor-info">
                        <div class="donor-avatar">
                          {{ getInitials(donation.donorName) }}
                        </div>
                        <div>
                          <div class="donor-name">{{ donation.donorName }}</div>
                          <div class="donor-email">{{ donation.donorEmail }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="amount">€{{ donation.amount.toFixed(2) }}</span>
                    </td>
                    <td>
                      <span class="type-badge" [class]="donation.donationType">
                        {{ getTypeLabel(donation.donationType) }}
                      </span>
                    </td>
                    <td>
                      <span class="status-badge" [class]="donation.paymentStatus">
                        {{ getStatusLabel(donation.paymentStatus) }}
                      </span>
                    </td>
                    <td>
                      <div class="date-info">
                        <div>{{ formatDate(donation.createdAt) }}</div>
                        <div class="time">{{ formatTime(donation.createdAt) }}</div>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .donations-page {
      max-width: 1440px;
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;

      &.total { background: #E8F5E9; }
      &.monthly { background: #E3F2FD; }
      &.recurring { background: #FFF3E0; }
    }

    .stat-content {
      flex: 1;

      h3 {
        font-size: 28px;
        font-weight: 700;
        color: #2C2C2C;
        margin: 0 0 4px 0;
      }

      p {
        color: #666;
        font-size: 14px;
        margin: 0 0 4px 0;
      }

      .subtext {
        color: #999;
        font-size: 12px;

        &.positive {
          color: #27AE60;
        }

        &.negative {
          color: #E74C3C;
        }
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

    .donations-table-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .donations-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: #F9F9F9;

        th {
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #666;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #F0F0F0;
          transition: background 0.2s;

          &:hover {
            background: #F9F9F9;
          }

          &:last-child {
            border-bottom: none;
          }
        }

        td {
          padding: 16px;
          vertical-align: middle;
        }
      }
    }

    .donor-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .donor-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #5CB5B0;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
      }

      .donor-name {
        font-weight: 600;
        color: #2C2C2C;
        margin-bottom: 2px;
      }

      .donor-email {
        font-size: 13px;
        color: #999;
      }
    }

    .amount {
      font-size: 18px;
      font-weight: 700;
      color: #27AE60;
    }

    .type-badge, .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      display: inline-block;
    }

    .type-badge {
      &.one_time {
        background: #E3F2FD;
        color: #1976D2;
      }

      &.monthly {
        background: #FFF3E0;
        color: #F5A623;
      }
    }

    .status-badge {
      &.completed {
        background: #E8F5E9;
        color: #27AE60;
      }

      &.pending {
        background: #FFF3E0;
        color: #F5A623;
      }

      &.failed {
        background: #FFEBEE;
        color: #E74C3C;
      }
    }

    .date-info {
      .time {
        font-size: 12px;
        color: #999;
        margin-top: 2px;
      }
    }

    @media (max-width: 1024px) {
      .donations-table-container {
        overflow-x: auto;
      }

      .donations-table {
        min-width: 800px;
      }
    }

    @media (max-width: 768px) {
      .donations-page {
        padding: 24px 16px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filters {
        flex-direction: column;

        .search-input, .filter-select {
          width: 100%;
        }
      }
    }
  `]
})
export class OngDonationsComponent implements OnInit {
  private ongService = inject(OngService);
  private toastService = inject(ToastService);
  Math = Math;

  isLoading = signal(true);
  donations = signal<Donation[]>([]);
  filteredDonations = signal<Donation[]>([]);
  stats = signal<DonationStatistics>({
    totalAmount: 0,
    totalDonations: 0,
    monthlyRecurring: 0
  });

  searchTerm = '';
  filterType = '';
  filterStatus = '';

  ngOnInit() {
    this.loadDonations();
  }

  loadDonations() {
    this.isLoading.set(true);

    this.ongService.getDonations().subscribe({
      next: (data) => {
        this.donations.set(data.donations);
        this.filteredDonations.set(data.donations);
        if (data.statistics) {
          this.stats.set(data.statistics);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading donations:', error);
        this.toastService.error('Erro ao carregar doações');
        this.isLoading.set(false);
      }
    });
  }

  filterDonations() {
    let filtered = this.donations();

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(don =>
        don.donorName.toLowerCase().includes(term) ||
        don.donorEmail.toLowerCase().includes(term)
      );
    }

    if (this.filterType) {
      filtered = filtered.filter(don => don.donationType === this.filterType);
    }

    if (this.filterStatus) {
      filtered = filtered.filter(don => don.paymentStatus === this.filterStatus);
    }

    this.filteredDonations.set(filtered);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      one_time: 'Única',
      monthly: 'Mensal'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      completed: 'Concluída',
      pending: 'Pendente',
      failed: 'Falhada'
    };
    return labels[status] || status;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
