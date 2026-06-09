import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector  : 'app-sidebar',
  standalone: true,
  imports   : [CommonModule],
  templateUrl: './sidebar.html',
  styleUrls : ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  @Input() activePage: string = '';

  userName     = '';
  userEmail    = '';
  userInitials = '';
  isAdmin      = false;
  apiUrl       = 'http://127.0.0.1:8000/api';

  constructor(
    private router : Router,
    private http   : HttpClient
  ) {}

  ngOnInit() {
    this.isAdmin = localStorage.getItem('user_role') === 'admin';
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload     = JSON.parse(atob(token.split('.')[1]));
        this.userName     = payload.username || 'Utilisateur';
        this.userEmail    = payload.email    || '';
        this.userInitials = this.userName.substring(0, 2).toUpperCase();
      } catch {
        this.userName     = 'Utilisateur';
        this.userInitials = 'US';
      }
    }
    this.http.get<any>(`${this.apiUrl}/auth/profile/`).subscribe({
      next: (data) => {
        this.userName     = data.username || this.userName;
        this.userEmail    = data.email    || this.userEmail;
        this.userInitials = this.userName.substring(0, 2).toUpperCase();
      },
      error: () => {}
    });
  }

  navigateTo(page: string) {
    this.router.navigate([`/${page}`]);
  }
logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_role');
  this.router.navigate(['/auth/login']);
}
}