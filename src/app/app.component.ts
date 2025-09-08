import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService, Theme } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, MatToolbarModule, MatIconModule, MatButtonModule, MatSlideToggleModule, MatTooltipModule],
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <mat-icon class="toolbar-icon">work</mat-icon>
      <span class="app-title" routerLink="/" matTooltip="Go to Home">Catalyst</span>
      <span class="spacer"></span>
      
      <div class="theme-toggle" matTooltip="Toggle theme">
        <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
        <mat-slide-toggle 
          [checked]="isDarkMode"
          (change)="toggleTheme()"
          color="accent">
        </mat-slide-toggle>
      </div>
      
      <button mat-button routerLink="/manager">
        <mat-icon>supervisor_account</mat-icon>
        Manager View
      </button>
      <button mat-button routerLink="/hrbp-dashboard">
        <mat-icon>dashboard</mat-icon>
        HRBP Dashboard
      </button>
      <button mat-button routerLink="/new-employees">
        <mat-icon>group</mat-icon>
        New Employee Page
      </button>
      <button mat-button routerLink="/admin">
        <mat-icon>admin_panel_settings</mat-icon>
        Admin
      </button>
    </mat-toolbar>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      
      .toolbar-icon {
        margin-right: 12px;
      }
      
      .app-title {
        cursor: pointer;
        font-size: 20px;
        font-weight: 500;
        transition: all 0.2s ease;
        padding: 4px 8px;
        border-radius: 4px;
        
        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
          transform: scale(1.02);
        }
        
        &:active {
          transform: scale(0.98);
        }
      }
      
      .spacer {
        flex: 1 1 auto;
      }
      
      button {
        margin-left: 8px;
        
        mat-icon {
          margin-right: 8px;
        }
      }
    }
    
    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-right: 16px;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      
      mat-slide-toggle {
        transform: scale(0.8);
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'angular-opportunity-matcher';
  isDarkMode = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.theme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark';
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
