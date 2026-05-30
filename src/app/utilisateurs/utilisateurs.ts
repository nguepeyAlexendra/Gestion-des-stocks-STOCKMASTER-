import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';

@Component({
  selector    : 'app-utilisateurs',
  standalone  : true,
  imports     : [CommonModule, FormsModule, SidebarComponent],
  templateUrl : './utilisateurs.html',
  styleUrls   : ['./utilisateurs.css']
})
export class UtilisateursComponent implements OnInit {

  utilisateurs   : any[] = [];
  isLoading      = true;
  showForm       = false;
  isCreating     = false; 
  successMessage = '';
  errorMessage   = '';
  apiUrl         = 'http://127.0.0.1:8000/api';

  newUser = { username: '', email: '', role: 'utilisateur' };

  constructor(
    private http   : HttpClient,
    private router : Router
  ) {}

  ngOnInit(): void {
    this.loadUtilisateurs();
  }

  loadUtilisateurs(): void {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/auth/users/`).subscribe({
      next : (data) => { this.utilisateurs = data; this.isLoading = false; },
      error: ()     => { this.isLoading = false; }
    });
  }

  creerUtilisateur(): void {
  this.errorMessage   = '';
  this.successMessage = '';

  if (!this.newUser.username || !this.newUser.email) {
    this.errorMessage = 'Veuillez remplir tous les champs.';
    return;
  }

  this.isCreating = true;

  this.http.post<any>(`${this.apiUrl}/auth/users/`, this.newUser).subscribe({
    next: (data) => {
      this.successMessage = `Utilisateur ${data.user.username} créé ! Email envoyé.`;
      this.isCreating     = false;
      this.annuler();
      this.loadUtilisateurs();
      setTimeout(() => this.successMessage = '', 4000);
    },
    error: (err) => {
      this.isCreating   = false;
      const usernameErr = err.error?.username?.[0];
      const emailErr    = err.error?.email?.[0];
      if (usernameErr) {
        this.errorMessage = `Le nom d'utilisateur "${this.newUser.username}" est déjà pris.`;
      } else if (emailErr) {
        this.errorMessage = `Un compte existe déjà avec l'adresse "${this.newUser.email}".`;
      } else {
        this.errorMessage = 'Erreur lors de la création. Veuillez réessayer.';
      }
    }
  });
}

  annuler(): void {
    this.showForm     = false;
    this.errorMessage = '';
    this.newUser      = { username: '', email: '', role: 'utilisateur' };
  }

  supprimerUtilisateur(id: number, username: string): void {
    if (!confirm(`Supprimer l'utilisateur ${username} ?`)) return;
    this.http.delete(`${this.apiUrl}/auth/users/${id}/`).subscribe({
      next: () => {
        this.successMessage = `Utilisateur ${username} supprimé.`;
        this.loadUtilisateurs();
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }

  navigateTo(page: string): void { this.router.navigate(['/' + page]); }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    this.router.navigate(['/auth/login']);
  }
}