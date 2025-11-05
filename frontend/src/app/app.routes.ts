import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Public routes
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'account-type',
    loadComponent: () =>
      import('./features/auth/account-type/account-type.component').then(
        (m) => m.AccountTypeComponent
      ),
  },
  {
    path: 'register/user',
    loadComponent: () =>
      import('./features/auth/user-register/user-register.component').then(
        (m) => m.UserRegisterComponent
      ),
  },
  {
    path: 'register/ong',
    loadComponent: () =>
      import('./features/auth/ong-register/ong-register.component').then(
        (m) => m.OngRegisterComponent
      ),
  },
  {
    path: 'register',
    redirectTo: '/account-type',
    pathMatch: 'full'
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
    path: 'donate',
    loadComponent: () =>
      import('./features/donations/donation.component').then(
        (m) => m.DonationComponent
      ),
  },

  // Admin routes (admin role required)
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/users.component').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'ongs',
        loadComponent: () =>
          import('./features/admin/ongs/ongs.component').then(
            (m) => m.AdminOngsComponent
          ),
      },
      {
        path: 'pets',
        loadComponent: () =>
          import('./features/admin/pets/pets.component').then(
            (m) => m.AdminPetsComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/reports.component').then(
            (m) => m.AdminReportsComponent
          ),
      },
    ]
  },

  // ONG routes (ong role required)
  {
    path: 'ong',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ong'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/ong/dashboard/ong-dashboard.component').then(
            (m) => m.OngDashboardComponent
          ),
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/ong/appointments/appointments.component').then(
            (m) => m.OngAppointmentsComponent
          ),
      },
      {
        path: 'donations',
        loadComponent: () =>
          import('./features/ong/donations/donations.component').then(
            (m) => m.OngDonationsComponent
          ),
      },
      {
        path: 'profile/edit',
        loadComponent: () =>
          import('./features/ong/profile/profile-edit.component').then(
            (m) => m.ProfileEditComponent
          ),
      },
    ]
  },

  // Pet management (ong role required)
  {
    path: 'pets/manage',
    loadComponent: () =>
      import('./features/ong/pets/manage-pets.component').then(
        (m) => m.ManagePetsComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ong'] }
  },
  {
    path: 'pets/add',
    loadComponent: () =>
      import('./features/pets/pet-form/pet-form.component').then(
        (m) => m.PetFormComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ong'] }
  },
  {
    path: 'pets/edit/:id',
    loadComponent: () =>
      import('./features/pets/pet-form/pet-form.component').then(
        (m) => m.PetFormComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ong'] }
  },

  // User profile (any authenticated user)
  {
    path: 'profile',
    loadComponent: () =>
      import('./features/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [authGuard],
  },

  // Fallback
  { path: '**', redirectTo: '/home' },
];
