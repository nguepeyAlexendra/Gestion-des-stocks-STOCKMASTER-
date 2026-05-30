import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = localStorage.getItem('access_token');

  if (token) return true;

  router.navigate(['/auth/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = localStorage.getItem('access_token');
  const role   = localStorage.getItem('user_role');

  console.log('adminGuard - token:', token ? 'exists' : 'null');
  console.log('adminGuard - role:', role);

  if (!token) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (role === 'admin') return true;

  router.navigate(['/dashboard']);
  return false;
};

export const userGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token  = localStorage.getItem('access_token');
  const role   = localStorage.getItem('user_role');

  if (!token) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (role === 'admin') {
    router.navigate(['/admin-dashboard']);  // ← corrigé
    return false;
  }

  return true;
};