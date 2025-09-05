import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private themeSubject = new BehaviorSubject<Theme>(this.getStoredTheme());
  
  theme$ = this.themeSubject.asObservable();

  constructor() {
    this.applyTheme(this.themeSubject.value);
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.THEME_KEY) as Theme;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    
    // Default to dark mode or detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'dark'; // Default to dark since we just implemented it
  }

  toggleTheme(): void {
    const currentTheme = this.themeSubject.value;
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme: Theme): void {
    this.themeSubject.next(theme);
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  getCurrentTheme(): Theme {
    return this.themeSubject.value;
  }

  private applyTheme(theme: Theme): void {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('light-theme', 'dark-theme');
    
    // Add new theme class
    body.classList.add(`${theme}-theme`);
    
    // Set data-theme attribute for CSS selectors
    body.setAttribute('data-theme', theme);
    
    // Update CSS custom properties
    if (theme === 'dark') {
      this.setDarkThemeProperties();
    } else {
      this.setLightThemeProperties();
    }
  }

  private setDarkThemeProperties(): void {
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', '#121212');
    root.style.setProperty('--bg-secondary', '#1e1e1e');
    root.style.setProperty('--bg-tertiary', '#2d2d2d');
    root.style.setProperty('--bg-card', '#1e1e1e');
    root.style.setProperty('--bg-elevated', '#2d2d2d');
    root.style.setProperty('--text-primary', '#ffffff');
    root.style.setProperty('--text-secondary', '#b3b3b3');
    root.style.setProperty('--text-muted', '#808080');
    root.style.setProperty('--border-color', '#404040');
    root.style.setProperty('--accent-primary', '#3f51b5');
    root.style.setProperty('--accent-secondary', '#5c6bc0');
    root.style.setProperty('--success', '#4caf50');
    root.style.setProperty('--warning', '#ff9800');
    root.style.setProperty('--error', '#f44336');
    root.style.setProperty('--info', '#2196f3');
  }

  private setLightThemeProperties(): void {
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', '#f5f5f5');
    root.style.setProperty('--bg-secondary', '#ffffff');
    root.style.setProperty('--bg-tertiary', '#f8f9fa');
    root.style.setProperty('--bg-card', '#ffffff');
    root.style.setProperty('--bg-elevated', '#ffffff');
    root.style.setProperty('--text-primary', '#1a1a1a');
    root.style.setProperty('--text-secondary', '#666666');
    root.style.setProperty('--text-muted', '#999999');
    root.style.setProperty('--border-color', '#e0e0e0');
    root.style.setProperty('--accent-primary', '#3f51b5');
    root.style.setProperty('--accent-secondary', '#5c6bc0');
    root.style.setProperty('--success', '#4caf50');
    root.style.setProperty('--warning', '#ff9800');
    root.style.setProperty('--error', '#f44336');
    root.style.setProperty('--info', '#2196f3');
  }
}
