import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SidebarComponent } from '../shared/sidebar/sidebar';
import { DarkModeService } from '../shared/dark-mode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector   : 'app-factures',
  standalone : true,
  imports    : [CommonModule, SidebarComponent],
  templateUrl: './factures.html',
  styleUrls  : ['./factures.css']
})
export class FacturesComponent implements OnInit {

  @ViewChild('factureContent') factureContent!: ElementRef;

  factures      : any[] = [];
  isLoading     = true;
  searchTerm    = '';
  factureDetail : any   = null;
  venteDetail   : any;
  isDark        = false;
  isAdmin       = false;
  isGeneratingPdf = false;
  apiUrl        = 'http://127.0.0.1:8000/api';

  constructor(
    private http            : HttpClient,
    private router          : Router,
    private darkModeService : DarkModeService
  ) {}

  ngOnInit() {
    this.isDark  = this.darkModeService.getDarkMode();
    this.isAdmin = localStorage.getItem('user_role') === 'admin';
    this.loadFactures();
  }

  toggleDark(): void {
    this.darkModeService.toggleDark();
    this.isDark = this.darkModeService.getDarkMode();
  }

  loadFactures() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/factures/`).subscribe({
      next : (data) => { this.factures = data.results || data; this.isLoading = false; },
      error: () => this.isLoading = false
    });
  }

  get facturesFiltres() {
    return this.factures.filter(f =>
      f.numero_facture.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (f.client_nom && f.client_nom.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  voirDetail(facture: any) { this.factureDetail = facture; }
  fermerDetail()           { this.factureDetail = null; }
  onSearch(event: any)     { this.searchTerm = event.target.value; }
  navigateTo(page: string) { this.router.navigate([`/${page}`]); }

  imprimer() { window.print(); }

  async telechargerPDF() {
    if (!this.factureContent) return;
    
    this.isGeneratingPdf = true;

    try {
      const element = this.factureContent.nativeElement;
      
      const canvas = await html2canvas(element, {
        scale      : 2,
        useCORS    : true,
        backgroundColor: '#ffffff',
        logging    : false
      });

      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${this.factureDetail.numero_facture}.pdf`);

    } catch (error) {
      console.error('Erreur génération PDF:', error);
    } finally {
      this.isGeneratingPdf = false;
    }
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    this.router.navigate(['/auth/login']);
  }
}