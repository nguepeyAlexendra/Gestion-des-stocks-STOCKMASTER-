import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { DarkModeService } from '../shared/dark-mode';
@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './factures.html',
  styleUrls: ['./factures.css']
})
export class FacturesComponent implements OnInit {
  factures       : any[] = [];
  isLoading      = true;
  searchTerm     = '';
  factureDetail  : any   = null;
  apiUrl         = 'http://127.0.0.1:8000/api';
  venteDetail: any;
  isDark = false;
  
  constructor(
    private http   : HttpClient,
    private router : Router,
    private darkModeService : DarkModeService
  ) {}
isAdmin = false;

ngOnInit() {
  this.isDark  = this.darkModeService.getDarkMode();
  this.isAdmin = localStorage.getItem('user_role') === 'admin';
  this.loadFactures();
}


// Méthode
toggleDark(): void {
  this.darkModeService.toggleDark();
  this.isDark = this.darkModeService.getDarkMode();
}
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
  }

  fermerDetail() {
    this.factureDetail = null;
  }

  onSearch(event: any) { this.searchTerm = event.target.value; }
  navigateTo(page: string) { this.router.navigate([`/${page}`]); }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/auth/login']);
  }

  imprimer() {
    window.print();
  }
}