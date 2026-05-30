import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth.service';

@Component({
  selector   : 'app-login',
  standalone : true,
  imports    : [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl   : './login.css'
})
export class LoginComponent {
  loginForm    : FormGroup;
  isLoading    = false;
  errorMessage = '';
  apiUrl       = 'http://127.0.0.1:8000/api';

  constructor(
    private fb          : FormBuilder,
    private authService : AuthService,
    private router      : Router,
    private http        : HttpClient
  ) {
    this.loginForm = this.fb.group({
      username : ['', [Validators.required]],
      password : ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading    = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        // Récupérer le profil pour connaître le rôle
        this.http.get<any>(`${this.apiUrl}/auth/profile/`).subscribe({
          next: (profile) => {
            this.isLoading = false;
            const role     = profile.role || 'utilisateur';
            this.authService.saveUserRole(role);

            // Rediriger selon le rôle
            if (role === 'admin') {
              this.router.navigate(['/admin-dashboard']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          },
          error: () => {
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: () => {
        this.isLoading    = false;
        this.errorMessage = 'Identifiants incorrects. Veuillez réessayer.';
      }
    });
  }
}