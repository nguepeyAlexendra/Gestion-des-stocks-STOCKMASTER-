import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  // Ne pas ajouter le token pour les routes d'authentification
  const isAuthRoute = req.url.includes('/auth/login/') || 
                      req.url.includes('/auth/register/');

  if (token && !isAuthRoute) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }

  return next(req);
};