import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import(
        './features/auth/forgot-password/forgot-password.component'
      ).then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'pets/:id',
    loadComponent: () =>
      import('./features/pets/pet-detail/pet-detail.component').then(
        (m) => m.PetDetailComponent
      ),
  },
  {
    path: 'pets/add',
    loadComponent: () =>
      import('./features/pets/pet-form/pet-form.component').then(
        (m) => m.PetFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'pets/edit/:id',
    loadComponent: () =>
      import('./features/pets/pet-form/pet-form.component').then(
        (m) => m.PetFormComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'donate',
    loadComponent: () =>
      import('./features/donations/donation.component').then(
        (m) => m.DonationComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '/home' },
];
