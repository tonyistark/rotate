import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Match } from '../../models/employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';

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
export class OpportunityCardComponent extends BaseComponent {
  @Input() match!: Match;
  @Output() apply = new EventEmitter<Match>();
  @Output() cardClick = new EventEmitter<Match>();

  constructor(
    private snackBar: MatSnackBar,
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'match-score-high';
    if (score >= 70) return 'match-score-medium';
    return 'match-score-low';
  }

  override getLevelColor(level: string): string {
    switch (level?.toLowerCase()) {
      case 'sr. vp':
      case 'managing vp':
      case 'vp':
        return 'warn';
      case 'sr. director':
      case 'director':
        return 'accent';
      case 'sr. manager':
      case 'manager':
        return 'primary';
      case 'principal associate':
      case 'sr. associate':
        return 'accent';
      case 'associate':
      default:
        return 'primary';
    }
  }

  onApply(): void {
    this.apply.emit(this.match);
    this.snackBar.open(
      `Application submitted for ${this.match.opportunity.title}!`,
      'Close',
      { duration: 3000 }
    );
  }

  onCardClick(): void {
    this.cardClick.emit(this.match);
  }

}
