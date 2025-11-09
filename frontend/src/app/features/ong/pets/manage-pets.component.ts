import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { OngService } from '../../../core/services/ong.service';
import { ToastService } from '../../../core/services/toast.service';
import { Pet } from '../../../core/services/pets.service';

@Component({
  selector: 'app-manage-pets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="manage-pets">
      <a routerLink="/ong/dashboard" class="back-link">
        {{ 'ong.common.back' | translate }}
      </a>
      <header class="page-header">
        <div>
          <h1>{{ 'ong.pets.pageTitle' | translate }}</h1>
          <p>{{ 'ong.pets.subtitle' | translate }}</p>
        </div>
        <a routerLink="/pets/add" class="btn-add">
          {{ 'ong.pets.addNewButton' | translate }}
        </a>
      </header>

      <div class="filters">
        <input
          type="text"
          [placeholder]="'ong.pets.searchPlaceholder' | translate"
          class="search-input"
          [(ngModel)]="searchTerm"
          (input)="filterPets()"
        />
        <select class="filter-select" [(ngModel)]="filterStatus" (change)="filterPets()">
          <option value="">{{ 'ong.pets.filters.allStatus' | translate }}</option>
          <option value="available">{{ 'ong.pets.filters.available' | translate }}</option>
          <option value="pending">{{ 'ong.pets.filters.pending' | translate }}</option>
          <option value="adopted">{{ 'ong.pets.filters.adopted' | translate }}</option>
        </select>
        <select class="filter-select" [(ngModel)]="filterSpecies" (change)="filterPets()">
          <option value="">{{ 'ong.pets.filters.allSpecies' | translate }}</option>
          <option value="dog">{{ 'ong.pets.filters.dog' | translate }}</option>
          <option value="cat">{{ 'ong.pets.filters.cat' | translate }}</option>
          <option value="fish">{{ 'ong.pets.filters.fish' | translate }}</option>
          <option value="hamster">{{ 'ong.pets.filters.hamster' | translate }}</option>
        </select>
      </div>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>{{ 'ong.pets.loadingPets' | translate }}</p>
        </div>
      } @else if (filteredPets().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🐾</div>
          <h3>{{ 'ong.pets.noPetsFound' | translate }}</h3>
          <p>{{ 'ong.pets.noPetsDescription' | translate }}</p>
          <a routerLink="/pets/add" class="btn-primary">
            {{ 'ong.pets.addPetButton' | translate }}
          </a>
        </div>
      } @else {
        <div class="pets-grid">
          @for (pet of filteredPets(); track pet.id) {
            <div class="pet-card">
              <div class="pet-image">
                <img
                  [src]="getPrimaryImage(pet)"
                  [alt]="pet.name"
                  (error)="onImageError($event)"
                />
                <div class="pet-status" [class]="pet.status">
                  {{ getStatusLabel(pet.status) }}
                </div>
              </div>
              <div class="pet-info">
                <h3>{{ pet.name }}</h3>
                <div class="pet-details">
                  <span class="detail-badge">{{ getSpeciesLabel(pet.species) }}</span>
                  <span class="detail-badge">{{ pet.breed }}</span>
                  <span class="detail-badge">{{ pet.age }} {{ pet.age === 1 ? ('ong.common.year' | translate) : ('ong.common.years' | translate) }}</span>
                </div>
                <div class="pet-meta">
                  <span>{{ getGenderLabel(pet.gender || '') }}</span>
                  <span>•</span>
                  <span>{{ getSizeLabel(pet.size || '') }}</span>
                </div>
              </div>
              <div class="pet-actions">
                <a [routerLink]="['/pets/edit', pet.id]" class="btn-edit">
                  {{ 'ong.pets.editButton' | translate }}
                </a>
                <button class="btn-delete" (click)="deletePet(pet.id, pet.name)">
                  {{ 'ong.pets.removeButton' | translate }}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .manage-pets {
      max-width: 1440px;
      margin: 0 auto;
      padding: 40px 24px;
      padding-bottom: 100px;
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

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      gap: 24px;

      h1 {
        font-size: 32px;
        color: #2C2C2C;
        margin: 0 0 8px 0;
      }

      p {
        color: #666;
        margin: 0;
      }

      .btn-add {
        background: #5CB5B0;
        color: white;
        padding: 14px 28px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        white-space: nowrap;
        transition: all 0.2s;

        &:hover {
          background: #4A9792;
          transform: translateY(-2px);
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
      transition: all 0.2s;

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
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #5CB5B0;
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
        margin: 0 0 32px 0;
      }

      .btn-primary {
        background: #5CB5B0;
        color: white;
        padding: 14px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        display: inline-block;
        transition: all 0.2s;

        &:hover {
          background: #4A9792;
        }
      }
    }

    .pets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
    }

    .pet-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
      }
    }

    .pet-image {
      position: relative;
      width: 100%;
      height: 240px;
      overflow: hidden;
      background: #F5F5F5;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .pet-status {
        position: absolute;
        top: 12px;
        right: 12px;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;

        &.available {
          background: #27AE60;
          color: white;
        }

        &.pending {
          background: #F5A623;
          color: white;
        }

        &.adopted {
          background: #666;
          color: white;
        }
      }
    }

    .pet-info {
      padding: 20px;

      h3 {
        font-size: 20px;
        color: #2C2C2C;
        margin: 0 0 12px 0;
      }

      .pet-details {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
      }

      .detail-badge {
        background: #B8E3E1;
        color: #2C2C2C;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
      }

      .pet-meta {
        display: flex;
        gap: 8px;
        color: #666;
        font-size: 14px;
      }
    }

    .pet-actions {
      display: flex;
      padding: 16px 20px;
      gap: 12px;
      border-top: 1px solid #E0E0E0;

      .btn-edit, .btn-delete {
        flex: 1;
        padding: 10px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
        text-decoration: none;
        border: none;
      }

      .btn-edit {
        background: #5CB5B0;
        color: white;

        &:hover {
          background: #4A9792;
        }
      }

      .btn-delete {
        background: #FFEBEE;
        color: #E74C3C;

        &:hover {
          background: #E74C3C;
          color: white;
        }
      }
    }

    @media (max-width: 768px) {
      .manage-pets {
        padding: 24px 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;

        .btn-add {
          width: 100%;
          text-align: center;
        }
      }

      .filters {
        flex-direction: column;

        .search-input, .filter-select {
          width: 100%;
        }
      }

      .pets-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ManagePetsComponent implements OnInit {
  private http = inject(HttpClient);
  private ongService = inject(OngService);
  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  isLoading = signal(true);
  pets = signal<Pet[]>([]);
  filteredPets = signal<Pet[]>([]);

  searchTerm = '';
  filterStatus = '';
  filterSpecies = '';

  ngOnInit() {
    this.loadPets();
  }

  loadPets() {
    this.isLoading.set(true);
    this.ongService.getMyPets().subscribe({
      next: (pets) => {
        this.pets.set(pets);
        this.filteredPets.set(pets);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastService.error(this.translate.instant('ong.pets.errorLoad'));
        this.isLoading.set(false);
      }
    });
  }

  filterPets() {
    let filtered = this.pets();

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(pet =>
        pet.name.toLowerCase().includes(term) ||
        pet.breed?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (this.filterStatus) {
      filtered = filtered.filter(pet => pet.status === this.filterStatus);
    }

    // Filter by species
    if (this.filterSpecies) {
      filtered = filtered.filter(pet => pet.species === this.filterSpecies);
    }

    this.filteredPets.set(filtered);
  }

  deletePet(id: string, name: string) {
    const confirmMsg = this.translate.instant('ong.pets.confirmRemove', { name });
    if (!confirm(confirmMsg)) {
      return;
    }

    this.http.delete(`${environment.apiUrl}/pets/${id}`).subscribe({
      next: () => {
        this.pets.update(list => list.filter(p => p.id !== id));
        this.filterPets();
        this.toastService.success(this.translate.instant('ong.pets.removeSuccess', { name }));
      },
      error: (error) => {
        this.toastService.error(this.translate.instant('ong.pets.removeError', { error: error.error?.message || '' }));
      }
    });
  }

  getPrimaryImage(pet: Pet): string {
    const primaryImage = pet.images?.find(img => img.isPrimary);
    return primaryImage?.imageUrl || pet.images?.[0]?.imageUrl || '/assets/images/placeholder-pet.jpg';
  }

  onImageError(event: any) {
    event.target.src = '/assets/images/placeholder-pet.jpg';
  }

  getStatusLabel(status: string): string {
    const keys: any = {
      available: 'ong.pets.filters.available',
      pending: 'ong.pets.filters.pending',
      adopted: 'ong.pets.filters.adopted'
    };
    return this.translate.instant(keys[status] || status);
  }

  getSpeciesLabel(species: string): string {
    const keys: any = {
      dog: 'ong.pets.filters.dog',
      cat: 'ong.pets.filters.cat',
      fish: 'ong.pets.filters.fish',
      hamster: 'ong.pets.filters.hamster'
    };
    return this.translate.instant(keys[species] || species);
  }

  getGenderLabel(gender: string): string {
    const keys: any = {
      male: 'ong.pets.labels.male',
      female: 'ong.pets.labels.female'
    };
    return this.translate.instant(keys[gender] || gender);
  }

  getSizeLabel(size: string): string {
    const keys: any = {
      small: 'ong.pets.labels.small',
      medium: 'ong.pets.labels.medium',
      large: 'ong.pets.labels.large'
    };
    return this.translate.instant(keys[size] || size);
  }
}
