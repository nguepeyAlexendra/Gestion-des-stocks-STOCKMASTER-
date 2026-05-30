import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(
    private http   : HttpClient,
    private router : Router
  ) {}

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login/`, credentials).pipe(
      tap((res: any) => {
        localStorage.setItem('access_token',  res.access);
        localStorage.setItem('refresh_token', res.refresh);
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/`, data).pipe(
      tap((res: any) => {
        localStorage.setItem('access_token',  res.tokens.access);
        localStorage.setItem('refresh_token', res.tokens.refresh);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('stockmaster_dark');
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  isAdmin(): boolean {
    return localStorage.getItem('user_role') === 'admin';
  }

  saveUserRole(role: string): void {
    localStorage.setItem('user_role', role);
  }

  getUserRole(): string {
    return localStorage.getItem('user_role') || 'utilisateur';
  }
}