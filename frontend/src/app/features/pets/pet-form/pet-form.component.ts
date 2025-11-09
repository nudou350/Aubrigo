import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { CityService } from '../../../core/services/city.service';
import { normalizeImageUrl } from '../../../core/utils/image-url.util';

interface PetImage {
  id?: string;
  imageUrl: string;
  isPrimary: boolean;
  file?: File;
  preview?: string;
}

@Component({
  selector: 'app-pet-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="pet-form-page">
      <div class="form-header">
        <a routerLink="/pets/manage" class="back-link">
          ← {{ 'common.back' | translate }}
        </a>
        <h1>{{ (isEditMode() ? 'pets.form.editPet' : 'pets.form.addPet') | translate }}</h1>
        <p>{{ (isEditMode() ? 'pets.form.editPet' : 'pets.form.addPet') | translate }}</p>
      </div>

      <form [formGroup]="petForm" (ngSubmit)="onSubmit()" class="pet-form">
        <!-- Images Section -->
        <div class="form-section">
          <h2>📸 {{ 'pets.form.images' | translate }}</h2>
          <p class="section-desc">{{ 'pets.form.uploadImages' | translate }}</p>

          <div class="images-grid">
            @for (image of images(); track $index) {
              <div class="image-card" [class.primary]="image.isPrimary">
                <img [src]="image.preview || image.imageUrl" [alt]="'Foto ' + ($index + 1)" />
                <div class="image-overlay">
                  @if (!image.isPrimary) {
                    <button type="button" class="btn-icon" (click)="setPrimaryImage($index)">
                      ⭐ {{ 'pets.form.primaryImage' | translate }}
                    </button>
                  }
                  <button type="button" class="btn-icon danger" (click)="removeImage($index)">
                    🗑️ {{ 'common.remove' | translate }}
                    </button>
                </div>
                @if (image.isPrimary) {
                  <div class="primary-badge">★ {{ 'pets.form.primaryImage' | translate }}</div>
                }
              </div>
            }
            @if (images().length < 5) {
              <label class="image-upload-card">
                <input
                  type="file"
                  accept="image/*"
                  (change)="onImageSelect($event)"
                  hidden
                />
                <div class="upload-icon">📷</div>
                <span>{{ 'common.add' | translate }}</span>
                <small>Max 5</small>
              </label>
            }
          </div>
        </div>

        <!-- Basic Info -->
        <div class="form-section">
          <h2>🐾 {{ 'pets.form.name' | translate }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="name">{{ 'pets.form.name' | translate }} *</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                [placeholder]="'pets.form.namePlaceholder' | translate"
                class="form-control"
              />
              @if (petForm.get('name')?.invalid && petForm.get('name')?.touched) {
                <span class="error">{{ 'validation.required' | translate }}</span>
              }
            </div>

            <div class="form-group">
              <label for="species">{{ 'pets.form.species' | translate }} *</label>
              <select id="species" formControlName="species" class="form-control">
                <option value="">{{ 'common.all' | translate }}...</option>
                <option value="dog">{{ 'home.species.dog' | translate }}</option>
                <option value="cat">{{ 'home.species.cat' | translate }}</option>
                <option value="fish">{{ 'home.species.fish' | translate }}</option>
                <option value="hamster">{{ 'home.species.hamster' | translate }}</option>
              </select>
              @if (petForm.get('species')?.invalid && petForm.get('species')?.touched) {
                <span class="error">{{ 'validation.required' | translate }}</span>
              }
            </div>

            <div class="form-group">
              <label for="breed">{{ 'pets.form.breed' | translate }}</label>
              <input
                id="breed"
                type="text"
                formControlName="breed"
                [placeholder]="'pets.form.breedPlaceholder' | translate"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="age">{{ 'pets.form.age' | translate }} *</label>
              <input
                id="age"
                type="number"
                formControlName="age"
                [placeholder]="'pets.form.agePlaceholder' | translate"
                min="0"
                max="30"
                class="form-control"
              />
              @if (petForm.get('age')?.invalid && petForm.get('age')?.touched) {
                <span class="error">{{ 'validation.required' | translate }}</span>
              }
            </div>

            <div class="form-group">
              <label for="gender">{{ 'pets.form.gender' | translate }} *</label>
              <select id="gender" formControlName="gender" class="form-control">
                <option value="">{{ 'common.all' | translate }}...</option>
                <option value="male">{{ 'home.filters.male' | translate }}</option>
                <option value="female">{{ 'home.filters.female' | translate }}</option>
              </select>
              @if (petForm.get('gender')?.invalid && petForm.get('gender')?.touched) {
                <span class="error">{{ 'validation.required' | translate }}</span>
              }
            </div>

            <div class="form-group">
              <label for="size">{{ 'pets.form.size' | translate }} *</label>
              <select id="size" formControlName="size" class="form-control">
                <option value="">{{ 'common.all' | translate }}...</option>
                <option value="small">{{ 'home.filters.small' | translate }}</option>
                <option value="medium">{{ 'home.filters.medium' | translate }}</option>
                <option value="large">{{ 'home.filters.large' | translate }}</option>
              </select>
              @if (petForm.get('size')?.invalid && petForm.get('size')?.touched) {
                <span class="error">{{ 'validation.required' | translate }}</span>
              }
            </div>

            <div class="form-group">
              <label for="color">{{ 'pets.form.color' | translate }}</label>
              <input
                id="color"
                type="text"
                formControlName="color"
                [placeholder]="'pets.form.colorPlaceholder' | translate"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="weight">{{ 'pets.form.weight' | translate }}</label>
              <input
                id="weight"
                type="number"
                formControlName="weight"
                [placeholder]="'pets.form.weightPlaceholder' | translate"
                step="0.1"
                min="0"
                class="form-control"
              />
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="form-section">
          <h2>📝 {{ 'pets.form.description' | translate }}</h2>
          <div class="form-group">
            <label for="description">{{ 'pets.form.description' | translate }}</label>
            <textarea
              id="description"
              formControlName="description"
              rows="6"
              [placeholder]="'pets.form.descriptionPlaceholder' | translate"
              class="form-control"
            ></textarea>
            <small class="hint">{{ petForm.get('description')?.value?.length || 0 }} / 1000 caracteres</small>
          </div>
        </div>

        <!-- Location & Status -->
        <div class="form-section">
          <h2>📍 {{ 'pets.form.location' | translate }}</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="location">{{ 'pets.form.location' | translate }} *</label>
              <div class="location-typeahead-container" style="position: relative;">
                <input
                  id="location"
                  type="text"
                  [value]="locationInput()"
                  (input)="onLocationInput($event)"
                  (focus)="onLocationFocus()"
                  (keydown)="onLocationKeydown($event)"
                  [placeholder]="'pets.form.locationPlaceholder' | translate"
                  class="form-control"
                  autocomplete="off"
                />
                @if (showLocationDropdown() && filteredCities().length > 0) {
                  <div class="typeahead-dropdown">
                    @for (city of filteredCities(); track $index) {
                      <button
                        type="button"
                        class="typeahead-option"
                        [class.selected]="selectedLocationIndex() === $index"
                        (click)="selectLocation(city)"
                      >
                        📍 {{ city }}
                      </button>
                    }
                  </div>
                }
              </div>
              @if (petForm.get('location')?.invalid && petForm.get('location')?.touched) {
                <span class="error">{{ 'validation.required' | translate }}</span>
              }
            </div>

            @if (isEditMode()) {
              <div class="form-group">
                <label for="status">{{ 'pets.form.status' | translate }}</label>
                <div class="status-typeahead-container" style="position: relative;">
                  <input
                    id="status"
                    type="text"
                    [value]="statusInput()"
                    (input)="onStatusInput($event)"
                    (focus)="onStatusFocus()"
                    (keydown)="onStatusKeydown($event)"
                    [placeholder]="'pets.form.statusPlaceholder' | translate"
                    class="form-control"
                    autocomplete="off"
                  />
                  @if (showStatusDropdown() && filteredStatuses().length > 0) {
                    <div class="typeahead-dropdown">
                      @for (status of filteredStatuses(); track $index) {
                        <button
                          type="button"
                          class="typeahead-option"
                          [class.selected]="selectedStatusIndex() === $index"
                          (click)="selectStatus(status)"
                        >
                          {{ status.label }}
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Submit -->
        <div class="form-actions">
          <button type="button" routerLink="/pets/manage" class="btn-cancel">
            {{ 'common.cancel' | translate }}
          </button>
          <button type="submit" class="btn-submit" [disabled]="isSubmitting()">
            @if (isSubmitting()) {
              <span class="spinner-small"></span>
              <span>{{ 'common.loading' | translate }}</span>
            } @else {
              <span>{{ 'pets.form.saveButton' | translate }}</span>
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .pet-form-page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 24px;
      padding-bottom: 100px;
    }

    .form-header {
      margin-bottom: 40px;

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

      h1 {
        font-size: 32px;
        color: #2C2C2C;
        margin: 0 0 8px 0;
      }

      p {
        color: #666;
        margin: 0;
      }
    }

    .pet-form {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    .form-section {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      h2 {
        font-size: 24px;
        color: #2C2C2C;
        margin: 0 0 8px 0;
      }

      .section-desc {
        color: #666;
        margin: 0 0 24px 0;
        font-size: 14px;
      }
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
    }

    .image-card {
      position: relative;
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid #E0E0E0;

      &.primary {
        border-color: #F5A623;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .image-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover .image-overlay {
        opacity: 1;
      }

      .btn-icon {
        background: white;
        color: #2C2C2C;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;

        &.danger {
          background: #E74C3C;
          color: white;
        }
      }

      .primary-badge {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #F5A623;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
    }

    .image-upload-card {
      aspect-ratio: 1;
      border: 2px dashed #5CB5B0;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      background: #F0FFFE;
      transition: all 0.2s;

      &:hover {
        background: #E1F9F7;
        transform: scale(1.02);
      }

      .upload-icon {
        font-size: 40px;
      }

      span {
        color: #5CB5B0;
        font-weight: 600;
      }

      small {
        color: #666;
        font-size: 12px;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-weight: 600;
        color: #2C2C2C;
        font-size: 14px;
      }

      .form-control {
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

      textarea.form-control {
        resize: vertical;
        font-family: inherit;
      }

      .error {
        color: #E74C3C;
        font-size: 13px;
      }

      .hint {
        color: #999;
        font-size: 12px;
      }
    }

    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      padding-top: 24px;

      .btn-cancel, .btn-submit {
        padding: 14px 32px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .btn-cancel {
        background: #F5F5F5;
        color: #666;

        &:hover {
          background: #E0E0E0;
        }
      }

      .btn-submit {
        background: #5CB5B0;
        color: white;
        display: flex;
        align-items: center;
        gap: 8px;

        &:hover:not(:disabled) {
          background: #4A9792;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .typeahead-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
      max-height: 200px;
      overflow-y: auto;
    }

    .typeahead-option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border: none;
      background: white;
      text-align: left;
      cursor: pointer;
      transition: background 0.2s;
      font-size: 14px;
      color: #2C2C2C;

      &:hover {
        background: #F0FFFE;
      }

      &:active {
        background: #E1F9F7;
      }

      &.selected {
        background: #E1F9F7;
        font-weight: 600;
      }
    }

    @media (max-width: 768px) {
      .pet-form-page {
        padding: 24px 16px;
      }

      .form-section {
        padding: 24px 20px;
      }

      .images-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;

        .btn-cancel, .btn-submit {
          width: 100%;
        }
      }
    }
  `]
})
export class PetFormComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  petForm: FormGroup;
  isEditMode = signal(false);
  isSubmitting = signal(false);
  images = signal<PetImage[]>([]);
  deletedImageIds = signal<string[]>([]);
  petId: string | null = null;

  // CityService integration
  private cityService = inject(CityService);
  cities = this.cityService.cities;

  // Location typeahead
  showLocationDropdown = signal(false);
  filteredCities = signal<string[]>([]);
  locationInput = signal('');
  selectedLocationIndex = signal(-1);

  // Status typeahead
  showStatusDropdown = signal(false);
  filteredStatuses = signal<{value: string, label: string}[]>([]);
  statusInput = signal('');
  selectedStatusIndex = signal(-1);

  get availableStatuses() {
    return [
      { value: 'available', label: this.translate.instant('pets.form.available') },
      { value: 'pending', label: this.translate.instant('pets.form.pending') },
      { value: 'adopted', label: this.translate.instant('pets.form.adopted') }
    ];
  }

  private toastService = inject(ToastService);
  private translate = inject(TranslateService);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.petForm = this.fb.group({
      name: ['', Validators.required],
      species: ['', Validators.required],
      breed: [''],
      age: ['', [Validators.required, Validators.min(0), Validators.max(30)]],
      gender: ['', Validators.required],
      size: ['', Validators.required],
      color: [''],
      weight: [''],
      description: ['', Validators.maxLength(1000)],
      location: ['', Validators.required],
      status: ['available']
    });
  }

  ngOnInit() {
    this.petId = this.route.snapshot.paramMap.get('id');
    if (this.petId) {
      this.isEditMode.set(true);
      this.loadPetData(this.petId);
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.location-typeahead-container')) {
        this.showLocationDropdown.set(false);
      }
      if (!target.closest('.status-typeahead-container')) {
        this.showStatusDropdown.set(false);
      }
    });
  }

  loadPetData(id: string) {
    this.http.get<any>(`${this.apiUrl}/pets/${id}`).subscribe({
      next: (pet) => {
        this.petForm.patchValue({
          name: pet.name,
          species: pet.species,
          breed: pet.breed,
          age: pet.age,
          gender: pet.gender,
          size: pet.size,
          color: pet.color,
          weight: pet.weight,
          description: pet.description,
          location: pet.location,
          status: pet.status
        });

        // Set typeahead inputs
        this.locationInput.set(pet.location || '');
        const statusObj = this.availableStatuses.find(s => s.value === pet.status);
        this.statusInput.set(statusObj?.label || '');

        if (pet.images) {
          this.images.set(pet.images.map((img: any) => ({
            id: img.id,
            imageUrl: normalizeImageUrl(img.imageUrl),
            isPrimary: img.isPrimary
          })));
        }
      },
      error: (error) => {
        this.toastService.error(this.translate.instant('pets.form.error'));
        this.router.navigate(['/pets/manage']);
      }
    });
  }

  onImageSelect(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate image type (PNG, JPEG, WebP)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      this.toastService.warning(this.translate.instant('validation.pattern'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastService.warning(this.translate.instant('validation.max'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.images.update(imgs => [
        ...imgs,
        {
          imageUrl: '',
          isPrimary: imgs.length === 0,
          file,
          preview: e.target.result
        }
      ]);
    };
    reader.readAsDataURL(file);
  }

  setPrimaryImage(index: number) {
    this.images.update(imgs => imgs.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  }

  removeImage(index: number) {
    this.images.update(imgs => {
      const imageToRemove = imgs[index];

      // If it's an existing image (has ID), track it for deletion
      if (imageToRemove.id) {
        this.deletedImageIds.update(ids => [...ids, imageToRemove.id!]);
      }

      const newImages = imgs.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  }

  // Location typeahead methods
  onLocationFocus() {
    this.filteredCities.set(this.cityService.filterCities('', 5));
    this.showLocationDropdown.set(true);
    this.selectedLocationIndex.set(-1);
  }

  onLocationInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.trim();
    this.locationInput.set(input);

    if (!input) {
      this.filteredCities.set(this.cityService.filterCities('', 5));
      this.petForm.patchValue({ location: '' });
    } else {
      this.filteredCities.set(this.cityService.filterCities(input, 5));
    }

    this.showLocationDropdown.set(true);
    this.selectedLocationIndex.set(-1);
  }

  onLocationKeydown(event: KeyboardEvent) {
    const cities = this.filteredCities();

    if (!this.showLocationDropdown() || cities.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedLocationIndex.update(idx =>
          idx < cities.length - 1 ? idx + 1 : idx
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedLocationIndex.update(idx =>
          idx > 0 ? idx - 1 : -1
        );
        break;

      case 'Enter':
        event.preventDefault();
        const selectedIdx = this.selectedLocationIndex();
        if (selectedIdx >= 0 && selectedIdx < cities.length) {
          this.selectLocation(cities[selectedIdx]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.showLocationDropdown.set(false);
        this.selectedLocationIndex.set(-1);
        break;
    }
  }

  selectLocation(city: string) {
    this.locationInput.set(city);
    this.petForm.patchValue({ location: city });
    this.showLocationDropdown.set(false);
    this.selectedLocationIndex.set(-1);
  }

  // Status typeahead methods
  onStatusFocus() {
    this.filteredStatuses.set(this.availableStatuses);
    this.showStatusDropdown.set(true);
    this.selectedStatusIndex.set(-1);
  }

  onStatusInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.trim();
    this.statusInput.set(input);

    if (!input) {
      this.filteredStatuses.set(this.availableStatuses);
      this.petForm.patchValue({ status: 'available' });
    } else {
      const filtered = this.availableStatuses.filter(status =>
        status.label.toLowerCase().includes(input.toLowerCase())
      );
      this.filteredStatuses.set(filtered);
    }

    this.showStatusDropdown.set(true);
    this.selectedStatusIndex.set(-1);
  }

  onStatusKeydown(event: KeyboardEvent) {
    const statuses = this.filteredStatuses();

    if (!this.showStatusDropdown() || statuses.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedStatusIndex.update(idx =>
          idx < statuses.length - 1 ? idx + 1 : idx
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedStatusIndex.update(idx =>
          idx > 0 ? idx - 1 : -1
        );
        break;

      case 'Enter':
        event.preventDefault();
        const selectedIdx = this.selectedStatusIndex();
        if (selectedIdx >= 0 && selectedIdx < statuses.length) {
          this.selectStatus(statuses[selectedIdx]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.showStatusDropdown.set(false);
        this.selectedStatusIndex.set(-1);
        break;
    }
  }

  selectStatus(status: { value: string, label: string }) {
    this.statusInput.set(status.label);
    this.petForm.patchValue({ status: status.value });
    this.showStatusDropdown.set(false);
    this.selectedStatusIndex.set(-1);
  }

  async onSubmit() {
    if (this.petForm.invalid) {
      Object.keys(this.petForm.controls).forEach(key => {
        this.petForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.images().length === 0) {
      this.toastService.warning(this.translate.instant('validation.required'));
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();

    // Add form fields, excluding 'status' when creating a new pet
    Object.keys(this.petForm.value).forEach(key => {
      const value = this.petForm.value[key];

      // Skip 'status' field when not in edit mode
      if (key === 'status' && !this.isEditMode()) {
        return;
      }

      if (value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    // Add deleted image IDs (for edit mode)
    if (this.isEditMode() && this.deletedImageIds().length > 0) {
      formData.append('deletedImageIds', this.deletedImageIds().join(','));
    }

    // Add primary image ID (for edit mode)
    if (this.isEditMode()) {
      const primaryImage = this.images().find(img => img.isPrimary);
      if (primaryImage && primaryImage.id) {
        formData.append('primaryImageId', primaryImage.id);
      }
    }

    // Add new images (reorganize so primary is first for create mode)
    const newImages = this.images().filter(img => img.file);

    if (!this.isEditMode() && newImages.length > 0) {
      // For create mode: sort images so primary is first
      const sortedImages = [...newImages].sort((a, b) => {
        if (a.isPrimary) return -1;
        if (b.isPrimary) return 1;
        return 0;
      });

      sortedImages.forEach(img => {
        formData.append('images', img.file!);
      });
    } else {
      // For edit mode: just add images in order
      newImages.forEach(img => {
        formData.append('images', img.file!);
      });
    }

    const request = this.isEditMode()
      ? this.http.put(`${this.apiUrl}/pets/${this.petId}`, formData)
      : this.http.post(`${this.apiUrl}/pets`, formData);

    request.subscribe({
      next: () => {
        this.toastService.success(this.translate.instant(this.isEditMode() ? 'pets.form.successEdit' : 'pets.form.successAdd'));
        this.router.navigate(['/pets/manage']);
      },
      error: (error) => {
        this.toastService.error(this.translate.instant('pets.form.error'));
        this.isSubmitting.set(false);
      }
    });
  }
}
