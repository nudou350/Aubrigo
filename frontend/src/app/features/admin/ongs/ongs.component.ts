import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, Ong } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { CountryService, Country } from '../../../core/services/country.service';

@Component({
  selector: 'app-admin-ongs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-ongs">
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/admin" class="back-link">← Voltar</a>
          <h1>Gerenciar ONGs</h1>
          <p>Ver todas as ONGs aprovadas na plataforma</p>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando ONGs...</p>
        </div>
      } @else {
        <div class="stats-summary">
          <div class="stat-box">
            <span class="stat-value">{{ ongs().length }}</span>
            <span class="stat-label">Total de ONGs</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">{{ getOngsWithPets() }}</span>
            <span class="stat-label">ONGs com Pets</span>
          </div>
        </div>

        <div class="filters">
          <div class="filter-row">
            <input
              type="text"
              class="search-input"
              placeholder="Buscar por nome, email ou localização..."
              (input)="onSearch($event)"
            >
            <select
              class="country-filter"
              [value]="selectedCountry()"
              (change)="onCountryFilterChange($event)">
              <option value="">Todos os países</option>
              @for (country of countries(); track country.code) {
                <option [value]="country.code">{{ country.flag }} {{ country.name }}</option>
              }
            </select>
          </div>
        </div>

        @if (filteredOngs().length === 0) {
          <div class="empty-state">
            <p>Nenhuma ONG encontrada</p>
          </div>
        } @else {
          <div class="ongs-grid">
            @for (ong of filteredOngs(); track ong.id) {
              <div class="ong-card">
                <div class="ong-header">
                  <div class="ong-avatar">{{ getInitials(ong) }}</div>
                  <div class="ong-info">
                    <div class="ong-name-row">
                      <h3>{{ ong.ongName }}</h3>
                      @if (ong.countryCode) {
                        <span class="country-badge" [title]="getCountryName(ong.countryCode)">
                          {{ getCountryFlag(ong.countryCode) }}
                        </span>
                      }
                    </div>
                    <p class="ong-email">{{ ong.email }}</p>
                  </div>
                </div>

                <div class="ong-details">
                  @if (ong.location) {
                    <div class="detail-row">
                      <span class="icon">📍</span>
                      <span>{{ ong.location }}</span>
                    </div>
                  }
                  @if (ong.phone) {
                    <div class="detail-row">
                      <span class="icon">📞</span>
                      <span>{{ ong.phone }}</span>
                    </div>
                  }
                  @if (ong.instagramHandle) {
                    <div class="detail-row">
                      <span class="icon">📷</span>
                      <span>{{ ong.instagramHandle }}</span>
                    </div>
                  }
                  <div class="detail-row">
                    <span class="icon">📅</span>
                    <span>Cadastrada em {{ formatDate(ong.createdAt) }}</span>
                  </div>
                </div>

                <div class="ong-actions">
                  <button
                    class="btn-view"
                    (click)="viewOng(ong.id)">
                    Ver Detalhes
                  </button>
                  <button
                    class="btn-delete"
                    (click)="deleteOng(ong.id, ong.ongName)">
                    Excluir
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .admin-ongs {
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
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
      margin-bottom: 24px;
    }

    .filter-row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 250px;
      padding: 12px 16px;
      border: 2px solid #B8E3E1;
      border-radius: 8px;
      font-size: 16px;
      outline: none;

      &:focus {
        border-color: #4ca8a0;
      }
    }

    .country-filter {
      min-width: 200px;
      padding: 12px 16px;
      border: 2px solid #B8E3E1;
      border-radius: 8px;
      font-size: 16px;
      background: white;
      cursor: pointer;
      outline: none;

      &:focus {
        border-color: #4ca8a0;
      }

      &:hover {
        border-color: #5CB5B0;
      }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666666;
    }

    .ongs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .ong-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
    }

    .ong-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #F0F0F0;
    }

    .ong-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4ca8a0 0%, #5CB5B0 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
      flex-shrink: 0;
    }

    .ong-info {
      flex: 1;
      min-width: 0;

      .ong-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      h3 {
        margin: 0;
        color: #2C2C2C;
        font-size: 18px;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .country-badge {
        font-size: 16px;
        flex-shrink: 0;
        cursor: help;
      }

      .ong-email {
        margin: 0;
        color: #666666;
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .ong-details {
      margin-bottom: 20px;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      color: #666666;
      font-size: 14px;

      .icon {
        font-size: 16px;
        width: 20px;
        text-align: center;
      }
    }

    .ong-actions {
      display: flex;
      gap: 12px;
    }

    .btn-view,
    .btn-delete {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-view {
      background: #E3F2FD;
      color: #1976D2;

      &:hover {
        background: #BBDEFB;
      }
    }

    .btn-delete {
      background: #FFEBEE;
      color: #D32F2F;

      &:hover {
        background: #FFCDD2;
      }
    }

    @media (max-width: 768px) {
      .admin-ongs {
        padding: 24px 16px;
      }

      .page-header h1 {
        font-size: 28px;
      }

      .stats-summary {
        grid-template-columns: repeat(2, 1fr);
      }

      .ongs-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminOngsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);
  private countryService = inject(CountryService);

  isLoading = signal(true);
  ongs = signal<Ong[]>([]);
  filteredOngs = signal<Ong[]>([]);
  countries = signal<Country[]>([]);
  selectedCountry = signal<string>('');
  searchTerm = '';

  ngOnInit() {
    this.loadCountries();
    this.loadOngs();
  }

  loadCountries() {
    this.countryService.getAllCountries().subscribe({
      next: (countries) => {
        this.countries.set(countries);
      },
      error: (error) => {
      }
    });
  }

  loadOngs() {
    this.isLoading.set(true);
    const countryFilter = this.selectedCountry() || undefined;

    this.adminService.getOngs(countryFilter).subscribe({
      next: (ongs) => {
        this.ongs.set(ongs);
        this.filteredOngs.set(ongs);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toastService.error('Erro ao carregar ONGs: ' + (error.error?.message || 'Erro desconhecido'));
      }
    });
  }

  onCountryFilterChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedCountry.set(select.value);
    this.loadOngs();
  }

  getOngsWithPets(): number {
    // This would need additional API call to get pets count
    // For now, returning the total count
    return this.ongs().length;
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.ongs();

    if (this.searchTerm) {
      filtered = filtered.filter(ong =>
        ong.ongName.toLowerCase().includes(this.searchTerm) ||
        ong.email.toLowerCase().includes(this.searchTerm) ||
        ong.location?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredOngs.set(filtered);
  }

  getInitials(ong: Ong): string {
    return ong.ongName.substring(0, 2).toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  viewOng(ongId: string) {
    this.toastService.info(`Ver detalhes da ONG: ${ongId}`);
  }

  deleteOng(ongId: string, ongName: string) {
    if (!confirm(`Tem certeza que deseja excluir a ONG "${ongName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    this.adminService.deleteOng(ongId).subscribe({
      next: () => {
        this.toastService.success('ONG excluída com sucesso!');
        this.loadOngs();
      },
      error: (error) => {
        this.toastService.error('Erro ao excluir ONG: ' + (error.error?.message || 'Erro desconhecido'));
      }
    });
  }

  getCountryFlag(countryCode: string): string {
    const country = this.countries().find(c => c.code === countryCode);
    return country?.flag || '🌍';
  }

  getCountryName(countryCode: string): string {
    const country = this.countries().find(c => c.code === countryCode);
    return country?.name || countryCode;
  }
}
