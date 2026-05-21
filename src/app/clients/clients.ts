import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SidebarComponent],
  templateUrl: './clients.html',
  styleUrls: ['./clients.css']
})
export class ClientsComponent implements OnInit {
  clients        : any[] = [];
  isLoading      = true;
  showForm       = false;
  isEditing      = false;
  editingId      : number | null = null;
  errorMessage   = '';
  successMessage = '';
  searchTerm     = '';
  apiUrl         = 'http://127.0.0.1:8000/api';
  clientForm     : FormGroup;

  constructor(
    private http   : HttpClient,
    private fb     : FormBuilder,
    private router : Router
  ) {
    this.clientForm = this.fb.group({
      nom       : ['', [Validators.required]],
      prenom    : [''],
      telephone : [''],
      email     : ['', [Validators.email]],
      adresse   : ['']
    });
  }

  ngOnInit() { this.loadClients(); }

  loadClients() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/clients/`).subscribe({
      next : (data) => {
        this.clients   = data.results || data;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  get clientsFiltres() {
    return this.clients.filter(c =>
      c.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (c.prenom && c.prenom.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
      (c.telephone && c.telephone.includes(this.searchTerm))
    );
  }

  openForm(client?: any) {
    this.showForm     = true;
    this.errorMessage = '';
    if (client) {
      this.isEditing = true;
      this.editingId = client.id;
      this.clientForm.patchValue(client);
    } else {
      this.isEditing = false;
      this.editingId = null;
      this.clientForm.reset();
    }
  }

  closeForm() {
    this.showForm = false;
    this.clientForm.reset();
  }

  saveClient() {
    if (this.clientForm.invalid) return;
    const data = this.clientForm.value;
    if (this.isEditing && this.editingId) {
      this.http.put(`${this.apiUrl}/clients/${this.editingId}/`, data).subscribe({
        next: () => {
          this.successMessage = 'Client modifié avec succès !';
          this.closeForm();
          this.loadClients();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => this.errorMessage = 'Erreur lors de la modification.'
      });
    } else {
      this.http.post(`${this.apiUrl}/clients/`, data).subscribe({
        next: () => {
          this.successMessage = 'Client ajouté avec succès !';
          this.closeForm();
          this.loadClients();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => this.errorMessage = 'Erreur lors de l\'ajout.'
      });
    }
  }

  deleteClient(id: number) {
    if (!confirm('Voulez-vous vraiment supprimer ce client ?')) return;
    this.http.delete(`${this.apiUrl}/clients/${id}/`).subscribe({
      next: () => {
        this.successMessage = 'Client supprimé avec succès !';
        this.loadClients();
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

  getInitiales(nom: string, prenom: string): string {
    return `${nom.charAt(0)}${prenom ? prenom.charAt(0) : ''}`.toUpperCase();
  }
}