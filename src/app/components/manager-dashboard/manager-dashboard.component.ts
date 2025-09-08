import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ManagerService, EmployeeWithMatches } from '../../services/manager.service';
import { OpportunityModalComponent } from '../opportunity-modal/opportunity-modal.component';
import { EmployeeDetailModalComponent } from '../employee-detail-modal/employee-detail-modal.component';
import { Match, Employee } from '../../models/employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss']
})
export class ManagerDashboardComponent extends BaseComponent implements OnInit {
  teamMembers: EmployeeWithMatches[] = [];
  loading = true;

  constructor(
    private managerService: ManagerService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
  }

  ngOnInit(): void {
    this.loadTeamData();
  }

  loadTeamData(): void {
    this.managerService.getTeamWithMatches().subscribe(team => {
      this.teamMembers = team;
      this.loading = false;
    });
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  }


  override getPerformanceColor(rating: string): string {
    switch (rating) {
      case 'Outstanding': return '#4caf50';
      case 'Exceeds': return '#2196f3';
      case 'Meets': return '#ff9800';
      case 'Below': return '#f44336';
      default: return '#666';
    }
  }

  assignOpportunity(employeeId: string, opportunityId: string, opportunityTitle: string): void {
    this.managerService.assignOpportunityToEmployee(employeeId, opportunityId);
    this.snackBar.open(
      `Assigned "${opportunityTitle}" to employee`,
      'Close',
      { duration: 3000 }
    );
  }

  removeAssignment(employeeId: string, opportunityId: string, opportunityTitle: string): void {
    this.managerService.removeAssignment(employeeId, opportunityId);
    this.snackBar.open(
      `Removed assignment "${opportunityTitle}"`,
      'Close',
      { duration: 3000 }
    );
  }

  isAssigned(employeeId: string, opportunityId: string): boolean {
    const employee = this.teamMembers.find(tm => tm.employee.id === employeeId);
    return employee?.assignments.includes(opportunityId) || false;
  }

  viewOpportunityDetails(match: Match): void {
    const dialogRef = this.dialog.open(OpportunityModalComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: { match }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'applied') {
        // Handle if needed
      }
    });
  }

  override formatDate(dateString: string): string {
    if (!dateString || dateString.trim() === '') {
      return 'Not set';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Not set';
    }
    return date.toLocaleDateString();
  }

  getTotalAssignments(): number {
    return this.teamMembers.reduce((total, member) => total + member.assignments.length, 0);
  }

  getHighPerformers(): number {
    return this.teamMembers.filter(member => 
      member.employee.performanceRating === 'Outstanding' || 
      member.employee.performanceRating === 'Exceeds'
    ).length;
  }

  getAverageMatchScore(): number {
    const allScores = this.teamMembers.flatMap(member => 
      member.topMatches.map(match => match.score)
    );
    return allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
  }

  override getAttritionRiskClass(risk: number): string {
    if (risk <= 15) return 'risk-low';
    if (risk <= 30) return 'risk-medium';
    return 'risk-high';
  }

  viewEmployeeDetails(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDetailModalComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: employee
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.action === 'save') {
        // Update the employee in the team members array
        const teamMemberIndex = this.teamMembers.findIndex(tm => tm.employee.id === result.employee.id);
        if (teamMemberIndex !== -1) {
          this.teamMembers[teamMemberIndex].employee = result.employee;
          this.snackBar.open('Employee information updated successfully', 'Close', { duration: 3000 });
        }
      }
    });
  }


  viewAllOpportunities(): void {
    this.router.navigate(['/opportunities']);
  }
}
