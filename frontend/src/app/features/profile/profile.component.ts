import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { OngService } from '../../core/services/ong.service';
import { ToastService } from '../../core/services/toast.service';
import { FavoritesService } from '../../core/services/favorites.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-container">
      <header class="profile-header">
        <button class="back-button" (click)="goBack()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1>Meu Perfil</h1>
        <div class="spacer"></div>
      </header>

      @if (loading()) {
        <div class="loading-container">
          <div class="spinner"></div>
          <p>Carregando perfil...</p>
        </div>
      } @else {
        <div class="profile-content">
          <!-- Profile Image Section -->
          <div class="profile-image-section">
            <div class="image-wrapper">
              @if (profileImageUrl()) {
                <img [src]="profileImageUrl()" alt="Profile" class="profile-image">
              } @else {
                <div class="default-avatar">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              }
              <button class="change-photo-button" (click)="fileInput.click()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                #fileInput
                type="file"
                accept="image/*"
                (change)="onFileSelected($event)"
                style="display: none"
              >
            </div>
          </div>

          <!-- Edit/View Toggle -->
          <div class="action-buttons">
            @if (!editMode()) {
              <button class="btn-secondary" (click)="toggleEditMode()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Perfil
              </button>
            } @else {
              <button class="btn-secondary" (click)="cancelEdit()">
                Cancelar
              </button>
              <button class="btn-primary" (click)="saveProfile()">
                Salvar Alterações
              </button>
            }
          </div>

          <!-- Profile Form -->
          <form [formGroup]="profileForm" class="profile-form">
            @if (isOng) {
              <div class="form-group">
                <label>Nome da ONG</label>
                @if (editMode()) {
                  <input
                    type="text"
                    formControlName="ongName"
                    class="form-control"
                    placeholder="Digite o nome da ONG"
                  >
                } @else {
                  <div class="form-value">{{ getDisplayName() }}</div>
                }
              </div>
            } @else {
              <div class="form-group">
                <label>Nome</label>
                @if (editMode()) {
                  <input
                    type="text"
                    formControlName="firstName"
                    class="form-control"
                    placeholder="Digite seu nome"
                  >
                } @else {
                  <div class="form-value">{{ profileForm.get('firstName')?.value || 'Não informado' }}</div>
                }
              </div>

              <div class="form-group">
                <label>Sobrenome</label>
                @if (editMode()) {
                  <input
                    type="text"
                    formControlName="lastName"
                    class="form-control"
                    placeholder="Digite seu sobrenome"
                  >
                } @else {
                  <div class="form-value">{{ profileForm.get('lastName')?.value || 'Não informado' }}</div>
                }
              </div>
            }

            <div class="form-group">
              <label>E-mail</label>
              <div class="form-value">{{ profileForm.get('email')?.value }}</div>
              <small class="form-hint">O e-mail não pode ser alterado</small>
            </div>

            <div class="form-group">
              <label>Telefone</label>
              @if (editMode()) {
                <input
                  type="tel"
                  formControlName="phone"
                  class="form-control"
                  placeholder="Digite seu telefone"
                >
              } @else {
                <div class="form-value">{{ profileForm.get('phone')?.value || 'Não informado' }}</div>
              }
            </div>

            <div class="form-group">
              <label>Localização</label>
              @if (editMode()) {
                <input
                  type="text"
                  formControlName="location"
                  class="form-control"
                  placeholder="Cidade, Estado"
                >
              } @else {
                <div class="form-value">{{ profileForm.get('location')?.value || 'Não informada' }}</div>
              }
            </div>

            @if (isOng) {
              <div class="form-group">
                <label>Instagram</label>
                @if (editMode()) {
                  <input
                    type="text"
                    formControlName="instagramHandle"
                    class="form-control"
                    placeholder="@seu_instagram"
                  >
                } @else {
                  <div class="form-value">{{ profileForm.get('instagramHandle')?.value || 'Não informado' }}</div>
                }
              </div>
            }
          </form>

          <!-- My Favorites Section (for regular users) -->
          @if (!isOng) {
            <div class="favorites-section">
              <h3>Meus Favoritos</h3>
              <button class="btn-link" (click)="viewFavorites()">
                Ver todos os favoritos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          }

          <!-- Change Password Section -->
          <div class="password-section">
            <h3>Alterar Senha</h3>
            @if (!showPasswordForm()) {
              <button class="btn-link" (click)="togglePasswordForm()">
                Alterar minha senha
              </button>
            } @else {
              <form [formGroup]="passwordForm" class="password-form" (ngSubmit)="changePassword()">
                <div class="form-group">
                  <label>Senha Atual</label>
                  <input
                    type="password"
                    formControlName="currentPassword"
                    class="form-control"
                    placeholder="Digite sua senha atual"
                  >
                </div>

                <div class="form-group">
                  <label>Nova Senha</label>
                  <input
                    type="password"
                    formControlName="newPassword"
                    class="form-control"
                    placeholder="Digite a nova senha"
                  >
                </div>

                <div class="form-group">
                  <label>Confirmar Nova Senha</label>
                  <input
                    type="password"
                    formControlName="confirmPassword"
                    class="form-control"
                    placeholder="Confirme a nova senha"
                  >
                </div>

                <div class="form-actions">
                  <button type="button" class="btn-secondary" (click)="togglePasswordForm()">
                    Cancelar
                  </button>
                  <button type="submit" class="btn-primary" [disabled]="!passwordForm.valid">
                    Alterar Senha
                  </button>
                </div>
              </form>
            }
          </div>

          <!-- Logout Button -->
          <div class="logout-section">
            <button class="btn-danger" (click)="logout()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sair da Conta
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-container {
      min-height: 100vh;
      background: #F5F5F5;
      padding-bottom: 80px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .back-button {
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: #2C2C2C;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s ease;
    }

    .back-button:hover {
      background: #F5F5F5;
    }

    .profile-header h1 {
      flex: 1;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: #2C2C2C;
    }

    .spacer {
      width: 40px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      color: #666666;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #E0E0E0;
      border-top-color: #5CB5B0;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .profile-content {
      max-width: 600px;
      margin: 0 auto;
      padding: 24px 20px;
    }

    .profile-image-section {
      display: flex;
      justify-content: center;
      margin-bottom: 32px;
    }

    .image-wrapper {
      position: relative;
      width: 140px;
      height: 140px;
    }

    .profile-image {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .default-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: linear-gradient(135deg, #B8E3E1 0%, #5CB5B0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .change-photo-button {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #5CB5B0;
      border: 3px solid white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .change-photo-button:hover {
      background: #4A9792;
      transform: scale(1.05);
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-bottom: 32px;
    }

    .profile-form {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #2C2C2C;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #E0E0E0;
      border-radius: 8px;
      font-size: 16px;
      color: #2C2C2C;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #5CB5B0;
    }

    .form-value {
      padding: 12px 16px;
      background: #F5F5F5;
      border-radius: 8px;
      color: #2C2C2C;
      font-size: 16px;
    }

    .form-hint {
      display: block;
      margin-top: 6px;
      font-size: 12px;
      color: #666666;
    }

    .favorites-section,
    .password-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 24px;
    }

    .favorites-section h3,
    .password-section h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
      color: #2C2C2C;
    }

    .password-form {
      margin-top: 20px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .logout-section {
      margin-top: 32px;
    }

    .btn-primary,
    .btn-secondary,
    .btn-danger,
    .btn-link {
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary {
      background: #5CB5B0;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #4A9792;
    }

    .btn-primary:disabled {
      background: #CCCCCC;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: white;
      color: #5CB5B0;
      border: 2px solid #5CB5B0;
    }

    .btn-secondary:hover {
      background: #F0F9F9;
    }

    .btn-danger {
      background: #E74C3C;
      color: white;
      width: 100%;
    }

    .btn-danger:hover {
      background: #C0392B;
    }

    .btn-link {
      background: none;
      color: #5CB5B0;
      padding: 8px 12px;
      text-decoration: none;
    }

    .btn-link:hover {
      background: #F0F9F9;
    }

    @media (max-width: 768px) {
      .profile-content {
        padding: 16px;
      }

      .action-buttons {
        flex-direction: column;
      }

      .btn-primary,
      .btn-secondary {
        width: 100%;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private usersService = inject(UsersService);
  private ongService = inject(OngService);
  private toastService = inject(ToastService);
  private favoritesService = inject(FavoritesService);
  private router = inject(Router);

  loading = signal(false);
  editMode = signal(false);
  showPasswordForm = signal(false);
  profileImageUrl = signal<string | null>(null);
  isOng = false;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.checkUserType();
    this.loadProfile();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      ongName: [''],
      email: [{ value: '', disabled: true }],
      phone: [''],
      location: [''],
      instagramHandle: [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
  }

  checkUserType(): void {
    const user = this.authService.currentUser();
    this.isOng = user?.role === 'ong';
  }

  loadProfile(): void {
    this.loading.set(true);

    if (this.isOng) {
      this.ongService.getOngProfile().subscribe({
        next: (ong) => {
          this.profileForm.patchValue({
            ongName: ong.ongName,
            email: ong.email,
            phone: ong.phone || '',
            location: ong.location || '',
            instagramHandle: ong.instagramHandle || '',
          });
          this.profileImageUrl.set(ong.profileImageUrl || null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading ONG profile:', error);
          this.toastService.error('Erro ao carregar perfil');
          this.loading.set(false);
        },
      });
    } else {
      this.usersService.getUserProfile().subscribe({
        next: (user) => {
          this.profileForm.patchValue({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            phone: user.phone || '',
            location: user.location || '',
          });
          this.profileImageUrl.set(user.profileImageUrl || null);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.toastService.error('Erro ao carregar perfil');
          this.loading.set(false);
        },
      });
    }
  }

  toggleEditMode(): void {
    this.editMode.set(!this.editMode());
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.loadProfile();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.toastService.warning('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const formValue = this.profileForm.value;

    if (this.isOng) {
      const updateData = {
        ongName: formValue.ongName,
        phone: formValue.phone,
        location: formValue.location,
        instagramHandle: formValue.instagramHandle,
      };

      this.ongService.updateOngProfile(updateData).subscribe({
        next: (response) => {
          // Update AuthService to sync the ONG profile across the app
          const currentUser = this.authService.currentUser();
          if (currentUser) {
            this.authService.updateCurrentUser({
              ...currentUser,
              ongName: response.ong.ongName,
              phone: response.ong.phone,
              instagramHandle: response.ong.instagramHandle,
              location: response.ong.location,
              profileImageUrl: response.ong.profileImageUrl,
            });
          }
          this.toastService.success('Perfil atualizado com sucesso');
          this.editMode.set(false);
        },
        error: (error) => {
          console.error('Error updating ONG profile:', error);
          this.toastService.error('Erro ao atualizar perfil');
        },
      });
    } else {
      const updateData = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        phone: formValue.phone,
        location: formValue.location,
      };

      this.usersService.updateUserProfile(updateData).subscribe({
        next: (response) => {
          // Update AuthService to sync the current user across the app
          const currentUser = this.authService.currentUser();
          if (currentUser) {
            this.authService.updateCurrentUser({
              ...currentUser,
              ...response.user
            });
          }
          this.toastService.success('Perfil atualizado com sucesso');
          this.editMode.set(false);
        },
        error: (error) => {
          console.error('Error updating user profile:', error);
          this.toastService.error('Erro ao atualizar perfil');
        },
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (this.isOng) {
        this.ongService.uploadProfileImage(file).subscribe({
          next: (response) => {
            this.profileImageUrl.set(response.profileImageUrl);
            // Update AuthService to sync the profile image
            const currentUser = this.authService.currentUser();
            if (currentUser) {
              this.authService.updateCurrentUser({
                ...currentUser,
                profileImageUrl: response.profileImageUrl
              });
            }
            this.toastService.success('Imagem atualizada com sucesso');
          },
          error: (error) => {
            console.error('Error uploading image:', error);
            this.toastService.error('Erro ao fazer upload da imagem');
          },
        });
      } else {
        this.usersService.uploadProfileImage(file).subscribe({
          next: (response) => {
            this.profileImageUrl.set(response.profileImageUrl);
            // Update AuthService to sync the profile image
            const currentUser = this.authService.currentUser();
            if (currentUser) {
              this.authService.updateCurrentUser({
                ...currentUser,
                profileImageUrl: response.profileImageUrl
              });
            }
            this.toastService.success('Imagem atualizada com sucesso');
          },
          error: (error) => {
            console.error('Error uploading image:', error);
            this.toastService.error('Erro ao fazer upload da imagem');
          },
        });
      }
    }
  }

  togglePasswordForm(): void {
    this.showPasswordForm.set(!this.showPasswordForm());
    if (!this.showPasswordForm()) {
      this.passwordForm.reset();
    }
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.toastService.warning('Por favor, preencha todos os campos');
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.toastService.error('As senhas não coincidem');
      return;
    }

    const service = this.isOng ? this.ongService : this.usersService;

    service.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.toastService.success('Senha alterada com sucesso');
        this.togglePasswordForm();
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.toastService.error('Erro ao alterar senha. Verifique a senha atual.');
      },
    });
  }

  viewFavorites(): void {
    this.router.navigate(['/favorites']);
  }

  logout(): void {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
      this.toastService.success('Você saiu da sua conta');
      this.router.navigate(['/login']);
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  getDisplayName(): string {
    if (this.isOng) {
      return this.profileForm.get('ongName')?.value || 'Não informado';
    } else {
      const firstName = this.profileForm.get('firstName')?.value || '';
      const lastName = this.profileForm.get('lastName')?.value || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Não informado';
    }
  }
}
