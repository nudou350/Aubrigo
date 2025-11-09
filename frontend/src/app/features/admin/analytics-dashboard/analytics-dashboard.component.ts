import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

interface AnalyticsStats {
  summary: {
    petViews: number;
    favorites: number;
    appointments: number;
    shares: number;
  };
  viewsByDay: Array<{ date: string; count: number }>;
  topPets: Array<{
    petId: string;
    petName: string;
    petSpecies: string;
    views: number;
  }>;
  eventBreakdown: Array<{ eventType: string; count: number }>;
}

/**
 * Analytics Dashboard Component
 *
 * Displays analytics and statistics for ONGs.
 * Shows pet views, favorites, appointments, top pets, and trends.
 */
@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="analytics-dashboard">
      <a routerLink="/ong/dashboard" class="back-link">
        ← Voltar
      </a>
      <div class="dashboard-header">
        <h1>📊 Estatísticas da sua ONG</h1>
        <div class="period-selector">
          <label>Período:</label>
          <select [(ngModel)]="selectedPeriod" (change)="loadStats()">
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando estatísticas...</p>
        </div>
      } @else if (stats()) {
        <div class="dashboard-content">
          <!-- Summary Cards -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon views">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div class="stat-content">
                <h3>{{ stats()!.summary.petViews }}</h3>
                <p>Visualizações de Pets</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon favorites">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div class="stat-content">
                <h3>{{ stats()!.summary.favorites }}</h3>
                <p>Favoritos</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon appointments">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="stat-content">
                <h3>{{ stats()!.summary.appointments }}</h3>
                <p>Agendamentos</p>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon shares">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div class="stat-content">
                <h3>{{ stats()!.summary.shares }}</h3>
                <p>Compartilhamentos</p>
              </div>
            </div>
          </div>

          <!-- Views Chart -->
          <div class="chart-card">
            <h3>📈 Visualizações por Dia</h3>
            <div class="chart-container">
              <div class="bar-chart">
                @for (item of stats()!.viewsByDay; track item.date) {
                  <div class="bar-item">
                    <div
                      class="bar"
                      [style.height.%]="getBarHeight(item.count)">
                      <span class="bar-value">{{ item.count }}</span>
                    </div>
                    <span class="bar-label">{{ formatDate(item.date) }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Top Pets -->
          <div class="top-pets-card">
            <h3>🏆 Pets Mais Visualizados</h3>
            <div class="top-pets-list">
              @for (pet of stats()!.topPets; track pet.petId; let i = $index) {
                <div class="pet-item">
                  <div class="pet-rank">{{ i + 1 }}</div>
                  <div class="pet-info">
                    <strong>{{ pet.petName }}</strong>
                    <span class="pet-species">{{ pet.petSpecies }}</span>
                  </div>
                  <div class="pet-views">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {{ pet.views }}
                  </div>
                </div>
              } @empty {
                <p class="empty-state">Nenhum dado disponível ainda</p>
              }
            </div>
          </div>

          <!-- Event Breakdown -->
          <div class="breakdown-card">
            <h3>📊 Distribuição de Eventos</h3>
            <div class="breakdown-list">
              @for (event of stats()!.eventBreakdown; track event.eventType) {
                <div class="breakdown-item">
                  <span class="event-type">{{ getEventLabel(event.eventType) }}</span>
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="getEventPercentage(event.count)">
                    </div>
                  </div>
                  <span class="event-count">{{ event.count }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>Nenhuma estatística disponível</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .analytics-dashboard {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

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

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #2C2C2C;
    }

    .period-selector {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .period-selector label {
      font-weight: 600;
      color: #666;
    }

    .period-selector select {
      padding: 10px 16px;
      border: 1px solid #E0E0E0;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }

    /* Loading */
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: #666;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #E0E0E0;
      border-top-color: #5CB5B0;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon.views {
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
    }

    .stat-icon.favorites {
      background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
      color: white;
    }

    .stat-icon.appointments {
      background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
      color: white;
    }

    .stat-icon.shares {
      background: linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%);
      color: white;
    }

    .stat-content h3 {
      margin: 0 0 4px 0;
      font-size: 32px;
      font-weight: 700;
      color: #2C2C2C;
    }

    .stat-content p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }

    /* Chart Card */
    .chart-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 32px;
    }

    .chart-card h3 {
      margin: 0 0 24px 0;
      font-size: 18px;
      font-weight: 700;
      color: #2C2C2C;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 200px;
    }

    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .bar {
      width: 100%;
      background: linear-gradient(180deg, #5CB5B0 0%, #4A9D98 100%);
      border-radius: 8px 8px 0 0;
      position: relative;
      min-height: 20px;
      transition: all 0.3s;
    }

    .bar:hover {
      opacity: 0.8;
    }

    .bar-value {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      font-weight: 600;
      color: #2C2C2C;
    }

    .bar-label {
      font-size: 11px;
      color: #666;
      writing-mode: horizontal-tb;
    }

    /* Top Pets */
    .top-pets-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 32px;
    }

    .top-pets-card h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 700;
      color: #2C2C2C;
    }

    .top-pets-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .pet-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #F9F9F9;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .pet-item:hover {
      background: #F0F0F0;
    }

    .pet-rank {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #5CB5B0 0%, #4A9D98 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .pet-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pet-info strong {
      font-size: 15px;
      color: #2C2C2C;
    }

    .pet-species {
      font-size: 13px;
      color: #666;
    }

    .pet-views {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #5CB5B0;
      font-weight: 600;
      font-size: 14px;
    }

    /* Breakdown */
    .breakdown-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .breakdown-card h3 {
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 700;
      color: #2C2C2C;
    }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .breakdown-item {
      display: grid;
      grid-template-columns: 150px 1fr 60px;
      align-items: center;
      gap: 16px;
    }

    .event-type {
      font-size: 14px;
      font-weight: 600;
      color: #2C2C2C;
    }

    .progress-bar {
      height: 8px;
      background: #E0E0E0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #5CB5B0 0%, #4A9D98 100%);
      transition: width 0.3s;
    }

    .event-count {
      text-align: right;
      font-size: 14px;
      font-weight: 600;
      color: #666;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 80px 20px;
      color: #999;
    }

    .empty-state svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .analytics-dashboard {
        padding: 16px;
      }

      .dashboard-header h1 {
        font-size: 24px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .breakdown-item {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .progress-bar {
        order: 2;
      }

      .event-count {
        text-align: left;
      }
    }
  `],
})
export class AnalyticsDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  stats = signal<AnalyticsStats | null>(null);
  loading = signal(true);
  selectedPeriod = '30';

  ngOnInit(): void {
    // Check if user is authenticated and is ONG
    const currentUser = this.authService.currentUser();
    if (!currentUser || currentUser.role !== 'ong') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadStats();
  }

  async loadStats(): Promise<void> {
    this.loading.set(true);

    const currentUser = this.authService.currentUser();
    if (!currentUser?.id) {
      this.loading.set(false);
      return;
    }

    try {
      const response: any = await this.http
        .get(`/api/analytics/stats?ongId=${currentUser.id}&days=${this.selectedPeriod}`)
        .toPromise();

      if (response.success) {
        this.stats.set(response.data);
      }
    } catch (error) {
    } finally {
      this.loading.set(false);
    }
  }

  getBarHeight(count: number): number {
    if (!this.stats()) return 0;

    const maxCount = Math.max(
      ...this.stats()!.viewsByDay.map((item) => item.count),
      1
    );

    return (count / maxCount) * 100;
  }

  getEventPercentage(count: number): number {
    if (!this.stats()) return 0;

    const total = this.stats()!.eventBreakdown.reduce(
      (sum, item) => sum + item.count,
      0
    );

    return (count / total) * 100;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  }

  getEventLabel(eventType: string): string {
    const labels: Record<string, string> = {
      pet_view: 'Visualizações',
      pet_favorite: 'Favoritos',
      pet_unfavorite: 'Removidos dos Favoritos',
      pet_share: 'Compartilhamentos',
      appointment_create: 'Agendamentos',
      search: 'Buscas',
      filter_apply: 'Filtros Aplicados',
    };

    return labels[eventType] || eventType;
  }
}
