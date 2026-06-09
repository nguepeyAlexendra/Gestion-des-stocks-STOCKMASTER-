import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  // environment.apiUrl contient déjà 'http://127.0.0.1:8000/api'
  private baseUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profil/`);
  }

  updateProfile(formData: FormData): Observable<any> {
    return this.http.patch(`${this.baseUrl}/profil/`, formData);
  }

  changePassword(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/changer-mdp/`, data);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/mes-statistiques/`);
  }
}