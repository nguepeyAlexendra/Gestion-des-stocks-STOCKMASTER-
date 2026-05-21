import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  username = '';
  today    = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  stats = {
    total_produits        : 0,
    chiffre_affaires      : 0,
    ventes_aujourdhui     : 0,
    produits_stock_faible : 0,
  };

  dernieres_ventes : any[] = [];
  alertes_stock    : any[] = [];
  isLoading = true;
  apiUrl    = 'http://127.0.0.1:8000/api';

  constructor(
    private http   : HttpClient,
    private router : Router
  ) {}

  ngOnInit() {
    this.loadUserInfo();
    this.loadStats();
    this.loadDernieresVentes();
    this.loadAlertesStock();
  }

  loadUserInfo() {
    const token = localStorage.getItem('access_token');
    if (!token) { this.router.navigate(['/auth/login']); return; }
    this.http.get<any>(`${this.apiUrl}/auth/profile/`).subscribe({
      next : (user) => this.username = user.username,
      error: ()     => this.router.navigate(['/auth/login'])
    });
  }

  loadStats() {
    this.http.get<any>(`${this.apiUrl}/produits/statistiques/`).subscribe({
      next: (data) => {
        this.stats.total_produits        = data.total_produits;
        this.stats.produits_stock_faible = data.produits_stock_faible;
      }
    });
    this.http.get<any>(`${this.apiUrl}/ventes/statistiques/`).subscribe({
      next: (data) => {
        this.stats.chiffre_affaires  = data.chiffre_affaires;
        this.stats.ventes_aujourdhui = data.ventes_aujourdhui;
        this.isLoading = false;
      }
    });
  }

  loadDernieresVentes() {
    this.http.get<any>(`${this.apiUrl}/ventes/`).subscribe({
      next: (data) => {
        const ventes = data.results || data;
        this.dernieres_ventes = ventes.slice(0, 5);
      }
    });
  }

  loadAlertesStock() {
    this.http.get<any>(`${this.apiUrl}/produits/stock_faible/`).subscribe({
      next: (data) => this.alertes_stock = data.slice(0, 5)
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/auth/login']);
  }

  getInitiales(): string {
    return this.username ? this.username.substring(0, 2).toUpperCase() : 'AL';
  }
}