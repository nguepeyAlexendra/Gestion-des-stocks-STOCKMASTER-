import { Routes } from '@angular/router';
import { authGuard, adminGuard, userGuard } from './auth/auth-guard';

export const routes: Routes = [
  // ── PAGE D'ACCUEIL ──
  {
    path: '',
    loadComponent: () => import('./landing/landing').then(m => m.LandingComponent)
  },

  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
  },

  // ── ADMIN UNIQUEMENT ──
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
    canActivate: [adminGuard]
  },
  {
    path: 'utilisateurs',
    loadComponent: () => import('./utilisateurs/utilisateurs').then(m => m.UtilisateursComponent),
    canActivate: [adminGuard]
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
    path: 'fournisseurs',
    loadComponent: () => import('./fournisseurs/fournisseurs').then(m => m.FournisseursComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'entrees-stock',
    loadComponent: () => import('./entrees-stock/entrees-stock').then(m => m.EntreesStockComponent),
    canActivate: [adminGuard]
  },

  // ── UTILISATEUR UNIQUEMENT ──
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [userGuard]
  },
  {
    path: 'ventes',
    loadComponent: () => import('./ventes/ventes').then(m => m.VentesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'factures',
    loadComponent: () => import('./factures/factures').then(m => m.FacturesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'clients',
    loadComponent: () => import('./clients/clients').then(m => m.ClientsComponent),
    canActivate: [userGuard]
  },

  // ── ACCESSIBLE AUX DEUX ──
  {
    path: 'rapports',
    loadComponent: () => import('./rapports/rapports').then(m => m.RapportsComponent),
    canActivate: [authGuard]
  },

  { path: '**', redirectTo: '' }
];