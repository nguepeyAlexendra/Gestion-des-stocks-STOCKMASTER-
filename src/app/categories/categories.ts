import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { DarkModeService } from '../shared/dark-mode';

@Component({
  selector   : 'app-categories',
  standalone : true,
  imports    : [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './categories.html',
  styleUrls  : ['./categories.css']
})
export class CategoriesComponent implements OnInit {
  categories     : any[]         = [];
  isLoading      = true;
  showForm       = false;
  showDetail     : any           = null;
  isEditing      = false;
  editingId      : number | null = null;
  errorMessage   = '';
  successMessage = '';
  apiUrl         = 'http://127.0.0.1:8000/api';
  categorieForm  : FormGroup;

  emojis = [
    '🥫','🥤','🧴','💊','🔧','👕','👟','🍎',
    '🥩','🧁','🍺','🧹','📱','💻','🖨️','📚',
    '🎮','🚗','🏠','🌿','💄','🧸','⚽','🎵',
    '🔑','💡','🧲','🪑','🛁','🍳','🧺','🌸'
  ];
isDark  = false;
isAdmin = false;
  constructor(
    private http   : HttpClient,
    private fb     : FormBuilder,
    private router : Router ,
    private darkModeService : DarkModeService
  ) {
    this.categorieForm = this.fb.group({
      nom         : ['', [Validators.required]],
      description : [''],
      icone       : ['🏷️']
    });
  }

  ngOnInit() {
  this.isDark  = this.darkModeService.getDarkMode();
  this.isAdmin = localStorage.getItem('user_role') === 'admin';
  this.loadCategories();
}

toggleDark(): void {
  this.darkModeService.toggleDark();
  this.isDark = this.darkModeService.getDarkMode();
}

  loadCategories() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/categories/`).subscribe({
      next : (data) => {
        this.categories = data.results || data;
        this.isLoading  = false;
      },
      error: () => this.isLoading = false
    });
  }

  selectEmoji(emoji: string) {
    this.categorieForm.patchValue({ icone: emoji });
  }

  openForm(categorie?: any) {
    this.showForm     = true;
    this.showDetail   = null;
    this.errorMessage = '';
    if (categorie) {
      this.isEditing = true;
      this.editingId = categorie.id;
      this.categorieForm.patchValue(categorie);
    } else {
      this.isEditing = false;
      this.editingId = null;
      this.categorieForm.reset({ icone: '🏷️' });
    }
  }

  closeForm() {
    this.showForm = false;
    this.categorieForm.reset({ icone: '🏷️' });
  }

  voirDetail(categorie: any) {
    this.showDetail = categorie;
    this.showForm   = false;
  }

  fermerDetail() {
    this.showDetail = null;
  }

  saveCategorie() {
  if (this.categorieForm.invalid) return;
  
  const data = this.categorieForm.value;
  const nomSaisi = data.nom.trim().toLowerCase();

  // ✅ VALIDATION FRONTEND : vérifier les doublons AVANT l'envoi
  const doublon = this.categories.find(c => 
    c.nom.trim().toLowerCase() === nomSaisi && 
    c.id !== this.editingId  // On exclut la catégorie qu'on est en train de modifier
  );

  if (doublon) {
    this.errorMessage = `Une catégorie nommée "${data.nom}" existe déjà.`;
    return;
  }

  this.errorMessage = '';

  if (this.isEditing && this.editingId) {
    this.http.put(`${this.apiUrl}/categories/${this.editingId}/`, data).subscribe({
      next: () => {
        this.successMessage = 'Catégorie modifiée avec succès !';
        this.closeForm();
        this.loadCategories();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        // ✅ Gestion propre de l'erreur backend
        if (err.status === 400 && err.error?.nom) {
          this.errorMessage = err.error.nom[0]; // "categorie avec ce Nom existe déjà."
        } else {
          this.errorMessage = 'Erreur lors de la modification.';
        }
      }
    });
  } else {
    this.http.post(`${this.apiUrl}/categories/`, data).subscribe({
      next: () => {
        this.successMessage = 'Catégorie ajoutée avec succès !';
        this.closeForm();
        this.loadCategories();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        if (err.status === 400 && err.error?.nom) {
          this.errorMessage = err.error.nom[0];
        } else {
          this.errorMessage = 'Erreur lors de l\'ajout.';
        }
      }
    });
  }
}

  deleteCategorie(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer cette catégorie ?')) return;
    this.http.delete(`${this.apiUrl}/categories/${id}/`).subscribe({
      next: () => {
        this.successMessage = 'Catégorie supprimée avec succès !';
        this.loadCategories();
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }

  navigateTo(page: string) { this.router.navigate([`/${page}`]); }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/auth/login']);
  }
}