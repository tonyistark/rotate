import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';

import { Opportunity } from '../../models/employee.model';
import { Employee } from '../../models/employee.model';
import { OpportunityService } from '../../services/opportunity.service';
import { EmployeeService } from '../../services/employee.service';
import { EmployeeDetailModalComponent } from '../employee-detail-modal/employee-detail-modal.component';

interface EmployeeMatch {
  employee: Employee;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
}

@Component({
  selector: 'app-hrbp-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './hrbp-dashboard.component.html',
  styleUrls: ['./hrbp-dashboard.component.scss'],
})
export class HrbpDashboardComponent implements OnInit {
  opportunities: Opportunity[] = [];
  filteredOpportunities: Opportunity[] = [];
  employees: Employee[] = [];
  selectedOpportunity: Opportunity | null = null;
  employeeMatches: EmployeeMatch[] = [];

  // Search and filter state
  searchTerm: string = '';
  showEmployeePanel = false;
  showInstructionPopup = false;

  // Filter options
  selectedLeader = '';
  selectedJobLevel = '';
  selectedJobFamily = '';
  selectedJobProfile = '';
  selectedPlIc = '';
  selectedTenure = '';
  selectedLocation = '';
  selectedDayZero = '';
  selectedLossImpact = '';
  selectedAttritionRisk = '';
  selectedAttritionResponse = '';
  selectedPerformanceRating = '';
  selectedRotationLevel = '';
  selectedRotationLength = '';

  // Filter dropdown options
  leaders: string[] = [];
  jobLevels: string[] = [];
  jobFamilies: string[] = [];
  jobProfiles: string[] = [];
  plIcOptions: string[] = [];
  tenureOptions: string[] = [];
  locationOptions: string[] = [];
  dayZeroOptions: string[] = [];
  lossImpactOptions: string[] = [];
  attritionRiskOptions: string[] = [];
  attritionResponseOptions: string[] = [];
  performanceRatingOptions: string[] = [];
  rotationLevelOptions: string[] = [];
  rotationLengthOptions: string[] = [];

  constructor(
    private opportunityService: OpportunityService,
    private employeeService: EmployeeService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadOpportunities();
    this.loadEmployees();
  }

  loadOpportunities(): void {
    this.opportunityService.getOpportunities().subscribe(opportunities => {
      this.opportunities = opportunities;
      this.filteredOpportunities = opportunities;
      this.populateFilterOptions();
    });
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe(employees => {
      this.employees = employees;
    });
  }

  populateFilterOptions(): void {
    // Extract unique values from opportunities for filter dropdowns
    this.leaders = ['All', ...new Set(this.opportunities.map(opp => opp.leader))];
    this.jobLevels = ['All', ...new Set(this.opportunities.map(opp => opp.jobLevel))];
    this.jobFamilies = ['All', ...new Set(this.opportunities.map(opp => opp.jobFamily))];
    this.jobProfiles = ['All', ...new Set(this.opportunities.map(opp => opp.jobProfile))];
    this.tenureOptions = ['All', ...new Set(this.opportunities.map(opp => opp.tenure))];
    this.locationOptions = ['All', ...new Set(this.opportunities.map(opp => opp.location))];
    this.attritionResponseOptions = ['All', ...new Set(this.opportunities.map(opp => opp.attritionResponse))];
    this.performanceRatingOptions = ['All', ...new Set(this.opportunities.flatMap(opp => opp.previousPerformanceRatings))];
    this.rotationLevelOptions = ['All', ...new Set(this.opportunities.map(opp => opp.rotationLevel))];
    this.rotationLengthOptions = ['All', ...new Set(this.opportunities.map(opp => opp.rotationLength))];
  }

  applyFilters(): void {
    this.filteredOpportunities = this.opportunities.filter(opportunity => {
      // Search term filter
      const matchesSearch = !this.searchTerm || 
        opportunity.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        opportunity.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        opportunity.department.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      return matchesSearch && (
        (this.selectedLeader === '' || this.selectedLeader === 'All' || opportunity.leader === this.selectedLeader) &&
        (this.selectedJobLevel === '' || this.selectedJobLevel === 'All' || opportunity.jobLevel === this.selectedJobLevel) &&
        (this.selectedJobFamily === '' || this.selectedJobFamily === 'All' || opportunity.jobFamily === this.selectedJobFamily) &&
        (this.selectedJobProfile === '' || this.selectedJobProfile === 'All' || opportunity.jobProfile === this.selectedJobProfile) &&
        (this.selectedPlIc === '' || this.selectedPlIc === 'All' || opportunity.plIc === this.selectedPlIc) &&
        (this.selectedTenure === '' || this.selectedTenure === 'All' || opportunity.tenure === this.selectedTenure) &&
        (this.selectedLocation === '' || this.selectedLocation === 'All' || opportunity.location === this.selectedLocation) &&
        (this.selectedDayZero === '' || this.selectedDayZero === 'All' || String(opportunity.dayZero) === this.selectedDayZero) &&
        (this.selectedLossImpact === '' || this.selectedLossImpact === 'All' || opportunity.lossImpact === this.selectedLossImpact) &&
        (this.selectedAttritionRisk === '' || this.selectedAttritionRisk === 'All' || opportunity.attritionRisk === this.selectedAttritionRisk) &&
        (this.selectedAttritionResponse === '' || this.selectedAttritionResponse === 'All' || opportunity.attritionResponse === this.selectedAttritionResponse) &&
        (this.selectedRotationLevel === '' || this.selectedRotationLevel === 'All' || opportunity.rotationLevel === this.selectedRotationLevel) &&
        (this.selectedRotationLength === '' || this.selectedRotationLength === 'All' || opportunity.rotationLength === this.selectedRotationLength)
      );
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onOpportunityClick(opportunity: Opportunity): void {
    this.selectedOpportunity = opportunity;
    this.calculateEmployeeMatches(opportunity);
    // Don't automatically show the panel, just update the right sidebar
  }


  clearSearch(): void {
    this.searchTerm = '';
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedLeader || this.selectedJobLevel || this.selectedJobFamily || 
             this.selectedJobProfile || this.selectedPlIc || this.selectedTenure ||
             this.selectedLocation || this.selectedRotationLevel || this.selectedRotationLength ||
             this.searchTerm);
  }

  clearFilter(filterType: string): void {
    switch (filterType) {
      case 'leader':
        this.selectedLeader = '';
        break;
      case 'jobLevel':
        this.selectedJobLevel = '';
        break;
      case 'jobFamily':
        this.selectedJobFamily = '';
        break;
      case 'jobProfile':
        this.selectedJobProfile = '';
        break;
      case 'plIc':
        this.selectedPlIc = '';
        break;
      case 'tenure':
        this.selectedTenure = '';
        break;
      case 'location':
        this.selectedLocation = '';
        break;
      case 'rotationLevel':
        this.selectedRotationLevel = '';
        break;
      case 'rotationLength':
        this.selectedRotationLength = '';
        break;
    }
    this.onFilterChange();
  }

  clearAllFilters(): void {
    this.selectedLeader = '';
    this.selectedJobLevel = '';
    this.selectedJobFamily = '';
    this.selectedJobProfile = '';
    this.selectedPlIc = '';
    this.selectedTenure = '';
    this.selectedLocation = '';
    this.selectedDayZero = '';
    this.selectedLossImpact = '';
    this.selectedAttritionRisk = '';
    this.selectedAttritionResponse = '';
    this.selectedPerformanceRating = '';
    this.selectedRotationLevel = '';
    this.selectedRotationLength = '';
    this.searchTerm = '';
    this.onFilterChange();
  }

  showEmployeeDetails(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDetailModalComponent, {
      width: '90vw',
      maxWidth: '1200px',
      data: { employee }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle any updates to employee data
        console.log('Employee updated:', result);
      }
    });
  }

  calculateEmployeeMatches(opportunity: Opportunity): void {
    // Create opportunity-specific employee matches with varied results
    let potentialMatches = this.employees.map(employee => {
      const matchingSkills = employee.skills.filter(skill => 
        opportunity.requiredSkills.includes(skill) || 
        opportunity.preferredSkills.includes(skill)
      );
      
      const missingSkills = opportunity.requiredSkills.filter(skill => 
        !employee.skills.includes(skill)
      );

      // Calculate base match score
      let score = 0;
      
      // Skills match (40% weight)
      const skillMatchRatio = matchingSkills.length / (opportunity.requiredSkills.length + opportunity.preferredSkills.length);
      score += skillMatchRatio * 40;
      
      // Performance rating (20% weight)
      const performanceScore = this.getPerformanceScore(employee.performanceRating);
      score += (performanceScore / 5) * 20;
      
      // Career interest alignment (20% weight)
      const interestAlignment = this.calculateInterestAlignment(employee, opportunity);
      score += interestAlignment * 20;
      
      // Availability and rotation interest (20% weight)
      if (employee.confirmedInterestInRotation && employee.leadershipSupportOfRotation) {
        score += 20;
      } else if (employee.confirmedInterestInRotation || employee.leadershipSupportOfRotation) {
        score += 10;
      }

      // Add opportunity-specific adjustments to create variety
      score += this.getOpportunitySpecificAdjustment(employee, opportunity);

      return {
        employee,
        matchScore: Math.min(100, Math.max(0, Math.round(score))),
        matchingSkills,
        missingSkills
      };
    });

    // Filter and sort based on opportunity characteristics
    this.employeeMatches = this.filterAndSortForOpportunity(potentialMatches, opportunity);
  }

  getPerformanceScore(rating: string): number {
    switch (rating) {
      case 'Outstanding': return 5;
      case 'Exceeds': return 4;
      case 'Meets': return 3;
      case 'Below': return 2;
      default: return 1;
    }
  }

  calculateInterestAlignment(employee: Employee, opportunity: Opportunity): number {
    const alignmentScore = employee.careerInterest.some(interest => 
      opportunity.description.toLowerCase().includes(interest.toLowerCase()) ||
      opportunity.title.toLowerCase().includes(interest.toLowerCase())
    ) ? 1 : 0.5;
    
    return alignmentScore;
  }

  getOpportunitySpecificAdjustment(employee: Employee, opportunity: Opportunity): number {
    let adjustment = 0;
    
    // Create different match patterns based on opportunity ID
    switch (opportunity.id) {
      case '1': // Data Analytics Project Lead
        if (employee.department === 'Data Science' || employee.department === 'Engineering') adjustment += 15;
        if (employee.yearsExperience >= 4) adjustment += 10;
        break;
      case '2': // UX Research Initiative  
        if (employee.department === 'Design' || employee.department === 'Product') adjustment += 15;
        if (employee.currentRole.includes('Designer') || employee.currentRole.includes('UX')) adjustment += 10;
        break;
      case '3': // Cloud Migration Specialist
        if (employee.department === 'Engineering') adjustment += 20;
        if (employee.yearsExperience >= 5) adjustment += 10;
        break;
      case '4': // Marketing Automation Lead
        if (employee.department === 'Marketing' || employee.department === 'Sales') adjustment += 15;
        if (employee.currentRole.includes('Marketing')) adjustment += 10;
        break;
      case '5': // AI Ethics Committee Member
        // This should have low matches as requested
        adjustment -= 30;
        if (employee.yearsExperience < 7) adjustment -= 20;
        break;
      default:
        // Add some randomization based on employee ID for variety
        const employeeIdNum = parseInt(employee.id.replace('emp', ''));
        const opportunityIdNum = parseInt(opportunity.id);
        adjustment += (employeeIdNum * opportunityIdNum) % 15 - 7;
    }
    
    return adjustment;
  }

  filterAndSortForOpportunity(matches: EmployeeMatch[], opportunity: Opportunity): EmployeeMatch[] {
    // Filter out employees with very low scores and limit results
    let filteredMatches = matches.filter(match => match.matchScore > 20);
    
    // Sort by match score
    filteredMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    // Limit to top 6-8 matches per opportunity for variety
    const maxMatches = opportunity.id === '5' ? 3 : Math.min(8, Math.max(5, filteredMatches.length));
    
    return filteredMatches.slice(0, maxMatches);
  }

  getExcellentMatches(): EmployeeMatch[] {
    return this.employeeMatches.filter(match => match.matchScore >= 90);
  }

  getOtherMatches(): EmployeeMatch[] {
    return this.employeeMatches.filter(match => match.matchScore < 90);
  }

  closeEmployeePanel(): void {
    this.showEmployeePanel = false;
    // Clear selected employee match state
  }

  toggleInstructionPopup(): void {
    this.showInstructionPopup = !this.showInstructionPopup;
  }

  getMatchScoreColor(score: number): string {
    if (score >= 90) return 'primary';
    if (score >= 75) return 'accent';
    if (score >= 60) return 'warn';
    return 'basic';
  }

  getPerformanceColor(rating: string): string {
    switch (rating.toLowerCase()) {
      case 'exceeds expectations':
      case 'outstanding':
        return 'primary';
      case 'meets expectations':
      case 'good':
        return 'accent';
      case 'below expectations':
      case 'needs improvement':
        return 'warn';
      default:
        return 'basic';
    }
  }

  getAttritionRiskColor(risk: number): string {
    if (risk <= 20) return 'primary';
    if (risk <= 50) return 'accent';
    return 'warn';
  }

  getMatchScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
