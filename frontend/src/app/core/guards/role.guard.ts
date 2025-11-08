import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService, UserRole } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.currentUser();

  if (!currentUser) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  const requiredRoles = route.data['roles'] as UserRole[];

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const hasRole = requiredRoles.includes(currentUser.role);

  if (!hasRole) {
    // Redirect based on user role
    if (currentUser.role === 'admin') {
      router.navigate(['/admin']);
    } else if (currentUser.role === 'ong') {
      router.navigate(['/ong']);
    } else {
      router.navigate(['/home']);
    }
    return false;
  }

  return true;
};
