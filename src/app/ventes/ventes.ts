import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { DarkModeService } from '../shared/dark-mode';

@Component({
  selector  : 'app-ventes',
  standalone: true,
  imports   : [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './ventes.html',
  styleUrls  : ['./ventes.css']
})
export class VentesComponent implements OnInit {
  ventes         : any[]    = [];
  produits       : any[]    = [];
  clients        : any[]    = [];
  panier         : any[]    = [];
  isLoading      = true;
  showForm       = false;
  errorMessage   = '';
  successMessage = '';
  searchTerm     = '';
  isAdmin        = false;
  isDark         = false;
  apiUrl         = 'http://127.0.0.1:8000/api';
  venteForm      : FormGroup;

  constructor(
    private http            : HttpClient,
    private fb              : FormBuilder,
    private router          : Router,
    private darkModeService : DarkModeService
  ) {
    this.venteForm = this.fb.group({
      client       : [''],
      montant_recu : ['', [Validators.required, Validators.min(0)]],
      statut       : ['payee']
    });
  }

  ngOnInit() {
    this.isDark  = this.darkModeService.getDarkMode();
    this.isAdmin = localStorage.getItem('user_role') === 'admin';
    this.loadVentes();
    this.loadProduits();
    this.loadClients();
  }

  toggleDark(): void {
    this.darkModeService.toggleDark();
    this.isDark = this.darkModeService.getDarkMode();
  }

  loadVentes() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/ventes/`).subscribe({
      next : (data) => { this.ventes = data.results || data; this.isLoading = false; },
      error: () => this.isLoading = false
    });
  }

  loadProduits() {
    this.http.get<any>(`${this.apiUrl}/produits/`).subscribe({
      next: (data) => this.produits = (data.results || data).filter((p: any) => p.quantite_stock > 0)
    });
  }

  loadClients() {
    this.http.get<any>(`${this.apiUrl}/clients/`).subscribe({
      next: (data) => this.clients = data.results || data
    });
  }

  get ventesFiltres() {
    return this.ventes.filter(v =>
      (v.client_nom && v.client_nom.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
      String(v.id).includes(this.searchTerm)
    );
  }

  get montantTotal(): number {
    return this.panier.reduce((total, item) => total + (item.prix_unitaire * item.quantite), 0);
  }

  get monnaieRendu(): number {
    const recu = parseFloat(this.venteForm.get('montant_recu')?.value) || 0;
    return recu - this.montantTotal;
  }

  ajouterAuPanier(produit: any) {
    const existe = this.panier.find(p => p.produit === produit.id);
    if (existe) {
      if (existe.quantite < produit.quantite_stock) existe.quantite++;
    } else {
      this.panier.push({
        produit       : produit.id,
        produit_nom   : produit.nom,
        prix_unitaire : parseFloat(produit.prix_vente),
        prix_min      : parseFloat(produit.prix_vente),
        quantite      : 1,
        stock_max     : produit.quantite_stock
      });
    }
  }

  retirerDuPanier(index: number) {
    this.panier.splice(index, 1);
  }

  changerQuantite(item: any, delta: number) {
    const newQty = item.quantite + delta;
    if (newQty < 1) {
      this.retirerDuPanier(this.panier.indexOf(item));
    } else if (newQty <= item.stock_max) {
      item.quantite = newQty;
    }
  }

  ouvrirFormVente() {
    this.showForm     = true;
    this.panier       = [];
    this.errorMessage = '';
    this.venteForm.reset({ statut: 'payee' });
  }

  fermerForm() {
    this.showForm = false;
    this.panier   = [];
    this.venteForm.reset({ statut: 'payee' });
  }

  enregistrerVente() {
    if (this.panier.length === 0) {
      this.errorMessage = 'Veuillez ajouter au moins un produit au panier.';
      return;
    }
    if (this.venteForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    // Vérification prix minimum
    const produitSousPrix = this.panier.find(item => item.prix_unitaire < item.prix_min);
    if (produitSousPrix) {
      this.errorMessage = `Le prix de "${produitSousPrix.produit_nom}" (${produitSousPrix.prix_unitaire} F) ne peut pas être inférieur au prix minimum (${produitSousPrix.prix_min} F).`;
      return;
    }
     // Vérification montant reçu suffisant
const montantRecu = parseFloat(this.venteForm.get('montant_recu')?.value);
if (montantRecu < this.montantTotal) {
  this.errorMessage = `Montant insuffisant ! Le client doit payer au moins ${this.montantTotal} F. Montant reçu : ${montantRecu} F.`;
  return;
}
    const data = {
      client       : this.venteForm.get('client')?.value || null,
      montant_recu : parseFloat(this.venteForm.get('montant_recu')?.value),
      statut       : this.venteForm.get('statut')?.value,
      lignes       : this.panier.map(item => ({
        produit       : item.produit,
        quantite      : item.quantite,
        prix_unitaire : item.prix_unitaire
      }))
    };

    this.http.post(`${this.apiUrl}/ventes/`, data).subscribe({
      next: () => {
        this.successMessage = 'Vente enregistrée avec succès !';
        this.fermerForm();
        this.loadVentes();
        this.loadProduits();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        if (err.error?.lignes) {
          const lignesErrors = err.error.lignes;
          const firstError = lignesErrors.find((l: any) => l && Object.keys(l).length > 0);
          if (firstError) {
            const errorMsg = Object.values(firstError)[0];
            this.errorMessage = Array.isArray(errorMsg) ? errorMsg[0] as string : errorMsg as string;
          } else {
            this.errorMessage = 'Erreur sur les lignes de vente.';
          }
        } else if (err.error?.non_field_errors) {
          this.errorMessage = err.error.non_field_errors[0];
        } else if (err.error?.detail) {
          this.errorMessage = err.error.detail;
        } else {
          this.errorMessage = 'Erreur lors de l\'enregistrement.';
        }
      }
    });
  }

  onSearch(event: any)     { this.searchTerm = event.target.value; }
  navigateTo(page: string) { this.router.navigate([`/${page}`]); }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    this.router.navigate(['/auth/login']);
  }
}