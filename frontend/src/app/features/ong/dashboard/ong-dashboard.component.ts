import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OngService, OngDashboardStats, OngProfile } from '../../../core/services/ong.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-ong-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ong-dashboard">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>{{ ongDetails()?.ongName || 'Painel ONG' }}</h1>
        </div>
        <p>Gerencie sua organização e ajude animais a encontrarem um lar</p>
      </header>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando dados...</p>
        </div>
      } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon pets">🐾</div>
            <div class="stat-content">
              <h3>{{ stats().totalPets }}</h3>
              <p>Pets Cadastrados</p>
              <span class="subtext">{{ stats().availablePets }} disponíveis</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon adopted">❤️</div>
            <div class="stat-content">
              <h3>{{ stats().adoptedPets }}</h3>
              <p>Pets Adotados</p>
              <span class="subtext">Total histórico</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon appointments">📅</div>
            <div class="stat-content">
              <h3>{{ stats().pendingAppointments }}</h3>
              <p>Visitas Pendentes</p>
              <span class="subtext">Aguardando resposta</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon donations">💰</div>
            <div class="stat-content">
              <h3>€{{ stats().totalDonations.toFixed(2) }}</h3>
              <p>Total Recebido</p>
              <span class="subtext">€{{ stats().monthlyDonations.toFixed(2) }} este mês</span>
            </div>
          </div>
        </div>

        <div class="main-actions">
          <h2>Ações Rápidas</h2>
          <div class="action-grid">
            <a routerLink="/pets/add" class="action-card primary">
              <div class="action-icon">➕</div>
              <h3>Adicionar Pet</h3>
              <p>Cadastre um novo animal para adoção</p>
            </a>
            <a routerLink="/pets/manage" class="action-card">
              <div class="action-icon">🐾</div>
              <h3>Gerenciar Pets</h3>
              <p>Edite ou remova pets cadastrados</p>
            </a>
            <a routerLink="/ong/appointments" class="action-card">
              <div class="action-icon">📅</div>
              <h3>Visitas Agendadas</h3>
              <p>Veja e gerencie agendamentos</p>
            </a>
            <a routerLink="/ong/donations" class="action-card">
              <div class="action-icon">💸</div>
              <h3>Histórico de Doações</h3>
              <p>Veja todas as doações recebidas</p>
            </a>
          </div>
        </div>

        <div class="profile-section">
          <h2>Perfil da ONG</h2>
          <div class="profile-card">
            <div class="profile-info">
              <div class="info-row">
                <span class="label">Nome:</span>
                <span class="value">{{ ongDetails()?.ongName }}</span>
              </div>
              <div class="info-row">
                <span class="label">Localização:</span>
                <span class="value">{{ ongDetails()?.location }}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">{{ ongDetails()?.email }}</span>
              </div>
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">{{ ongDetails()?.phone || 'Não informado' }}</span>
              </div>
              @if (ongDetails()?.instagramHandle) {
                <div class="info-row">
                  <span class="label">Instagram:</span>
                  <span class="value">{{ ongDetails()?.instagramHandle }}</span>
                </div>
              }
            </div>
            <a routerLink="/ong/profile/edit" class="btn-edit">
              ✏️ Editar Perfil
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ong-dashboard {
      max-width: 1440px;
      margin: 0 auto;
      padding: 40px 24px;
      padding-bottom: 100px;
    }

    .dashboard-header {
      margin-bottom: 40px;

      .header-content {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 8px;

        h1 {
          font-size: 36px;
          color: #2C2C2C;
          margin: 0;
        }

        .verified-badge {
          background: #27AE60;
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
      }

      p {
        color: #666;
        font-size: 18px;
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

      p {
        color: #666;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 48px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;

      &.pets { background: #E8F5E9; }
      &.adopted { background: #FFEBEE; }
      &.appointments { background: #E3F2FD; }
      &.donations { background: #FFF3E0; }
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
      }
    }

    .main-actions {
      margin-bottom: 48px;

      h2 {
        font-size: 24px;
        color: #2C2C2C;
        margin: 0 0 24px 0;
      }
    }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .action-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      text-decoration: none;
      transition: all 0.2s;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }

      &.primary {
        background: #5CB5B0;
        color: white;

        h3, p {
          color: white;
        }

        &:hover {
          background: #4A9792;
        }
      }

      .action-icon {
        font-size: 40px;
        margin-bottom: 16px;
      }

      h3 {
        font-size: 18px;
        color: #2C2C2C;
        margin: 0 0 8px 0;
      }

      p {
        color: #666;
        font-size: 14px;
        margin: 0;
      }
    }

    .profile-section {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 32px;
    }

    .profile-section h2 {
      font-size: 24px;
      color: #2C2C2C;
      margin: 0 0 24px 0;
    }

    .profile-card {
      background: #F9F9F9;
      border-radius: 12px;
      padding: 24px;
    }

    .profile-info {
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      padding: 12px 0;
      border-bottom: 1px solid #E0E0E0;

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-weight: 600;
        color: #666;
        width: 120px;
      }

      .value {
        color: #2C2C2C;
        flex: 1;
      }
    }

    .btn-edit {
      background: #5CB5B0;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s;

      &:hover {
        background: #4A9792;
        transform: translateY(-1px);
      }
    }

    @media (max-width: 768px) {
      .ong-dashboard {
        padding: 24px 16px;
      }

      .dashboard-header {
        .header-content {
          flex-direction: column;
          align-items: flex-start;

          h1 {
            font-size: 28px;
          }
        }
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .action-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class OngDashboardComponent implements OnInit {
  private ongService = inject(OngService);
  private toastService = inject(ToastService);
  public authService = inject(AuthService);

  isLoading = signal(true);
  stats = signal<OngDashboardStats>({
    totalPets: 0,
    availablePets: 0,
    adoptedPets: 0,
    totalDonations: 0,
    monthlyDonations: 0,
    pendingAppointments: 0
  });
  ongDetails = signal<OngProfile | null>(null);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);

    // Load ONG profile
    this.ongService.getOngProfile().subscribe({
      next: (ong) => {
        this.ongDetails.set(ong);

        // Load dashboard stats
        this.ongService.getDashboardStats().subscribe({
          next: (stats) => {
            this.stats.set(stats);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error loading stats:', error);
            this.toastService.error('Erro ao carregar estatísticas');
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error loading ONG data:', error);
        this.toastService.error('Erro ao carregar dados da ONG');
        this.isLoading.set(false);
      }
    });
  }

}
