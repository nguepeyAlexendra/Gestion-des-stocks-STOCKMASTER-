import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './factures.html',
  styleUrls: ['./factures.css']
})
export class FacturesComponent implements OnInit {
  factures      : any[] = [];
  isLoading     = true;
  searchTerm    = '';
  factureDetail : any   = null;
  venteDetail   : any   = null;
  apiUrl        = 'http://127.0.0.1:8000/api';

  constructor(
    private http   : HttpClient,
    private router : Router
  ) {}

  ngOnInit() { this.loadFactures(); }

  loadFactures() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/factures/`).subscribe({
      next : (data) => {
        this.factures  = data.results || data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  get facturesFiltres() {
    return this.factures.filter(f =>
      f.numero_facture.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (f.client_nom && f.client_nom.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  voirDetail(facture: any) {
    this.factureDetail = facture;
    // Charger les détails de la vente associée
    this.http.get<any>(`${this.apiUrl}/ventes/${facture.vente_id}/`).subscribe({
      next: (vente) => this.venteDetail = vente,
      error: () => this.venteDetail = null
    });
  }

  fermerDetail() {
    this.factureDetail = null;
    this.venteDetail   = null;
  }

  onSearch(event: any) { this.searchTerm = event.target.value; }
  navigateTo(page: string) { this.router.navigate([`/${page}`]); }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/auth/login']);
  }

  imprimer() { window.print(); }
}