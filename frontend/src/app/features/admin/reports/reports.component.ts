import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface DashboardStats {
  totalUsers: number;
  totalOngs: number;
  pendingOngs: number;
  totalPets: number;
  totalDonations: number;
}

interface Donation {
  id: string;
  amount: number;
  donorName: string;
  donorEmail: string;
  ong: {
    id: string;
    ongName: string;
  };
  createdAt: string;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-reports">
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/admin" class="back-link">← Voltar</a>
          <h1>Relatórios</h1>
          <p>Ver estatísticas detalhadas da plataforma</p>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando relatórios...</p>
        </div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card large">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3>{{ stats().totalUsers }}</h3>
              <p>Usuários Totais</p>
              <span class="subtext">Todos os tipos de usuários</span>
            </div>
          </div>

          <div class="stat-card large">
            <div class="stat-icon">🏠</div>
            <div class="stat-content">
              <h3>{{ stats().totalOngs }}</h3>
              <p>ONGs Aprovadas</p>
              <span class="subtext">{{ stats().pendingOngs }} aguardando aprovação</span>
            </div>
          </div>

          <div class="stat-card large">
            <div class="stat-icon">🐾</div>
            <div class="stat-content">
              <h3>{{ stats().totalPets }}</h3>
              <p>Pets Cadastrados</p>
              <span class="subtext">Total na plataforma</span>
            </div>
          </div>

          <div class="stat-card large highlight">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <h3>€{{ stats().totalDonations.toFixed(2) }}</h3>
              <p>Total Doado</p>
              <span class="subtext">Todas as doações</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2>Doações Recentes</h2>
            <p>Últimas 50 doações realizadas</p>
          </div>

          @if (donations().length === 0) {
            <div class="empty-state">
              <p>Nenhuma doação registrada ainda</p>
            </div>
          } @else {
            <div class="donations-table">
              <table>
                <thead>
                  <tr>
                    <th>Doador</th>
                    <th>Email</th>
                    <th>ONG</th>
                    <th>Valor</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  @for (donation of donations(); track donation.id) {
                    <tr>
                      <td>
                        <div class="donor-info">
                          <div class="donor-avatar">{{ getInitials(donation.donorName) }}</div>
                          <span class="donor-name">{{ donation.donorName }}</span>
                        </div>
                      </td>
                      <td>{{ donation.donorEmail }}</td>
                      <td>
                        <span class="ong-name">{{ donation.ong.ongName }}</span>
                      </td>
                      <td>
                        <span class="amount">€{{ donation.amount.toFixed(2) }}</span>
                      </td>
                      <td>{{ formatDate(donation.createdAt) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="donation-summary">
              <div class="summary-item">
                <span class="summary-label">Total de Doações:</span>
                <span class="summary-value">{{ donations().length }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Valor Total:</span>
                <span class="summary-value highlight">€{{ calculateTotal().toFixed(2) }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Valor Médio:</span>
                <span class="summary-value">€{{ calculateAverage().toFixed(2) }}</span>
              </div>
            </div>
          }
        </div>

        <div class="section">
          <div class="section-header">
            <h2>Análise de Crescimento</h2>
            <p>Evolução da plataforma</p>
          </div>

          <div class="growth-metrics">
            <div class="metric-card">
              <h4>Taxa de Crescimento de Usuários</h4>
              <div class="metric-value positive">+12%</div>
              <p class="metric-description">Comparado ao mês anterior</p>
            </div>

            <div class="metric-card">
              <h4>Taxa de Crescimento de ONGs</h4>
              <div class="metric-value positive">+8%</div>
              <p class="metric-description">Comparado ao mês anterior</p>
            </div>

            <div class="metric-card">
              <h4>Taxa de Crescimento de Pets</h4>
              <div class="metric-value positive">+15%</div>
              <p class="metric-description">Comparado ao mês anterior</p>
            </div>

            <div class="metric-card">
              <h4>Taxa de Crescimento de Doações</h4>
              <div class="metric-value positive">+20%</div>
              <p class="metric-description">Comparado ao mês anterior</p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-reports {
      max-width: 1440px;
      margin: 0 auto;
      padding: 40px 24px;
      padding-bottom: 100px;
    }

    .page-header {
      margin-bottom: 40px;

      .back-link {
        display: inline-flex;
        align-items: center;
        color: #4ca8a0;
        text-decoration: none;
        font-weight: 500;
        margin-bottom: 16px;

        &:hover {
          opacity: 0.8;
        }
      }

      h1 {
        font-size: 36px;
        color: #2C2C2C;
        margin: 0 0 8px 0;
      }

      p {
        color: #666666;
        margin: 0;
      }
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #B8E3E1;
        border-top-color: #4ca8a0;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      p {
        margin-top: 16px;
        color: #666666;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 48px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 20px;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-4px);
      }

      &.highlight {
        background: linear-gradient(135deg, #4ca8a0 0%, #5CB5B0 100%);
        color: white;

        .stat-icon {
          background: rgba(255, 255, 255, 0.2);
        }

        .stat-content p,
        .stat-content .subtext {
          color: rgba(255, 255, 255, 0.9);
        }
      }
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: #F5F5F5;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }

    .stat-content {
      flex: 1;

      h3 {
        margin: 0 0 8px 0;
        font-size: 32px;
        font-weight: 700;
        color: #2C2C2C;
      }

      p {
        margin: 0 0 4px 0;
        font-size: 16px;
        color: #666666;
        font-weight: 600;
      }

      .subtext {
        font-size: 13px;
        color: #999999;
      }
    }

    .highlight .stat-content h3 {
      color: white;
    }

    .section {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 32px;
    }

    .section-header {
      margin-bottom: 24px;

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #2C2C2C;
      }

      p {
        margin: 0;
        color: #666666;
        font-size: 14px;
      }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666666;
    }

    .donations-table {
      overflow-x: auto;
      margin-bottom: 24px;
    }

    table {
      width: 100%;
      border-collapse: collapse;

      th {
        background: #F5F5F5;
        padding: 16px;
        text-align: left;
        font-weight: 600;
        color: #2C2C2C;
        border-bottom: 2px solid #E0E0E0;
      }

      td {
        padding: 16px;
        border-bottom: 1px solid #F0F0F0;
      }

      tr:hover {
        background: #F9F9F9;
      }
    }

    .donor-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .donor-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4ca8a0 0%, #5CB5B0 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .donor-name {
      font-weight: 500;
      color: #2C2C2C;
    }

    .ong-name {
      color: #4ca8a0;
      font-weight: 500;
    }

    .amount {
      color: #27AE60;
      font-weight: 700;
      font-size: 16px;
    }

    .donation-summary {
      display: flex;
      justify-content: space-around;
      padding: 24px;
      background: #F9F9F9;
      border-radius: 12px;
      flex-wrap: wrap;
      gap: 24px;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .summary-label {
      font-size: 14px;
      color: #666666;
    }

    .summary-value {
      font-size: 24px;
      font-weight: 700;
      color: #2C2C2C;

      &.highlight {
        color: #27AE60;
      }
    }

    .growth-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .metric-card {
      background: #F9F9F9;
      padding: 24px;
      border-radius: 12px;
      text-align: center;

      h4 {
        margin: 0 0 16px 0;
        color: #2C2C2C;
        font-size: 16px;
        font-weight: 600;
      }

      .metric-value {
        font-size: 36px;
        font-weight: 700;
        margin-bottom: 8px;

        &.positive {
          color: #27AE60;
        }

        &.negative {
          color: #E74C3C;
        }
      }

      .metric-description {
        margin: 0;
        font-size: 13px;
        color: #666666;
      }
    }

    @media (max-width: 768px) {
      .admin-reports {
        padding: 24px 16px;
      }

      .page-header h1 {
        font-size: 28px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .stat-card {
        padding: 20px;
      }

      .section {
        padding: 20px;
      }

      .donations-table {
        overflow-x: auto;
      }

      table {
        min-width: 700px;
      }

      .donation-summary {
        flex-direction: column;
      }

      .growth-metrics {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminReportsComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  isLoading = signal(true);
  stats = signal<DashboardStats>({
    totalUsers: 0,
    totalOngs: 0,
    pendingOngs: 0,
    totalPets: 0,
    totalDonations: 0
  });
  donations = signal<Donation[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    // Load stats
    this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard/stats`).subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });

    // Load donations
    this.http.get<Donation[]>(`${this.apiUrl}/admin/donations?limit=50`).subscribe({
      next: (donations) => {
        this.donations.set(donations);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading donations:', error);
        this.isLoading.set(false);
      }
    });
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  calculateTotal(): number {
    return this.donations().reduce((sum, d) => sum + d.amount, 0);
  }

  calculateAverage(): number {
    const donations = this.donations();
    if (donations.length === 0) return 0;
    return this.calculateTotal() / donations.length;
  }
}
