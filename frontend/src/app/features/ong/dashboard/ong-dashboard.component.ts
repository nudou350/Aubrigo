import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

interface OngStats {
  totalPets: number;
  availablePets: number;
  adoptedPets: number;
  totalDonations: number;
  monthlyDonations: number;
  pendingAppointments: number;
}

interface OngMember {
  id: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  role: string;
  permissions: string[];
  joinedAt: string;
}

interface OngDetails {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  ongName?: string;
  profileImageUrl?: string;
  phone?: string;
  instagramHandle?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
}

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
            <a routerLink="/appointments" class="action-card">
              <div class="action-icon">📅</div>
              <h3>Visitas Agendadas</h3>
              <p>Veja e gerencie agendamentos</p>
            </a>
            <a routerLink="/donations/history" class="action-card">
              <div class="action-icon">💸</div>
              <h3>Histórico de Doações</h3>
              <p>Veja todas as doações recebidas</p>
            </a>
          </div>
        </div>

        <div class="team-section">
          <div class="section-header">
            <h2>Equipe da ONG</h2>
            <button class="btn-invite" (click)="inviteMember()">
              ➕ Convidar Membro
            </button>
          </div>

          @if (members().length === 0) {
            <div class="empty-state">
              <p>Nenhum membro na equipe ainda</p>
            </div>
          } @else {
            <div class="member-list">
              @for (member of members(); track member.id) {
                <div class="member-card">
                  <div class="member-info">
                    <div class="member-avatar">
                      {{ getInitials(member.user) }}
                    </div>
                    <div>
                      <h4>{{ getMemberName(member.user) }}</h4>
                      <p class="member-email">{{ member.user.email }}</p>
                      <div class="member-badges">
                        <span class="role-badge" [class]="member.role">
                          {{ getRoleLabel(member.role) }}
                        </span>
                        @for (permission of member.permissions; track permission) {
                          <span class="permission-tag">{{ getPermissionLabel(permission) }}</span>
                        }
                      </div>
                    </div>
                  </div>
                  @if (member.role !== 'owner') {
                    <button class="btn-remove" (click)="removeMember(member.id)">
                      Remover
                    </button>
                  }
                </div>
              }
            </div>
          }
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

    .team-section, .profile-section {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        font-size: 24px;
        color: #2C2C2C;
        margin: 0;
      }

      .btn-invite {
        background: #5CB5B0;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #4A9792;
          transform: translateY(-1px);
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    .member-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .member-card {
      background: #F9F9F9;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
    }

    .member-info {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .member-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #5CB5B0;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 600;
    }

    .member-info h4 {
      margin: 0 0 4px 0;
      color: #2C2C2C;
      font-size: 16px;
    }

    .member-email {
      color: #666;
      font-size: 14px;
      margin: 0 0 8px 0;
    }

    .member-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .role-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;

      &.owner {
        background: #F5A623;
        color: white;
      }

      &.admin {
        background: #5CB5B0;
        color: white;
      }

      &.member {
        background: #E0E0E0;
        color: #666;
      }
    }

    .permission-tag {
      background: #E3F2FD;
      color: #1976D2;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 500;
    }

    .btn-remove {
      background: #E74C3C;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #C0392B;
      }
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

      .member-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;

        .btn-invite {
          width: 100%;
        }
      }
    }
  `]
})
export class OngDashboardComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  isLoading = signal(true);
  stats = signal<OngStats>({
    totalPets: 0,
    availablePets: 0,
    adoptedPets: 0,
    totalDonations: 0,
    monthlyDonations: 0,
    pendingAppointments: 0
  });
  members = signal<OngMember[]>([]);
  ongDetails = signal<OngDetails | null>(null);

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);

    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    this.http.get<OngDetails>(`${this.apiUrl}/ongs/my-ong`).subscribe({
      next: (ong) => {
        this.ongDetails.set(ong);

        this.http.get<OngStats>(`${this.apiUrl}/ongs/${ong.id}/stats`).subscribe({
          next: (stats) => {
            this.stats.set(stats);
          }
        });

        this.http.get<OngMember[]>(`${this.apiUrl}/ongs/${ong.id}/members`).subscribe({
          next: (members) => {
            this.members.set(members);
            this.isLoading.set(false);
          }
        });
      },
      error: (error) => {
        console.error('Error loading ONG data:', error);
        this.isLoading.set(false);
      }
    });
  }

  inviteMember() {
    const email = prompt('Email do membro para convidar:');
    if (!email) return;

    const ongId = this.ongDetails()?.id;
    if (!ongId) return;

    this.http.post(`${this.apiUrl}/ongs/${ongId}/invite`, { email }).subscribe({
      next: () => {
        alert('Convite enviado com sucesso!');
      },
      error: (error) => {
        alert('Erro ao enviar convite: ' + (error.error?.message || 'Erro desconhecido'));
      }
    });
  }

  removeMember(memberId: string) {
    if (!confirm('Tem certeza que deseja remover este membro?')) {
      return;
    }

    const ongId = this.ongDetails()?.id;
    if (!ongId) return;

    this.http.delete(`${this.apiUrl}/ongs/${ongId}/members/${memberId}`).subscribe({
      next: () => {
        this.members.update(list => list.filter(m => m.id !== memberId));
      },
      error: (error) => {
        alert('Erro ao remover membro: ' + (error.error?.message || 'Erro desconhecido'));
      }
    });
  }

  getInitials(user: any): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email[0].toUpperCase();
  }

  getMemberName(user: any): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      owner: 'Proprietário',
      admin: 'Administrador',
      member: 'Membro'
    };
    return labels[role] || role;
  }

  getPermissionLabel(permission: string): string {
    const labels: any = {
      manage_pets: 'Gerenciar Pets',
      view_pets: 'Ver Pets',
      manage_appointments: 'Gerenciar Visitas',
      view_donations: 'Ver Doações',
      edit_ong_profile: 'Editar Perfil',
      manage_team: 'Gerenciar Equipe'
    };
    return labels[permission] || permission;
  }
}
