import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { OngService, OngDashboardStats, OngProfile } from '../../../core/services/ong.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-ong-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="ong-dashboard">
      @if (isPendingApproval()) {
        <!-- Pending Approval Screen -->
        <div class="pending-approval">
          <div class="pending-card">
            <div class="pending-icon">⏳</div>
            <h1>{{ 'ong.dashboard.pendingApproval.title' | translate }}</h1>
            <p class="pending-message">
              {{ 'ong.dashboard.greeting' | translate:{ name: authService.currentUser()?.ongName } }}
            </p>
            <p class="pending-description">
              {{ 'ong.dashboard.pendingApproval.description' | translate }}
            </p>
            <div class="pending-info">
              <div class="info-item">
                <span class="info-icon">📧</span>
                <div class="info-text">
                  <strong>{{ 'ong.dashboard.pendingApproval.emailLabel' | translate }}</strong>
                  <p>{{ authService.currentUser()?.email }}</p>
                </div>
              </div>
              <div class="info-item">
                <span class="info-icon">🏢</span>
                <div class="info-text">
                  <strong>{{ 'ong.dashboard.pendingApproval.ongNameLabel' | translate }}</strong>
                  <p>{{ authService.currentUser()?.ongName }}</p>
                </div>
              </div>
            </div>
            <div class="pending-steps">
              <h3>{{ 'ong.dashboard.pendingApproval.whatHappensTitle' | translate }}</h3>
              <ol>
                <li>{{ 'ong.dashboard.pendingApproval.step1' | translate }}</li>
                <li>{{ 'ong.dashboard.pendingApproval.step2' | translate }}</li>
                <li>{{ 'ong.dashboard.pendingApproval.step3' | translate }}</li>
              </ol>
            </div>
            <p class="pending-footer">
              {{ 'ong.dashboard.pendingApproval.footerMessage' | translate:{ email: authService.currentUser()?.email } }}
            </p>
          </div>
        </div>
      } @else {
        <!-- Normal Dashboard -->
        <header class="dashboard-header">
          <div class="header-content">
            <h1>{{ ongDetails()?.ongName || ('ong.dashboard.title' | translate) }}</h1>
          </div>
          <p>{{ 'ong.dashboard.subtitle' | translate }}</p>
        </header>

        @if (isLoading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>{{ 'ong.dashboard.loadingData' | translate }}</p>
          </div>
        } @else {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon pets">🐾</div>
            <div class="stat-content">
              <h3>{{ stats().totalPets }}</h3>
              <p>{{ 'ong.dashboard.petsRegistered' | translate }}</p>
              <span class="subtext">{{ 'ong.dashboard.available' | translate:{ count: stats().availablePets } }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon adopted">❤️</div>
            <div class="stat-content">
              <h3>{{ stats().adoptedPets }}</h3>
              <p>{{ 'ong.dashboard.adoptedPets' | translate }}</p>
              <span class="subtext">{{ 'ong.dashboard.totalHistoric' | translate }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon appointments">📅</div>
            <div class="stat-content">
              <h3>{{ stats().pendingAppointments }}</h3>
              <p>{{ 'ong.dashboard.pendingVisits' | translate }}</p>
              <span class="subtext">{{ 'ong.dashboard.awaitingResponse' | translate }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon donations">💰</div>
            <div class="stat-content">
              <h3>€{{ stats().totalDonations.toFixed(2) }}</h3>
              <p>{{ 'ong.dashboard.totalReceived' | translate }}</p>
              <span class="subtext">{{ 'ong.dashboard.thisMonth' | translate:{ amount: stats().monthlyDonations.toFixed(2) } }}</span>
            </div>
          </div>
        </div>

        <div class="main-actions">
          <h2>{{ 'ong.dashboard.quickActions' | translate }}</h2>
          <div class="action-grid">
            <a routerLink="/pets/add" class="action-card primary">
              <div class="action-icon">➕</div>
              <h3>{{ 'ong.dashboard.actions.addPet' | translate }}</h3>
              <p>{{ 'ong.dashboard.actions.addPetDesc' | translate }}</p>
            </a>
            <a routerLink="/pets/manage" class="action-card">
              <div class="action-icon">🐾</div>
              <h3>{{ 'ong.dashboard.actions.managePets' | translate }}</h3>
              <p>{{ 'ong.dashboard.actions.managePetsDesc' | translate }}</p>
            </a>
            <a routerLink="/ong/appointments" class="action-card">
              <div class="action-icon">📅</div>
              <h3>{{ 'ong.dashboard.actions.scheduledVisits' | translate }}</h3>
              <p>{{ 'ong.dashboard.actions.scheduledVisitsDesc' | translate }}</p>
            </a>
            <a routerLink="/ong/scheduling-settings" class="action-card">
              <div class="action-icon">⚙️</div>
              <h3>{{ 'ong.dashboard.actions.schedulingSettings' | translate }}</h3>
              <p>{{ 'ong.dashboard.actions.schedulingSettingsDesc' | translate }}</p>
            </a>
            <a routerLink="/ong/analytics" class="action-card">
              <div class="action-icon">📊</div>
              <h3>{{ 'ong.dashboard.actions.statistics' | translate }}</h3>
              <p>{{ 'ong.dashboard.actions.statisticsDesc' | translate }}</p>
            </a>
            <a routerLink="/ong/availability-exceptions" class="action-card">
              <div class="action-icon">🚫</div>
              <h3>{{ 'ong.dashboard.actions.blockages' | translate }}</h3>
              <p>{{ 'ong.dashboard.actions.blockagesDesc' | translate }}</p>
            </a>
            <a routerLink="/ong/donations" class="action-card">
              <div class="action-icon">💸</div>
              <h3>{{ 'ong.dashboard.actions.donationHistory' | translate }}</h3>
              <p>{{ 'ong.dashboard.actions.donationHistoryDesc' | translate }}</p>
            </a>
            <a routerLink="/ong/articles" class="action-card">
              <div class="action-icon">📋</div>
              <h3>{{ 'ong.dashboard.actions.needs' | translate }}</h3>
              <p>{{ 'ong.dashboard.actions.needsDesc' | translate }}</p>
            </a>
          </div>
        </div>

        <div class="profile-section">
          <h2>{{ 'ong.dashboard.ongProfile' | translate }}</h2>
          <div class="profile-card">
            <div class="profile-info">
              <div class="info-row">
                <span class="label">{{ 'ong.dashboard.name' | translate }}</span>
                <span class="value">{{ ongDetails()?.ongName }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ 'ong.dashboard.location' | translate }}</span>
                <span class="value">{{ ongDetails()?.location }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ 'ong.dashboard.email' | translate }}</span>
                <span class="value">{{ ongDetails()?.email }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ 'ong.dashboard.phone' | translate }}</span>
                <span class="value">{{ ongDetails()?.phone || ('ong.dashboard.notInformed' | translate) }}</span>
              </div>
              @if (ongDetails()?.instagramHandle) {
                <div class="info-row">
                  <span class="label">{{ 'ong.dashboard.instagram' | translate }}</span>
                  <span class="value">{{ ongDetails()?.instagramHandle }}</span>
                </div>
              }
            </div>
            <a routerLink="/ong/profile/edit" class="btn-edit">
              {{ 'ong.dashboard.editProfile' | translate }}
            </a>
          </div>
        </div>
        }
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

    /* Pending Approval Screen */
    .pending-approval {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    .pending-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      padding: 48px;
      max-width: 600px;
      text-align: center;
    }

    .pending-icon {
      font-size: 80px;
      margin-bottom: 24px;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .pending-card h1 {
      color: #2C2C2C;
      font-size: 32px;
      margin: 0 0 16px 0;
    }

    .pending-message {
      font-size: 18px;
      color: #666;
      margin-bottom: 8px;
    }

    .pending-description {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      margin-bottom: 32px;
    }

    .pending-info {
      background: #F5F9F9;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: left;
    }

    .info-item {
      display: flex;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #E0E0E0;

      &:last-child {
        border-bottom: none;
      }
    }

    .info-icon {
      font-size: 24px;
    }

    .info-text {
      flex: 1;

      strong {
        display: block;
        color: #2C2C2C;
        margin-bottom: 4px;
        font-size: 14px;
      }

      p {
        color: #666;
        margin: 0;
        font-size: 14px;
      }
    }

    .pending-steps {
      background: #FFF9E6;
      border-left: 4px solid #FFC107;
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 32px;
      text-align: left;

      h3 {
        color: #2C2C2C;
        font-size: 16px;
        margin: 0 0 16px 0;
      }

      ol {
        margin: 0;
        padding-left: 20px;
        color: #666;
        line-height: 1.8;
      }

      li {
        margin-bottom: 8px;
      }
    }

    .pending-footer {
      color: #5CB5B0;
      font-size: 14px;
      margin: 0;
      padding-top: 16px;
      border-top: 1px solid #E0E0E0;
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
      padding: 16px;
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
        font-size: 32px;
        margin-bottom: 12px;
      }

      h3 {
        font-size: 16px;
        color: #2C2C2C;
        margin: 0 0 6px 0;
      }

      p {
        color: #666;
        font-size: 13px;
        margin: 0;
        line-height: 1.4;
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
    // Only load dashboard data if ONG is approved
    if (!this.isPendingApproval()) {
      this.loadDashboardData();
    } else {
      this.isLoading.set(false);
    }
  }

  isPendingApproval(): boolean {
    const user = this.authService.currentUser();
    return user?.role === 'ong' && user?.ongStatus === 'pending';
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
            this.toastService.error('Erro ao carregar estatísticas');
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        this.toastService.error('Erro ao carregar dados da ONG');
        this.isLoading.set(false);
      }
    });
  }

}
