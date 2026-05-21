import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './fournisseurs.html',
  styleUrls: ['./fournisseurs.css']
})
export class FournisseursComponent implements OnInit {
  fournisseurs   : any[] = [];
  isLoading      = true;
  showForm       = false;
  isEditing      = false;
  editingId      : number | null = null;
  errorMessage   = '';
  successMessage = '';
  searchTerm     = '';
  apiUrl         = 'http://127.0.0.1:8000/api';
  fournisseurForm: FormGroup;

  constructor(
    private http   : HttpClient,
    private fb     : FormBuilder,
    private router : Router
  ) {
    this.fournisseurForm = this.fb.group({
      nom       : ['', [Validators.required]],
      telephone : [''],
      email     : ['', [Validators.email]],
      adresse   : ['']
    });
  }

  ngOnInit() { this.loadFournisseurs(); }

  loadFournisseurs() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/fournisseurs/`).subscribe({
      next : (data) => {
        this.fournisseurs = data.results || data;
        this.isLoading    = false;
      },
      error: () => this.isLoading = false
    });
  }

  get fournisseursFiltres() {
    return this.fournisseurs.filter(f =>
      f.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (f.telephone && f.telephone.includes(this.searchTerm))
    );
  }

  openForm(fournisseur?: any) {
    this.showForm     = true;
    this.errorMessage = '';
    if (fournisseur) {
      this.isEditing = true;
      this.editingId = fournisseur.id;
      this.fournisseurForm.patchValue(fournisseur);
    } else {
      this.isEditing = false;
      this.editingId = null;
      this.fournisseurForm.reset();
    }
  }

  closeForm() {
    this.showForm = false;
    this.fournisseurForm.reset();
  }

  saveFournisseur() {
    if (this.fournisseurForm.invalid) return;
    const data = this.fournisseurForm.value;
    if (this.isEditing && this.editingId) {
      this.http.put(`${this.apiUrl}/fournisseurs/${this.editingId}/`, data).subscribe({
        next: () => {
          this.successMessage = 'Fournisseur modifié avec succès !';
          this.closeForm();
          this.loadFournisseurs();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => this.errorMessage = 'Erreur lors de la modification.'
      });
    } else {
      this.http.post(`${this.apiUrl}/fournisseurs/`, data).subscribe({
        next: () => {
          this.successMessage = 'Fournisseur ajouté avec succès !';
          this.closeForm();
          this.loadFournisseurs();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => this.errorMessage = 'Erreur lors de l\'ajout.'
      });
    }
  }

  deleteFournisseur(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer ce fournisseur ?')) return;
    this.http.delete(`${this.apiUrl}/fournisseurs/${id}/`).subscribe({
      next: () => {
        this.successMessage = 'Fournisseur supprimé avec succès !';
        this.loadFournisseurs();
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }

  onSearch(event: any) { this.searchTerm = event.target.value; }
  navigateTo(page: string) { this.router.navigate([`/${page}`]); }
  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.router.navigate(['/auth/login']);
  }

  getInitiales(nom: string): string {
    return nom.substring(0, 2).toUpperCase();
  }
}