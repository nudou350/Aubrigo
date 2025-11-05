import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';
import { PORTUGAL_CITIES } from '../../../core/constants/portugal-cities';

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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="pet-form-page">
      <div class="form-header">
        <a routerLink="/ong/dashboard" class="back-link">
          ← Voltar
        </a>
        <h1>{{ isEditMode() ? 'Editar Pet' : 'Adicionar Novo Pet' }}</h1>
        <p>{{ isEditMode() ? 'Atualize as informações do pet' : 'Preencha os dados do novo animal' }}</p>
      </div>

      <form [formGroup]="petForm" (ngSubmit)="onSubmit()" class="pet-form">
        <!-- Images Section -->
        <div class="form-section">
          <h2>📸 Fotos do Pet</h2>
          <p class="section-desc">Adicione fotos de qualidade para aumentar as chances de adoção</p>

          <div class="images-grid">
            @for (image of images(); track $index) {
              <div class="image-card" [class.primary]="image.isPrimary">
                <img [src]="image.preview || image.imageUrl" [alt]="'Foto ' + ($index + 1)" />
                <div class="image-overlay">
                  @if (!image.isPrimary) {
                    <button type="button" class="btn-icon" (click)="setPrimaryImage($index)">
                      ⭐ Principal
                    </button>
                  }
                  <button type="button" class="btn-icon danger" (click)="removeImage($index)">
                    🗑️ Remover
                    </button>
                </div>
                @if (image.isPrimary) {
                  <div class="primary-badge">★ Principal</div>
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
                <span>Adicionar Foto</span>
                <small>Max 5 fotos</small>
              </label>
            }
          </div>
        </div>

        <!-- Basic Info -->
        <div class="form-section">
          <h2>🐾 Informações Básicas</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="name">Nome do Pet *</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                placeholder="Ex: Plutão"
                class="form-control"
              />
              @if (petForm.get('name')?.invalid && petForm.get('name')?.touched) {
                <span class="error">Nome é obrigatório</span>
              }
            </div>

            <div class="form-group">
              <label for="species">Espécie *</label>
              <select id="species" formControlName="species" class="form-control">
                <option value="">Selecione...</option>
                <option value="dog">Cachorro</option>
                <option value="cat">Gato</option>
                <option value="fish">Peixe</option>
                <option value="hamster">Hamster</option>
              </select>
              @if (petForm.get('species')?.invalid && petForm.get('species')?.touched) {
                <span class="error">Espécie é obrigatória</span>
              }
            </div>

            <div class="form-group">
              <label for="breed">Raça</label>
              <input
                id="breed"
                type="text"
                formControlName="breed"
                placeholder="Ex: Border Collie"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="age">Idade (anos) *</label>
              <input
                id="age"
                type="number"
                formControlName="age"
                placeholder="Ex: 3"
                min="0"
                max="30"
                class="form-control"
              />
              @if (petForm.get('age')?.invalid && petForm.get('age')?.touched) {
                <span class="error">Idade é obrigatória</span>
              }
            </div>

            <div class="form-group">
              <label for="gender">Gênero *</label>
              <select id="gender" formControlName="gender" class="form-control">
                <option value="">Selecione...</option>
                <option value="male">Macho</option>
                <option value="female">Fêmea</option>
              </select>
              @if (petForm.get('gender')?.invalid && petForm.get('gender')?.touched) {
                <span class="error">Gênero é obrigatório</span>
              }
            </div>

            <div class="form-group">
              <label for="size">Porte *</label>
              <select id="size" formControlName="size" class="form-control">
                <option value="">Selecione...</option>
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
              </select>
              @if (petForm.get('size')?.invalid && petForm.get('size')?.touched) {
                <span class="error">Porte é obrigatório</span>
              }
            </div>

            <div class="form-group">
              <label for="color">Cor</label>
              <input
                id="color"
                type="text"
                formControlName="color"
                placeholder="Ex: Preto e branco"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label for="weight">Peso (kg)</label>
              <input
                id="weight"
                type="number"
                formControlName="weight"
                placeholder="Ex: 18.5"
                step="0.1"
                min="0"
                class="form-control"
              />
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="form-section">
          <h2>📝 Descrição</h2>
          <div class="form-group">
            <label for="description">Conte sobre a personalidade e história do pet</label>
            <textarea
              id="description"
              formControlName="description"
              rows="6"
              placeholder="Ex: O Plutão é um Border Collie muito inteligente e enérgico! Adora brincar e aprender novos truques..."
              class="form-control"
            ></textarea>
            <small class="hint">{{ petForm.get('description')?.value?.length || 0 }} / 1000 caracteres</small>
          </div>
        </div>

        <!-- Location & Status -->
        <div class="form-section">
          <h2>📍 Localização e Status</h2>
          <div class="form-grid">
            <div class="form-group">
              <label for="location">Cidade *</label>
              <select id="location" formControlName="location" class="form-control">
                <option value="">Selecione a cidade...</option>
                @for (city of cities; track city) {
                  <option [value]="city">{{ city }}</option>
                }
              </select>
              @if (petForm.get('location')?.invalid && petForm.get('location')?.touched) {
                <span class="error">Cidade é obrigatória</span>
              }
            </div>

            @if (isEditMode()) {
              <div class="form-group">
                <label for="status">Status</label>
                <select id="status" formControlName="status" class="form-control">
                  <option value="available">Disponível</option>
                  <option value="pending">Pendente</option>
                  <option value="adopted">Adotado</option>
                </select>
              </div>
            }
          </div>
        </div>

        <!-- Submit -->
        <div class="form-actions">
          <button type="button" routerLink="/pets/manage" class="btn-cancel">
            Cancelar
          </button>
          <button type="submit" class="btn-submit" [disabled]="isSubmitting()">
            @if (isSubmitting()) {
              <span class="spinner-small"></span>
              <span>Salvando...</span>
            } @else {
              <span>{{ isEditMode() ? 'Atualizar Pet' : 'Cadastrar Pet' }}</span>
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
        display: inline-block;

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
  petId: string | null = null;
  cities = PORTUGAL_CITIES;

  private toastService = inject(ToastService);

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

        if (pet.images) {
          this.images.set(pet.images.map((img: any) => ({
            id: img.id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary
          })));
        }
      },
      error: (error) => {
        console.error('Error loading pet:', error);
        this.toastService.error('Erro ao carregar dados do pet');
        this.router.navigate(['/pets/manage']);
      }
    });
  }

  onImageSelect(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      this.toastService.warning('Por favor, selecione apenas imagens');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastService.warning('Imagem muito grande. Tamanho máximo: 5MB');
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
      const newImages = imgs.filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return newImages;
    });
  }

  async onSubmit() {
    if (this.petForm.invalid) {
      Object.keys(this.petForm.controls).forEach(key => {
        this.petForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.images().length === 0) {
      this.toastService.warning('Por favor, adicione pelo menos uma foto do pet');
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();
    Object.keys(this.petForm.value).forEach(key => {
      const value = this.petForm.value[key];
      if (value !== null && value !== '') {
        formData.append(key, value);
      }
    });

    // Add new images
    this.images().forEach((img, index) => {
      if (img.file) {
        formData.append('images', img.file);
        if (img.isPrimary) {
          formData.append('primaryImageIndex', index.toString());
        }
      }
    });

    const request = this.isEditMode()
      ? this.http.put(`${this.apiUrl}/pets/${this.petId}`, formData)
      : this.http.post(`${this.apiUrl}/pets`, formData);

    request.subscribe({
      next: () => {
        this.toastService.success(this.isEditMode() ? 'Pet atualizado com sucesso!' : 'Pet cadastrado com sucesso!');
        this.router.navigate(['/pets/manage']);
      },
      error: (error) => {
        console.error('Error saving pet:', error);
        this.toastService.error('Erro ao salvar pet: ' + (error.error?.message || 'Erro desconhecido'));
        this.isSubmitting.set(false);
      }
    });
  }
}
