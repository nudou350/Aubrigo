import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Pet } from '../../../core/services/pets.service';

@Component({
  selector: 'app-admin-pets',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-pets">
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/admin" class="back-link">← Voltar</a>
          <h1>Gerenciar Pets</h1>
          <p>Moderar listagens de pets na plataforma</p>
        </div>
      </header>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Carregando pets...</p>
        </div>
      } @else {
        <div class="stats-summary">
          <div class="stat-box">
            <span class="stat-value">{{ pets().length }}</span>
            <span class="stat-label">Total de Pets</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">{{ getPetsByStatus('available').length }}</span>
            <span class="stat-label">Disponíveis</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">{{ getPetsByStatus('adopted').length }}</span>
            <span class="stat-label">Adotados</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">{{ getPetsBySpecies('dog').length }}</span>
            <span class="stat-label">Cães</span>
          </div>
        </div>

        <div class="filters">
          <input
            type="text"
            class="search-input"
            placeholder="Buscar por nome, raça ou localização..."
            (input)="onSearch($event)"
          >
          <select class="filter-select" (change)="onFilterSpecies($event)">
            <option value="">Todas as espécies</option>
            <option value="dog">Cães</option>
            <option value="cat">Gatos</option>
            <option value="fish">Peixes</option>
            <option value="hamster">Hamsters</option>
            <option value="other">Outros</option>
          </select>
          <select class="filter-select" (change)="onFilterStatus($event)">
            <option value="">Todos os status</option>
            <option value="available">Disponível</option>
            <option value="adopted">Adotado</option>
            <option value="pending">Pendente</option>
          </select>
        </div>

        @if (filteredPets().length === 0) {
          <div class="empty-state">
            <p>Nenhum pet encontrado</p>
          </div>
        } @else {
          <div class="pets-grid">
            @for (pet of filteredPets(); track pet.id) {
              <div class="pet-card">
                <div class="pet-image">
                  @if (getPrimaryImage(pet)) {
                    <img [src]="getPrimaryImage(pet)" [alt]="pet.name">
                  } @else {
                    <div class="no-image">🐾</div>
                  }
                  <span class="status-badge" [class]="pet.status">
                    {{ getStatusLabel(pet.status) }}
                  </span>
                </div>

                <div class="pet-content">
                  <h3>{{ pet.name }}</h3>

                  <div class="pet-meta">
                    <span class="meta-item">
                      {{ getSpeciesLabel(pet.species) }}
                    </span>
                    @if (pet.breed) {
                      <span class="meta-item">{{ pet.breed }}</span>
                    }
                    @if (pet.age !== null && pet.age !== undefined) {
                      <span class="meta-item">{{ pet.age }} {{ pet.age === 1 ? 'ano' : 'anos' }}</span>
                    }
                  </div>

                  <div class="pet-ong">
                    <span class="icon">🏠</span>
                    <span>{{ pet.ong?.ongName || 'N/A' }}</span>
                  </div>

                  @if (pet.location) {
                    <div class="pet-location">
                      <span class="icon">📍</span>
                      <span>{{ pet.location }}</span>
                    </div>
                  }

                  <div class="pet-date">
                    Cadastrado em {{ formatDate(pet.createdAt) }}
                  </div>
                </div>

                <div class="pet-actions">
                  <button
                    class="btn-view"
                    (click)="viewPet(pet.id)">
                    Ver Detalhes
                  </button>
                  <button
                    class="btn-delete"
                    (click)="deletePet(pet.id, pet.name)">
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
    .admin-pets {
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
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-input,
    .filter-select {
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

    .filter-select {
      min-width: 180px;
      background: white;
      cursor: pointer;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666666;
    }

    .pets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .pet-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
    }

    .pet-image {
      position: relative;
      width: 100%;
      height: 240px;
      background: #F5F5F5;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .no-image {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 60px;
        color: #CCCCCC;
      }

      .status-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;

        &.available {
          background: #E8F5E9;
          color: #388E3C;
        }

        &.adopted {
          background: #E3F2FD;
          color: #1976D2;
        }

        &.pending {
          background: #FFF3E0;
          color: #F57C00;
        }
      }
    }

    .pet-content {
      padding: 20px;

      h3 {
        margin: 0 0 12px 0;
        color: #2C2C2C;
        font-size: 20px;
        font-weight: 600;
      }
    }

    .pet-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;

      .meta-item {
        background: #F5F5F5;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 13px;
        color: #666666;
      }
    }

    .pet-ong,
    .pet-location {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666666;
      font-size: 14px;
      margin-bottom: 8px;

      .icon {
        font-size: 16px;
      }
    }

    .pet-date {
      font-size: 12px;
      color: #999999;
      margin-top: 12px;
    }

    .pet-actions {
      display: flex;
      gap: 0;
      border-top: 1px solid #F0F0F0;
    }

    .btn-view,
    .btn-delete {
      flex: 1;
      padding: 14px;
      border: none;
      background: transparent;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-view {
      color: #1976D2;
      border-right: 1px solid #F0F0F0;

      &:hover {
        background: #E3F2FD;
      }
    }

    .btn-delete {
      color: #D32F2F;

      &:hover {
        background: #FFEBEE;
      }
    }

    @media (max-width: 768px) {
      .admin-pets {
        padding: 24px 16px;
      }

      .page-header h1 {
        font-size: 28px;
      }

      .stats-summary {
        grid-template-columns: repeat(2, 1fr);
      }

      .filters {
        flex-direction: column;
      }

      .search-input,
      .filter-select {
        width: 100%;
        min-width: unset;
      }

      .pets-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminPetsComponent implements OnInit {
  private adminService = inject(AdminService);
  private toastService = inject(ToastService);

  isLoading = signal(true);
  pets = signal<Pet[]>([]);
  filteredPets = signal<Pet[]>([]);
  searchTerm = '';
  speciesFilter = '';
  statusFilter = '';

  ngOnInit() {
    this.loadPets();
  }

  loadPets() {
    this.isLoading.set(true);

    this.adminService.getPets().subscribe({
      next: (pets) => {
        this.pets.set(pets);
        this.filteredPets.set(pets);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading pets:', error);
        this.isLoading.set(false);
        this.toastService.error('Erro ao carregar pets: ' + (error.error?.message || 'Erro desconhecido'));
      }
    });
  }

  getPetsByStatus(status: string): Pet[] {
    return this.pets().filter(p => p.status === status);
  }

  getPetsBySpecies(species: string): Pet[] {
    return this.pets().filter(p => p.species === species);
  }

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.applyFilters();
  }

  onFilterSpecies(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.speciesFilter = select.value;
    this.applyFilters();
  }

  onFilterStatus(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.statusFilter = select.value;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.pets();

    if (this.speciesFilter) {
      filtered = filtered.filter(p => p.species === this.speciesFilter);
    }

    if (this.statusFilter) {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    if (this.searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(this.searchTerm) ||
        p.breed?.toLowerCase().includes(this.searchTerm) ||
        p.location?.toLowerCase().includes(this.searchTerm) ||
        p.ong?.ongName?.toLowerCase().includes(this.searchTerm)
      );
    }

    this.filteredPets.set(filtered);
  }

  getPrimaryImage(pet: Pet): string | null {
    const primaryImage = pet.images?.find(img => img.isPrimary);
    return primaryImage?.imageUrl || pet.images?.[0]?.imageUrl || null;
  }

  getSpeciesLabel(species: string): string {
    const labels: Record<string, string> = {
      dog: 'Cão',
      cat: 'Gato',
      fish: 'Peixe',
      hamster: 'Hamster'
    };
    return labels[species] || species;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      available: 'Disponível',
      adopted: 'Adotado',
      pending: 'Pendente'
    };
    return labels[status] || status;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  viewPet(petId: string) {
    window.open(`/pets/${petId}`, '_blank');
  }

  deletePet(petId: string, petName: string) {
    if (!confirm(`Tem certeza que deseja excluir o pet "${petName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    this.adminService.deletePet(petId).subscribe({
      next: () => {
        this.toastService.success('Pet excluído com sucesso!');
        this.loadPets();
      },
      error: (error) => {
        console.error('Error deleting pet:', error);
        this.toastService.error('Erro ao excluir pet: ' + (error.error?.message || 'Erro desconhecido'));
      }
    });
  }
}
