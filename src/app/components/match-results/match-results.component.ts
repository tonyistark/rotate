import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { Employee, Match } from '../../models/employee.model';
import { EmployeeService } from '../../services/employee.service';
import { OpportunityService } from '../../services/opportunity.service';
import { MatchingService } from '../../services/matching.service';
import { OpportunityCardComponent } from '../opportunity-card/opportunity-card.component';
import { OpportunityModalComponent } from '../opportunity-modal/opportunity-modal.component';

@Component({
  selector: 'app-match-results',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    OpportunityCardComponent
  ],
  templateUrl: './match-results.component.html',
  styleUrls: ['./match-results.component.scss']
})
export class MatchResultsComponent implements OnInit {
  employee: Employee | null = null;
  matches: Match[] = [];
  filteredMatches: Match[] = [];
  filter: 'all' | 'high' | 'medium' | 'low' = 'all';
  sortBy: 'score' | 'deadline' = 'score';

  constructor(
    private employeeService: EmployeeService,
    private opportunityService: OpportunityService,
    private matchingService: MatchingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.employeeService.getCurrentEmployee().subscribe(employee => {
      if (employee) {
        this.employee = employee;
        this.calculateMatches();
      } else {
        this.router.navigate(['/profile']);
      }
    });
  }

  calculateMatches(): void {
    if (this.employee) {
      this.opportunityService.getOpportunities().subscribe(opportunities => {
        this.matches = this.matchingService.calculateMatches(this.employee!, opportunities);
        this.applyFiltersAndSort();
      });
    }
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.matches];

    // Apply filter
    switch (this.filter) {
      case 'high':
        filtered = filtered.filter(match => match.score >= 80);
        break;
      case 'medium':
        filtered = filtered.filter(match => match.score >= 60 && match.score < 80);
        break;
      case 'low':
        filtered = filtered.filter(match => match.score < 60);
        break;
    }

    // Apply sort
    if (this.sortBy === 'score') {
      filtered.sort((a, b) => b.score - a.score);
    } else {
      filtered.sort((a, b) => 
        new Date(a.opportunity.applicationDeadline).getTime() - 
        new Date(b.opportunity.applicationDeadline).getTime()
      );
    }

    this.filteredMatches = filtered;
  }

  onFilterChange(filter: 'all' | 'high' | 'medium' | 'low'): void {
    this.filter = filter;
    this.applyFiltersAndSort();
  }

  onSortChange(sortBy: 'score' | 'deadline'): void {
    this.sortBy = sortBy;
    this.applyFiltersAndSort();
  }

  getFilterCount(filterType: 'all' | 'high' | 'medium' | 'low'): number {
    switch (filterType) {
      case 'all':
        return this.matches.length;
      case 'high':
        return this.matches.filter(m => m.score >= 80).length;
      case 'medium':
        return this.matches.filter(m => m.score >= 60 && m.score < 80).length;
      case 'low':
        return this.matches.filter(m => m.score < 60).length;
    }
  }

  onApply(opportunityId: string): void {
    const opportunity = this.matches.find(m => m.opportunity.id === opportunityId)?.opportunity;
    if (opportunity) {
      this.snackBar.open(
        `Application submitted for "${opportunity.title}"! Your manager will be notified and you'll hear back within 5 business days.`,
        'Close',
        { duration: 5000 }
      );
    }
  }

  openModal(match: Match): void {
    const dialogRef = this.dialog.open(OpportunityModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { match }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'applied') {
        // Handle application submission if needed
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/profile']);
  }
}
