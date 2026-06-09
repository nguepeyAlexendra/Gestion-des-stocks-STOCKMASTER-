import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { DarkModeService } from '../shared/dark-mode';

@Component({
  selector    : 'app-profil',
  standalone  : true,
  imports     : [CommonModule, FormsModule, SidebarComponent],
  templateUrl : './profil.html',
  styleUrls   : ['./profil.css']
})
export class ProfilComponent implements OnInit {

  isDark   = false;
  isAdmin  = false;
  isLoading = true;
  apiUrl   = 'http://127.0.0.1:8000/api';

  // Infos profil
  profil = {
    username   : '',
    email      : '',
    first_name : '',
    last_name  : '',
    telephone  : '',
    adresse    : '',
    role       : '',
    photo      : ''
  };

  // Stats
  stats = {
    total_ventes    : 0,
    chiffre_affaires: 0,
    total_clients   : 0,
    total_factures  : 0,
  };

  // Formulaire modification
  editMode      = false;
  successMessage = '';
  errorMessage   = '';

  editForm = {
    first_name : '',
    last_name  : '',
    email      : '',
    telephone  : '',
    adresse    : ''
  };

  // Formulaire mot de passe
  showPasswordForm  = false;
  passwordSuccess   = '';
  passwordError     = '';
  passwordForm = {
    old_password      : '',
    new_password      : '',
    confirm_password  : ''
  };

  // Photo
  photoPreview : string | null = null;
  photoFile    : File   | null = null;

  constructor(
    private http            : HttpClient,
    private router          : Router,
    private darkModeService : DarkModeService
  ) {}

  ngOnInit(): void {
    this.isDark  = this.darkModeService.getDarkMode();
    this.isAdmin = localStorage.getItem('user_role') === 'admin';
    this.loadProfil();
    this.loadStats();
  }

  toggleDark(): void {
    this.darkModeService.toggleDark();
    this.isDark = this.darkModeService.getDarkMode();
  }

  loadProfil(): void {
    this.http.get<any>(`${this.apiUrl}/auth/profile/`).subscribe({
      next: (data) => {
        this.profil = {
          username   : data.username   || '',
          email      : data.email      || '',
          first_name : data.first_name || '',
          last_name  : data.last_name  || '',
          telephone  : data.telephone  || '',
          adresse    : data.adresse    || '',
          role       : data.role       || 'utilisateur',
          photo      : data.photo_url  || ''
        };
        this.editForm = {
          first_name : this.profil.first_name,
          last_name  : this.profil.last_name,
          email      : this.profil.email,
          telephone  : this.profil.telephone,
          adresse    : this.profil.adresse
        };
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadStats(): void {
    this.http.get<any>(`${this.apiUrl}/ventes/statistiques/`).subscribe({
      next: (data) => {
        this.stats.total_ventes     = data.total_ventes     || 0;
        this.stats.chiffre_affaires = data.chiffre_affaires || 0;
      }
    });
    this.http.get<any>(`${this.apiUrl}/clients/`).subscribe({
      next: (data) => {
        const liste = data.results || data;
        this.stats.total_clients = liste.length;
      }
    });
    this.http.get<any>(`${this.apiUrl}/factures/`).subscribe({
      next: (data) => {
        const liste = data.results || data;
        this.stats.total_factures = liste.length;
      }
    });
  }

  ouvrirEdit(): void {
    this.editMode     = true;
    this.successMessage = '';
    this.errorMessage   = '';
  }

  annulerEdit(): void {
    this.editMode = false;
    this.editForm = {
      first_name : this.profil.first_name,
      last_name  : this.profil.last_name,
      email      : this.profil.email,
      telephone  : this.profil.telephone,
      adresse    : this.profil.adresse
    };
  }

  sauvegarderProfil(): void {
    this.errorMessage   = '';
    this.successMessage = '';
    this.http.patch<any>(`${this.apiUrl}/auth/profile/update/`, this.editForm).subscribe({
      next: (data) => {
        this.profil.first_name = data.first_name || this.editForm.first_name;
        this.profil.last_name  = data.last_name  || this.editForm.last_name;
        this.profil.email      = data.email      || this.editForm.email;
        this.profil.telephone  = data.telephone  || this.editForm.telephone;
        this.profil.adresse    = data.adresse    || this.editForm.adresse;
        this.successMessage    = 'Profil mis à jour avec succès !';
        this.editMode          = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Erreur lors de la mise à jour.';
      }
    });
  }

  onPhotoChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.photoFile = file;
      const reader  = new FileReader();
      reader.onload = (e: any) => this.photoPreview = e.target.result;
      reader.readAsDataURL(file);
      this.uploaderPhoto(file);
    }
  }

  uploaderPhoto(file: File): void {
    const formData = new FormData();
    formData.append('photo', file);
    this.http.patch<any>(`${this.apiUrl}/auth/profile/update/`, formData).subscribe({
      next: (data) => {
        this.profil.photo = data.photo_url || this.photoPreview || '';
        this.successMessage = 'Photo mise à jour !';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => this.errorMessage = 'Erreur lors de l\'upload de la photo.'
    });
  }

  changerMotDePasse(): void {
    this.passwordError   = '';
    this.passwordSuccess = '';

    if (this.passwordForm.new_password !== this.passwordForm.confirm_password) {
      this.passwordError = 'Les mots de passe ne correspondent pas.';
      return;
    }
    if (this.passwordForm.new_password.length < 6) {
      this.passwordError = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    this.http.post<any>(`${this.apiUrl}/auth/change-password/`, {
      old_password : this.passwordForm.old_password,
      new_password : this.passwordForm.new_password
    }).subscribe({
      next: () => {
        this.passwordSuccess  = 'Mot de passe changé avec succès !';
        this.passwordForm     = { old_password: '', new_password: '', confirm_password: '' };
        this.showPasswordForm = false;
        setTimeout(() => this.passwordSuccess = '', 3000);
      },
      error: (err) => {
        this.passwordError = err.error?.detail || 'Mot de passe actuel incorrect.';
      }
    });
  }

  get userInitials(): string {
    const nom = this.profil.first_name || this.profil.username;
    return nom.substring(0, 2).toUpperCase();
  }

  formatMontant(montant: number): string {
    return Number(montant).toLocaleString('fr-FR') + ' F';
  }

  navigateTo(page: string): void { this.router.navigate(['/' + page]); }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    this.router.navigate(['/auth/login']);
  }
}