import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Match } from '../../models/employee.model';

@Component({
  selector: 'app-opportunity-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './opportunity-card.component.html',
  styleUrls: ['./opportunity-card.component.scss']
})
export class OpportunityCardComponent {
  @Input() match!: Match;
  @Output() apply = new EventEmitter<string>();
  @Output() cardClick = new EventEmitter<Match>();

  getScoreClass(score: number): string {
    if (score >= 80) return 'match-score-high';
    if (score >= 60) return 'match-score-medium';
    return 'match-score-low';
  }

  getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'entry': return 'primary';
      case 'mid': return 'accent';
      case 'senior': return 'warn';
      case 'lead': return 'primary';
      case 'development': return 'accent';
      default: return 'primary';
    }
  }

  constructor(private snackBar: MatSnackBar) { }

  onApply(): void {
    this.snackBar.open(
      `Application submitted for ${this.match.opportunity.title}!`,
      'Close',
      { duration: 3000 }
    );
  }

  onCardClick(): void {
    this.cardClick.emit(this.match);
  }

  formatDate(dateString: string): string {
    if (!dateString || dateString.trim() === '') {
      return 'Not set';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Not set';
    }
    return date.toLocaleDateString();
  }
}
