import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { OngService } from '../../../core/services/ong.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="profile-edit-page">
      <header class="page-header">
        <a routerLink="/ong/dashboard" class="back-link">
          {{ 'ong.common.back' | translate }}
        </a>
        <h1>{{ 'ong.profile.title' | translate }}</h1>
        <p>{{ 'ong.profile.subtitle' | translate }}</p>
      </header>

      @if (isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>{{ 'ong.profile.loadingData' | translate }}</p>
        </div>
      } @else {
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
          <!-- Profile Image -->
          <div class="form-section">
            <h2>{{ 'ong.profile.profilePhoto' | translate }}</h2>
            <div class="profile-image-section">
              <div class="current-image">
                <img
                  [src]="profileImagePreview() || currentProfileImage() || '/assets/images/placeholder-ong.jpg'"
                  alt="Perfil"
                  (error)="onImageError($event)"
                />
              </div>
              <div class="image-upload">
                <label class="upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    (change)="onImageSelect($event)"
                    hidden
                  />
                  {{ 'ong.profile.changePhoto' | translate }}
                </label>
                <p class="hint">{{ 'ong.profile.photoHint' | translate }}</p>
              </div>
            </div>
          </div>

          <!-- Basic Info -->
          <div class="form-section">
            <h2>{{ 'ong.profile.basicInfo' | translate }}</h2>
            <div class="form-grid">
              <div class="form-group full-width">
                <label for="ongName">{{ 'ong.profile.ongName' | translate }}</label>
                <input
                  id="ongName"
                  type="text"
                  formControlName="ongName"
                  [placeholder]="'ong.profile.ongNamePlaceholder' | translate"
                  class="form-control"
                />
                @if (profileForm.get('ongName')?.invalid && profileForm.get('ongName')?.touched) {
                  <span class="error">{{ 'ong.profile.ongNameRequired' | translate }}</span>
                }
              </div>

              <div class="form-group">
                <label for="email">{{ 'ong.profile.email' | translate }}</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  [placeholder]="'ong.profile.emailPlaceholder' | translate"
                  class="form-control"
                />
                @if (profileForm.get('email')?.invalid && profileForm.get('email')?.touched) {
                  <span class="error">{{ 'ong.profile.emailRequired' | translate }}</span>
                }
              </div>

              <div class="form-group">
                <label for="phone">{{ 'ong.profile.phone' | translate }}</label>
                <input
                  id="phone"
                  type="tel"
                  formControlName="phone"
                  [placeholder]="'ong.profile.phonePlaceholder' | translate"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="location">{{ 'ong.profile.location' | translate }}</label>
                <input
                  id="location"
                  type="text"
                  formControlName="location"
                  [placeholder]="'ong.profile.locationPlaceholder' | translate"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="instagramHandle">{{ 'ong.profile.instagram' | translate }}</label>
                <div class="input-with-prefix">
                  <span class="prefix">{{ 'ong.profile.instagramPrefix' | translate }}</span>
                  <input
                    id="instagramHandle"
                    type="text"
                    formControlName="instagramHandle"
                    [placeholder]="'ong.profile.instagramPlaceholder' | translate"
                    class="form-control with-prefix"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Password Change (Optional) -->
          <div class="form-section">
            <h2>{{ 'ong.profile.changePassword' | translate }}</h2>
            <p class="section-desc">{{ 'ong.profile.changePasswordHint' | translate }}</p>
            <div class="form-grid">
              <div class="form-group">
                <label for="currentPassword">{{ 'ong.profile.currentPassword' | translate }}</label>
                <input
                  id="currentPassword"
                  type="password"
                  formControlName="currentPassword"
                  [placeholder]="'ong.profile.passwordPlaceholder' | translate"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="newPassword">{{ 'ong.profile.newPassword' | translate }}</label>
                <input
                  id="newPassword"
                  type="password"
                  formControlName="newPassword"
                  [placeholder]="'ong.profile.passwordPlaceholder' | translate"
                  class="form-control"
                />
              </div>

              <div class="form-group">
                <label for="confirmPassword">{{ 'ong.profile.confirmPassword' | translate }}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  [placeholder]="'ong.profile.passwordPlaceholder' | translate"
                  class="form-control"
                />
                @if (profileForm.hasError('passwordMismatch') && profileForm.get('confirmPassword')?.touched) {
                  <span class="error">{{ 'ong.profile.passwordMismatch' | translate }}</span>
                }
              </div>
            </div>
          </div>

          <!-- Submit -->
          <div class="form-actions">
            <button type="button" routerLink="/ong/dashboard" class="btn-cancel">
              {{ 'ong.profile.cancelButton' | translate }}
            </button>
            <button type="submit" class="btn-submit" [disabled]="isSubmitting()">
              @if (isSubmitting()) {
                <span class="spinner-small"></span>
                <span>{{ 'ong.profile.savingButton' | translate }}</span>
              } @else {
                <span>{{ 'ong.profile.saveButton' | translate }}</span>
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .profile-edit-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 24px;
      padding-bottom: 100px;
    }

    .page-header {
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
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 32px;
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

    .profile-image-section {
      display: flex;
      align-items: center;
      gap: 32px;

      .current-image {
        width: 150px;
        height: 150px;
        border-radius: 50%;
        overflow: hidden;
        border: 4px solid #E0E0E0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .image-upload {
        flex: 1;

        .upload-button {
          display: inline-block;
          background: #5CB5B0;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            background: #4A9792;
          }
        }

        .hint {
          color: #999;
          font-size: 13px;
          margin: 8px 0 0 0;
        }
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      &.full-width {
        grid-column: 1 / -1;
      }

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

        &.with-prefix {
          padding-left: 40px;
        }
      }

      .input-with-prefix {
        position: relative;

        .prefix {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          font-weight: 600;
        }
      }

      .error {
        color: #E74C3C;
        font-size: 13px;
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

    @media (max-width: 768px) {
      .profile-edit-page {
        padding: 24px 16px;
      }

      .form-section {
        padding: 24px 20px;
      }

      .profile-image-section {
        flex-direction: column;
        text-align: center;
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
export class ProfileEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private ongService = inject(OngService);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  profileForm: FormGroup;
  isLoading = signal(true);
  isSubmitting = signal(false);
  profileImagePreview = signal<string | null>(null);
  currentProfileImage = signal<string | null>(null);
  selectedImageFile: File | null = null;

  constructor() {
    this.profileForm = this.fb.group({
      ongName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      location: [''],
      instagramHandle: [''],
      currentPassword: [''],
      newPassword: [''],
      confirmPassword: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.ongService.getOngProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          ongName: profile.ongName,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          instagramHandle: profile.instagramHandle?.replace('@', '')
        });
        this.currentProfileImage.set(profile.profileImageUrl || null);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastService.error(this.translate.instant('ong.profile.errorLoadProfile'));
        this.isLoading.set(false);
      }
    });
  }

  onImageSelect(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image type (PNG, JPEG, WebP)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      this.toastService.error(this.translate.instant('ong.profile.errorInvalidImage'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastService.error(this.translate.instant('ong.profile.errorImageSize'));
      return;
    }

    this.selectedImageFile = file;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.profileImagePreview.set(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  onImageError(event: any) {
    event.target.src = '/assets/images/placeholder-ong.jpg';
  }

  async onSubmit() {
    if (this.profileForm.invalid) {
      Object.keys(this.profileForm.controls).forEach(key => {
        this.profileForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSubmitting.set(true);

    try {
      // 1. Upload profile image if selected
      if (this.selectedImageFile) {
        await new Promise<void>((resolve, reject) => {
          this.ongService.uploadProfileImage(this.selectedImageFile!).subscribe({
            next: (response) => {
              // Update AuthService to sync the profile image
              const currentUser = this.authService.currentUser();
              if (currentUser) {
                this.authService.updateCurrentUser({
                  ...currentUser,
                  profileImageUrl: response.profileImageUrl
                });
              }
              this.toastService.success(this.translate.instant('ong.profile.successUpdateImage'));
              resolve();
            },
            error: (error) => {
              this.toastService.error(this.translate.instant('ong.profile.errorUpdateImage'));
              reject(error);
            }
          });
        });
      }

      // 2. Update profile data
      const profileData = {
        ongName: this.profileForm.value.ongName,
        phone: this.profileForm.value.phone || undefined,
        location: this.profileForm.value.location || undefined,
        instagramHandle: this.profileForm.value.instagramHandle
          ? '@' + this.profileForm.value.instagramHandle.replace('@', '')
          : undefined
      };

      await new Promise<void>((resolve, reject) => {
        this.ongService.updateOngProfile(profileData).subscribe({
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
            resolve();
          },
          error: (error) => {
            this.toastService.error(this.translate.instant('ong.profile.errorUpdateProfile'));
            reject(error);
          }
        });
      });

      // 3. Change password if provided
      if (this.profileForm.value.currentPassword && this.profileForm.value.newPassword) {
        await new Promise<void>((resolve, reject) => {
          this.ongService.changePassword({
            currentPassword: this.profileForm.value.currentPassword,
            newPassword: this.profileForm.value.newPassword,
            confirmPassword: this.profileForm.value.confirmPassword
          }).subscribe({
            next: () => {
              this.toastService.success(this.translate.instant('ong.profile.successChangePassword'));
              resolve();
            },
            error: (error) => {
              const errorMessage = this.translate.instant('ong.profile.errorChangePassword', {
                error: error.error?.message || 'senha atual incorreta'
              });
              this.toastService.error(errorMessage);
              reject(error);
            }
          });
        });
      }

      // Success - navigate back
      this.toastService.success(this.translate.instant('ong.profile.successUpdate'));
      setTimeout(() => {
        this.router.navigate(['/ong/dashboard']);
      }, 1500);

    } catch (error) {
      this.isSubmitting.set(false);
    }
  }
}
