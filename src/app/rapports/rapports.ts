import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './rapports.html',
  styleUrls: ['./rapports.css']
})
export class RapportsComponent implements OnInit {
  isLoading    = true;
  apiUrl       = 'http://127.0.0.1:8000/api';

  statsVentes = {
    total_ventes      : 0,
    chiffre_affaires  : 0,
    ventes_aujourdhui : 0,
  };

  statsProduits = {
    total_produits        : 0,
    produits_stock_faible : 0,
    valeur_stock          : 0,
  };

  dernieres_ventes : any[] = [];
  produits_stock_faible : any[] = [];
  top_clients : any[] = [];

  constructor(
    private http   : HttpClient,
    private router : Router
  ) {}

  ngOnInit() {
    this.loadRapports();
  }

  loadRapports() {
    this.isLoading = true;

    this.http.get<any>(`${this.apiUrl}/ventes/statistiques/`).subscribe({
      next: (data) => {
        this.statsVentes = data;
      }
    });

    this.http.get<any>(`${this.apiUrl}/produits/statistiques/`).subscribe({
      next: (data) => {
        this.statsProduits = data;
        this.isLoading = false;
      }
    });

    this.http.get<any>(`${this.apiUrl}/ventes/`).subscribe({
      next: (data) => {
        this.dernieres_ventes = (data.results || data).slice(0, 10);
      }
    });

    this.http.get<any>(`${this.apiUrl}/produits/stock_faible/`).subscribe({
      next: (data) => {
        this.produits_stock_faible = data;
      }
    });

    this.http.get<any>(`${this.apiUrl}/clients/`).subscribe({
      next: (data) => {
        const clients = data.results || data;
        this.top_clients = clients
          .sort((a: any, b: any) => b.nombre_achats - a.nombre_achats)
          .slice(0, 5);
      }
    });
  }

  get benefice_estime(): number {
    return this.dernieres_ventes.reduce((total, v) => {
      return total + parseFloat(v.montant_total);
    }, 0);
  }

  navigateTo(page: string) { this.router.navigate([`/${page}`]); }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/auth/login']);
  }
}