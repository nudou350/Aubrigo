import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, User } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-users">
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/admin" class="back-link">← Voltar</a>
          <h1>Gerenciar Usuários</h1>
          <p>Ver e gerenciar todos os usuários da plataforma</p>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando usuários...</p>
        </div>
      } @else {
        <div class="stats-summary">
          <div class="stat-box">
            <span class="stat-value">{{ users().length }}</span>
            <span class="stat-label">Total de Usuários</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">{{ getUsersByRole('ong').length }}</span>
            <span class="stat-label">ONGs</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">{{ getUsersByRole('user').length }}</span>
            <span class="stat-label">Usuários Comuns</span>
          </div>
        </div>

        <div class="filters">
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por nome, email ou localização..."
            (input)="onSearch($event)"
          >
          <select class="role-filter" (change)="onFilterRole($event)">
            <option value="">Todos os tipos</option>
            <option value="ong">ONGs</option>
            <option value="user">Usuários</option>
          </select>
        </div>

        @if (filteredUsers().length === 0) {
          <div class="empty-state">
            <p>Nenhum usuário encontrado</p>
          </div>
        } @else {
          <div class="users-table">
            <table>
              <thead>
                <tr>
                  <th>Nome/Email</th>
                  <th>Tipo</th>
                  <th>Localização</th>
                  <th>Telefone</th>
                  <th>Data de Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                @for (user of filteredUsers(); track user.id) {
                  <tr>
                    <td>
                      <div class="user-info">
                        <div class="user-avatar">{{ getInitials(user) }}</div>
                        <div>
                          <div class="user-name">{{ getUserDisplayName(user) }}</div>
                          <div class="user-email">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="role-badge" [class]="user.role">
                        {{ getRoleLabel(user.role) }}
                      </span>
                    </td>
                    <td>{{ user.location || '-' }}</td>
                    <td>{{ user.phone || '-' }}</td>
                    <td>{{ formatDate(user.createdAt) }}</td>
                    <td>
                      <div class="actions">
                        <button
                          class="btn-action view"
                          (click)="viewUser(user.id)"
                          title="Ver detalhes">
                          👁️
                        </button>
                        <button
                          class="btn-action delete"
                          (click)="deleteUser(user.id, getUserDisplayName(user))"
                          title="Excluir usuário">
                          🗑️
                        </button>
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
    .admin-users {
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

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 32px;

      @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 480px) {
        grid-template-columns: 1fr;
      }
    }

    .stat-box {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;

      .stat-value {
        font-size: 36px;
        font-weight: 700;
        color: #4ca8a0;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 14px;
        color: #666666;
      }
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-input,
    .role-filter {
      padding: 12px 16px;
      border: 2px solid #B8E3E1;
      border-radius: 8px;
      font-size: 16px;
      outline: none;

      &:focus {
        border-color: #4ca8a0;
      }
    }

    .search-input {
      flex: 1;
      min-width: 300px;
    }

    .role-filter {
      min-width: 200px;
      background: white;
      cursor: pointer;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666666;
    }

    .users-table {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow-x: auto;
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
        white-space: nowrap;
      }

      td {
        padding: 16px;
        border-bottom: 1px solid #F0F0F0;
      }

      tr:hover {
        background: #F9F9F9;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #4ca8a0;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .user-name {
      font-weight: 600;
      color: #2C2C2C;
      margin-bottom: 2px;
    }

    .user-email {
      font-size: 14px;
      color: #666666;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;

      &.admin {
        background: #E3F2FD;
        color: #1976D2;
      }

      &.ong {
        background: #E8F5E9;
        color: #388E3C;
      }

      &.user {
        background: #FFF3E0;
        color: #F57C00;
      }
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn-action {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &.view {
        background: #E3F2FD;

        &:hover {
          background: #BBDEFB;
        }
      }

      &.delete {
        background: #FFEBEE;

        &:hover {
          background: #FFCDD2;
        }
      }
    }

    @media (max-width: 768px) {
      .admin-users {
        padding: 24px 16px;
      }

      .page-header h1 {
        font-size: 28px;
      }

      .filters {
        flex-direction: column;
      }

      .search-input,
      .role-filter {
        width: 100%;
        min-width: unset;
      }

      .users-table {
        overflow-x: auto;
      }

      table {
        min-width: 800px;
      }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);

  isLoading = signal(true);
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  searchTerm = '';
  roleFilter = '';

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);

    this.adminService.getUsers().subscribe({
      next: (users) => {
        // Filter out admin users
        const nonAdminUsers = users.filter(u => u.role !== 'admin');
        this.users.set(nonAdminUsers);
        this.filteredUsers.set(nonAdminUsers);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toastService.error('Erro ao carregar usuários: ' + (error.error?.message || 'Erro desconhecido'));
      }
    });
  }

  getUsersByRole(role: string): User[] {
    return this.users().filter(u => u.role === role);
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.applyFilters();
  }

  onFilterRole(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.roleFilter = select.value;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.users();

    // Apply role filter
    if (this.roleFilter) {
      filtered = filtered.filter(u => u.role === this.roleFilter);
    }

    // Apply search filter
    if (this.searchTerm) {
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(this.searchTerm) ||
        u.firstName?.toLowerCase().includes(this.searchTerm) ||
        u.lastName?.toLowerCase().includes(this.searchTerm) ||
        u.ongName?.toLowerCase().includes(this.searchTerm) ||
        u.location?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredUsers.set(filtered);
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.ongName) {
      return user.ongName.substring(0, 2).toUpperCase();
    }
    return user.email[0].toUpperCase();
  }

  getUserDisplayName(user: User): string {
    if (user.role === 'ong' && user.ongName) {
      return user.ongName;
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Admin',
      ong: 'ONG',
      user: 'Usuário'
    };
    return labels[role] || role;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  viewUser(userId: string) {
    // Navigate to user detail page (to be implemented)
    this.toastService.info(`Ver detalhes do usuário: ${userId}`);
  }

  deleteUser(userId: string, userName: string) {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    this.adminService.deleteUser(userId).subscribe({
      next: () => {
        this.toastService.success('Usuário excluído com sucesso!');
        this.loadUsers();
      },
      error: (error) => {
        this.toastService.error('Erro ao excluir usuário: ' + (error.error?.message || 'Erro desconhecido'));
      }
    });
  }
}
