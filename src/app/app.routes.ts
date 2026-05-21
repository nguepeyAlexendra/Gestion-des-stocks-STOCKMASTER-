import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'produits',
    loadComponent: () => import('./produits/produits').then(m => m.ProduitsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    loadComponent: () => import('./categories/categories').then(m => m.CategoriesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clients',
    loadComponent: () => import('./clients/clients').then(m => m.ClientsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'fournisseurs',
    loadComponent: () => import('./fournisseurs/fournisseurs').then(m => m.FournisseursComponent),
    canActivate: [authGuard]
  },
  {
    path: 'ventes',
    loadComponent: () => import('./ventes/ventes').then(m => m.VentesComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'auth/login' }
];