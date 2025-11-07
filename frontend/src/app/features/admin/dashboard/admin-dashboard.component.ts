import { Component, OnInit, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import {
  AdminService,
  DashboardStats,
  PendingOng,
} from "../../../core/services/admin.service";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-dashboard">
      <header class="dashboard-header">
        <h1>Painel de Administração</h1>
        <p>Gerencie a plataforma Aubrigo</p>
      </header>

      @if (isLoading()) {
      <div class="loading">
        <div class="spinner"></div>
        <p>Carregando dados...</p>
      </div>
      } @else {
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon users">👥</div>
          <div class="stat-content">
            <h3>{{ stats().totalUsers }}</h3>
            <p>Usuários Totais</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon ongs">🏠</div>
          <div class="stat-content">
            <h3>{{ stats().totalOngs }}</h3>
            <p>ONGs Aprovadas</p>
          </div>
        </div>

        <div class="stat-card highlight">
          <div class="stat-icon pending">⏳</div>
          <div class="stat-content">
            <h3>{{ stats().pendingOngs }}</h3>
            <p>ONGs Pendentes</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon pets">🐾</div>
          <div class="stat-content">
            <h3>{{ stats().totalPets }}</h3>
            <p>Pets Cadastrados</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon donations">💰</div>
          <div class="stat-content">
            <h3>€{{ stats().totalDonations.toFixed(2) }}</h3>
            <p>Total Doado</p>
          </div>
        </div>
      </div>

      <div class="pending-section">
        <div class="section-header">
          <h2>ONGs Aguardando Aprovação</h2>
          @if (pendingOngs().length > 0) {
          <span class="badge">{{ pendingOngs().length }}</span>
          }
        </div>

        @if (pendingOngs().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">✓</div>
          <p>Nenhuma ONG pendente de aprovação</p>
        </div>
        } @else {
        <div class="ong-list">
          @for (ong of pendingOngs(); track ong.id) {
          <div class="ong-card">
            <div class="ong-info">
              <h3>{{ ong.ongName }}</h3>
              <div class="ong-details">
                <span class="detail">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    />
                  </svg>
                  {{ ong.location }}
                </span>
                <span class="detail">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                    />
                  </svg>
                  {{ ong.email }}
                </span>
                <span class="detail">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                    />
                  </svg>
                  {{ ong.phone }}
                </span>
                <span class="detail date">
                  Registrado em {{ formatDate(ong.createdAt) }}
                </span>
              </div>
            </div>
            <div class="ong-actions">
              <button class="btn-approve" (click)="approveOng(ong.id)">
                ✓ Aprovar
              </button>
              <button class="btn-reject" (click)="rejectOng(ong.id)">
                ✕ Rejeitar
              </button>
            </div>
          </div>
          }
        </div>
        }
      </div>

      <div class="quick-actions">
        <h2>Ações Rápidas</h2>
        <div class="action-grid">
          <a routerLink="/admin/users" class="action-card">
            <div class="action-icon">👥</div>
            <h3>Gerenciar Usuários</h3>
            <p>Ver e gerenciar todos os usuários</p>
          </a>
          <a routerLink="/admin/ongs" class="action-card">
            <div class="action-icon">🏠</div>
            <h3>Gerenciar ONGs</h3>
            <p>Ver todas as ONGs aprovadas</p>
          </a>
          <a routerLink="/admin/pets" class="action-card">
            <div class="action-icon">🐾</div>
            <h3>Gerenciar Pets</h3>
            <p>Moderar listagens de pets</p>
          </a>
          <a routerLink="/admin/reports" class="action-card">
            <div class="action-icon">📊</div>
            <h3>Relatórios</h3>
            <p>Ver estatísticas detalhadas</p>
          </a>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .admin-dashboard {
        max-width: 1440px;
        margin: 0 auto;
        padding: 40px 24px;
        padding-bottom: 100px;
      }

      .dashboard-header {
        margin-bottom: 40px;

        h1 {
          font-size: 36px;
          color: #2c2c2c;
          margin: 0 0 8px 0;
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
          border: 4px solid #b8e3e1;
          border-top-color: #5cb5b0;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        p {
          color: #666;
        }
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

        &.highlight {
          border: 2px solid #f5a623;
          background: #fff4e5;
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

        &.users {
          background: #e3f2fd;
        }
        &.ongs {
          background: #f3e5f5;
        }
        &.pending {
          background: #fff4e5;
        }
        &.pets {
          background: #e8f5e9;
        }
        &.donations {
          background: #fff3e0;
        }
      }

      .stat-content {
        h3 {
          font-size: 32px;
          font-weight: 700;
          color: #2c2c2c;
          margin: 0 0 4px 0;
        }

        p {
          color: #666;
          font-size: 14px;
          margin: 0;
        }
      }

      .pending-section {
        background: white;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        margin-bottom: 48px;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;

        h2 {
          font-size: 24px;
          color: #2c2c2c;
          margin: 0;
        }

        .badge {
          background: #f5a623;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }
      }

      .empty-state {
        text-align: center;
        padding: 60px 20px;

        .empty-icon {
          font-size: 64px;
          color: #27ae60;
          margin-bottom: 16px;
        }

        p {
          color: #666;
          font-size: 18px;
        }
      }

      .ong-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .ong-card {
        background: #f9f9f9;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        border: 2px solid transparent;
        transition: all 0.2s;

        &:hover {
          border-color: #5cb5b0;
          background: white;
        }
      }

      .ong-info {
        flex: 1;

        h3 {
          font-size: 20px;
          color: #2c2c2c;
          margin: 0 0 12px 0;
        }

        .ong-details {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;

          .detail {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #666;
            font-size: 14px;

            svg {
              width: 16px;
              height: 16px;
              color: #5cb5b0;
            }

            &.date {
              color: #999;
              font-size: 13px;
            }
          }
        }
      }

      .ong-actions {
        display: flex;
        gap: 12px;

        button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-approve {
          background: #27ae60;
          color: white;

          &:hover {
            background: #229954;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
          }
        }

        .btn-reject {
          background: #e74c3c;
          color: white;

          &:hover {
            background: #c0392b;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
          }
        }
      }

      .quick-actions {
        h2 {
          font-size: 24px;
          color: #2c2c2c;
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

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        }

        .action-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }

        h3 {
          font-size: 18px;
          color: #2c2c2c;
          margin: 0 0 8px 0;
        }

        p {
          color: #666;
          font-size: 14px;
          margin: 0;
        }
      }

      @media (max-width: 768px) {
        .admin-dashboard {
          padding: 24px 16px;
        }

        .dashboard-header h1 {
          font-size: 28px;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .ong-card {
          flex-direction: column;
          align-items: flex-start;

          .ong-actions {
            width: 100%;

            button {
              flex: 1;
            }
          }
        }

        .action-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);

  isLoading = signal(true);
  stats = signal<DashboardStats>({
    totalUsers: 0,
    totalOngs: 0,
    pendingOngs: 0,
    totalPets: 0,
    totalDonations: 0,
    totalDonationAmount: 0,
  });
  pendingOngs = signal<PendingOng[]>([]);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);

    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (error) => {
        console.error("Error loading stats:", error);
        this.toastService.error("Erro ao carregar estatísticas");
      },
    });

    this.adminService.getPendingOngs().subscribe({
      next: (data) => {
        this.pendingOngs.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error("Error loading pending ONGs:", error);
        this.toastService.error("Erro ao carregar ONGs pendentes");
        this.isLoading.set(false);
      },
    });
  }

  approveOng(ongId: string) {
    if (!confirm("Tem certeza que deseja aprovar esta ONG?")) {
      return;
    }

    this.adminService.approveOng(ongId).subscribe({
      next: () => {
        this.toastService.success("ONG aprovada com sucesso!");
        this.pendingOngs.update((list) =>
          list.filter((ong) => ong.id !== ongId)
        );
        this.stats.update((s) => ({
          ...s,
          pendingOngs: s.pendingOngs - 1,
          totalOngs: s.totalOngs + 1,
        }));
      },
      error: (error) => {
        this.toastService.error(
          "Erro ao aprovar ONG: " +
            (error.error?.message || "Erro desconhecido")
        );
      },
    });
  }

  rejectOng(ongId: string) {
    const reason = prompt("Motivo da rejeição (opcional):");
    if (reason === null) return;

    this.adminService.rejectOng(ongId, reason || undefined).subscribe({
      next: () => {
        this.toastService.success("ONG rejeitada");
        this.pendingOngs.update((list) =>
          list.filter((ong) => ong.id !== ongId)
        );
        this.stats.update((s) => ({
          ...s,
          pendingOngs: s.pendingOngs - 1,
        }));
      },
      error: (error) => {
        this.toastService.error(
          "Erro ao rejeitar ONG: " +
            (error.error?.message || "Erro desconhecido")
        );
      },
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
}
