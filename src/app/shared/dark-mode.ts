import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DarkModeService {

  private isDark = false;

  constructor() {
    this.isDark = localStorage.getItem('stockmaster_dark') === '1';
    this.applyDarkMode();
  }

  toggleDark(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('stockmaster_dark', this.isDark ? '1' : '0');
    this.applyDarkMode();
  }

  getDarkMode(): boolean {
    return this.isDark;
  }

  private applyDarkMode(): void {
    if (this.isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}