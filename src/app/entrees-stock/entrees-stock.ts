import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-entrees-stock',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './entrees-stock.html',
  styleUrls: ['./entrees-stock.css']
})
export class EntreesStockComponent implements OnInit {
  entrees        : any[] = [];
  produits       : any[] = [];
  fournisseurs   : any[] = [];
  isLoading      = true;
  showForm       = false;
  errorMessage   = '';
  successMessage = '';
  searchTerm     = '';
  apiUrl         = 'http://127.0.0.1:8000/api';
  entreeForm     : FormGroup;

  constructor(
    private http   : HttpClient,
    private fb     : FormBuilder,
    private router : Router
  ) {
    this.entreeForm = this.fb.group({
      produit     : ['', [Validators.required]],
      fournisseur : [''],
      quantite    : ['', [Validators.required, Validators.min(1)]],
      prix_achat  : ['', [Validators.required, Validators.min(1)]],
      reference   : ['']
    });
  }

  ngOnInit() {
    this.loadEntrees();
    this.loadProduits();
    this.loadFournisseurs();
  }

  loadEntrees() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/entrees-stock/`).subscribe({
      next : (data) => {
        this.entrees   = data.results || data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadProduits() {
    this.http.get<any>(`${this.apiUrl}/produits/`).subscribe({
      next: (data) => this.produits = data.results || data
    });
  }

  loadFournisseurs() {
    this.http.get<any>(`${this.apiUrl}/fournisseurs/`).subscribe({
      next: (data) => this.fournisseurs = data.results || data
    });
  }

  get entreesFiltres() {
    return this.entrees.filter(e =>
      e.produit_nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (e.fournisseur_nom && e.fournisseur_nom.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  openForm() {
    this.showForm     = true;
    this.errorMessage = '';
    this.entreeForm.reset();
  }

  closeForm() {
    this.showForm = false;
    this.entreeForm.reset();
  }

  saveEntree() {
    if (this.entreeForm.invalid) return;
    const data = this.entreeForm.value;
    if (!data.fournisseur) data.fournisseur = null;

    this.http.post(`${this.apiUrl}/entrees-stock/`, data).subscribe({
      next: () => {
        this.successMessage = 'Entrée de stock enregistrée avec succès !';
        this.closeForm();
        this.loadEntrees();
        this.loadProduits();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => this.errorMessage = 'Erreur lors de l\'enregistrement.'
    });
  }

  onSearch(event: any) { this.searchTerm = event.target.value; }
  navigateTo(page: string) { this.router.navigate([`/${page}`]); }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/auth/login']);
  }
}