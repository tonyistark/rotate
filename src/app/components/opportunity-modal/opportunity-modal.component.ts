import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Match } from '../../models/employee.model';

@Component({
  selector: 'app-opportunity-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './opportunity-modal.component.html',
  styleUrls: ['./opportunity-modal.component.scss']
})
export class OpportunityModalComponent {
  constructor(
    public dialogRef: MatDialogRef<OpportunityModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { match: Match },
    private snackBar: MatSnackBar
  ) {}

  get match(): Match {
    return this.data.match;
  }

  getLevelColor(level: string): string {
    switch (level) {
      case 'Entry': return 'primary';
      case 'Mid': return 'accent';
      case 'Senior': return 'warn';
      case 'Lead': return 'primary';
      default: return 'primary';
    }
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  }

  onApply(): void {
    this.snackBar.open(
      `Application submitted for ${this.match.opportunity.title}!`,
      'Close',
      { duration: 3000 }
    );
    this.dialogRef.close('applied');
  }

  onClose(): void {
    this.dialogRef.close();
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
