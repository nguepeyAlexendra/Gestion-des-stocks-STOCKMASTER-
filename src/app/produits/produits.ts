import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-produits',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './produits.html',
  styleUrls: ['./produits.css']
})
export class ProduitsComponent implements OnInit {
  produits       : any[] = [];
  categories     : any[] = [];
  isLoading      = true;
  showModal      = false;
  isEditing      = false;
  searchTerm     = '';
  selectedCat    = '';
  errorMessage   = '';
  successMessage = '';
  produitForm    : FormGroup;
  editingId      : number | null = null;
  imagePreview   : string | null = null;
  imageFile      : File | null   = null;
  apiUrl         = 'http://127.0.0.1:8000/api';

  constructor(
    private http   : HttpClient,
    private fb     : FormBuilder,
    private router : Router
  ) {
    this.produitForm = this.fb.group({
      nom            : ['', [Validators.required]],
      description    : [''],
      prix_vente     : ['', [Validators.required, Validators.min(1)]],
      prix_achat     : ['', [Validators.required, Validators.min(1)]],
      quantite_stock : ['', [Validators.required, Validators.min(0)]],
      seuil_alerte   : [5],
      categorie      : [''],
    });
  }

  ngOnInit() {
    this.loadProduits();
    this.loadCategories();
  }

  loadProduits() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/produits/`).subscribe({
      next : (data) => {
        this.produits  = data.results || data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadCategories() {
    this.http.get<any>(`${this.apiUrl}/categories/`).subscribe({
      next: (data) => this.categories = data.results || data
    });
  }

  get produitsFiltres() {
    return this.produits.filter(p => {
      const matchSearch = p.nom.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchCat    = this.selectedCat ? p.categorie == this.selectedCat : true;
      return matchSearch && matchCat;
    });
  }

  openModal(produit?: any) {
    this.showModal    = true;
    this.errorMessage = '';
    this.imagePreview = null;
    if (produit) {
      this.isEditing = true;
      this.editingId = produit.id;
      this.produitForm.patchValue(produit);
      if (produit.image) this.imagePreview = produit.image;
    } else {
      this.isEditing = false;
      this.editingId = null;
      this.produitForm.reset({ seuil_alerte: 5 });
    }
  }

  closeModal() {
    this.showModal    = false;
    this.imagePreview = null;
    this.produitForm.reset({ seuil_alerte: 5 });
  }

  onImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.imageFile = file;
      const reader   = new FileReader();
      reader.onload  = (e: any) => this.imagePreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  saveProduit() {
    if (this.produitForm.invalid) return;
    const formData = new FormData();
    Object.keys(this.produitForm.value).forEach(key => {
      if (this.produitForm.value[key] !== null && this.produitForm.value[key] !== '') {
        formData.append(key, this.produitForm.value[key]);
      }
    });
    if (this.imageFile) formData.append('image', this.imageFile);

    if (this.isEditing && this.editingId) {
      this.http.put(`${this.apiUrl}/produits/${this.editingId}/`, formData).subscribe({
        next: () => {
          this.successMessage = 'Produit modifié avec succès !';
          this.closeModal();
          this.loadProduits();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => this.errorMessage = 'Erreur lors de la modification.'
      });
    } else {
      this.http.post(`${this.apiUrl}/produits/`, formData).subscribe({
        next: () => {
          this.successMessage = 'Produit ajouté avec succès !';
          this.closeModal();
          this.loadProduits();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => this.errorMessage = 'Erreur lors de l\'ajout.'
      });
    }
  }

  deleteProduit(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    this.http.delete(`${this.apiUrl}/produits/${id}/`).subscribe({
      next: () => {
        this.successMessage = 'Produit supprimé avec succès !';
        this.loadProduits();
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }

  onSearch(event: any) { this.searchTerm = event.target.value; }
  onFilterCat(event: any) { this.selectedCat = event.target.value; }
  navigateTo(page: string) { this.router.navigate([`/${page}`]); }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/auth/login']);
  }
}