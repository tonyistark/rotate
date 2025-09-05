import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OpportunityService } from '../../services/opportunity.service';
import { EmployeeService } from '../../services/employee.service';
import { Opportunity, Employee } from '../../models/employee.model';

interface UploadResult {
  success: boolean;
  message: string;
  count?: number;
  errors?: string[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class AdminComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Upload states
  opportunitiesUploading = false;
  employeesUploading = false;
  
  // File references
  opportunitiesFile: File | null = null;
  employeesFile: File | null = null;
  
  // Upload results
  opportunitiesResult: UploadResult | null = null;
  employeesResult: UploadResult | null = null;
  
  // Statistics
  currentOpportunities = 0;
  currentEmployees = 0;

  // Help popup state
  showHelpPopup = false;

  constructor(
    private opportunityService: OpportunityService,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleHelpPopup(): void {
    this.showHelpPopup = !this.showHelpPopup;
  }

  private loadCurrentStats(): void {
    this.opportunityService.getOpportunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(opportunities => {
        this.currentOpportunities = opportunities.length;
      });

    this.employeeService.getEmployees()
      .pipe(takeUntil(this.destroy$))
      .subscribe(employees => {
        this.currentEmployees = employees.length;
      });
  }

  // Opportunities CSV Upload
  onOpportunitiesFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.opportunitiesFile = input.files[0];
      this.opportunitiesResult = null;
    }
  }

  async uploadOpportunities(): Promise<void> {
    if (!this.opportunitiesFile) {
      this.snackBar.open('Please select a CSV file first', 'Close', { duration: 3000 });
      return;
    }

    this.opportunitiesUploading = true;
    this.opportunitiesResult = null;

    try {
      const csvText = await this.readFileAsText(this.opportunitiesFile);
      const opportunities = this.parseOpportunitiesCSV(csvText);
      
      if (opportunities.length === 0) {
        throw new Error('No valid opportunities found in CSV file');
      }

      // Upload opportunities to service
      await this.opportunityService.uploadOpportunities(opportunities);
      
      this.opportunitiesResult = {
        success: true,
        message: `Successfully uploaded ${opportunities.length} opportunities`,
        count: opportunities.length
      };
      
      this.snackBar.open(this.opportunitiesResult.message, 'Close', { 
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      
      this.loadCurrentStats();
      
    } catch (error: any) {
      this.opportunitiesResult = {
        success: false,
        message: `Upload failed: ${error.message}`,
        errors: [error.message]
      };
      
      this.snackBar.open(this.opportunitiesResult.message, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.opportunitiesUploading = false;
    }
  }

  // Employees CSV Upload
  onEmployeesFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.employeesFile = input.files[0];
      this.employeesResult = null;
    }
  }

  async uploadEmployees(): Promise<void> {
    if (!this.employeesFile) {
      this.snackBar.open('Please select a CSV file first', 'Close', { duration: 3000 });
      return;
    }

    this.employeesUploading = true;
    this.employeesResult = null;

    try {
      const csvText = await this.readFileAsText(this.employeesFile);
      const employees = this.parseEmployeesCSV(csvText);
      
      if (employees.length === 0) {
        throw new Error('No valid employees found in CSV file');
      }

      // Upload employees to service
      await this.employeeService.uploadEmployees(employees);
      
      this.employeesResult = {
        success: true,
        message: `Successfully uploaded ${employees.length} employees`,
        count: employees.length
      };
      
      this.snackBar.open(this.employeesResult.message, 'Close', { 
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      
      this.loadCurrentStats();
      
    } catch (error: any) {
      this.employeesResult = {
        success: false,
        message: `Upload failed: ${error.message}`,
        errors: [error.message]
      };
      
      this.snackBar.open(this.employeesResult.message, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.employeesUploading = false;
    }
  }

  // CSV Parsing Methods
  private parseOpportunitiesCSV(csvText: string): Opportunity[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const opportunities: Opportunity[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      try {
        const opportunity: Opportunity = {
          id: values[headers.indexOf('id')] || `opp_${Date.now()}_${i}`,
          title: values[headers.indexOf('title')] || '',
          department: values[headers.indexOf('department')] || '',
          description: values[headers.indexOf('description')] || '',
          requiredSkills: this.parseSkillsArray(values[headers.indexOf('requiredskills')] || values[headers.indexOf('skills')] || ''),
          preferredSkills: [],
          timeCommitment: values[headers.indexOf('duration')] || '',
          duration: values[headers.indexOf('duration')] || '',
          learningOutcomes: [],
          mentorAvailable: false,
          remote: this.parseBoolean(values[headers.indexOf('remote')] || 'false'),
          level: this.parseLevel(values[headers.indexOf('experiencelevel')] || 'Mid'),
          applicationDeadline: values[headers.indexOf('deadline')] || '',
          startDate: values[headers.indexOf('startdate')] || '',
          leader: values[headers.indexOf('leader')] || '',
          jobLevel: values[headers.indexOf('joblevel')] || '',
          jobFamily: values[headers.indexOf('jobfamily')] || '',
          jobProfile: values[headers.indexOf('jobprofile')] || '',
          plIc: this.parsePlIc(values[headers.indexOf('plic')] || 'IC'),
          tenure: values[headers.indexOf('tenure')] || '',
          location: values[headers.indexOf('location')] || '',
          dayZero: this.parseBoolean(values[headers.indexOf('dayzero')] || 'false'),
          lossImpact: this.parseLossImpact(values[headers.indexOf('lossimpact')] || 'Medium'),
          attritionRisk: this.parseAttritionRisk(values[headers.indexOf('attritionrisk')] || 'Medium'),
          attritionResponse: values[headers.indexOf('attritionresponse')] || '',
          previousPerformanceRatings: this.parseSkillsArray(values[headers.indexOf('previousratings')] || ''),
          rotationLevel: values[headers.indexOf('rotationlevel')] || '',
          rotationLength: values[headers.indexOf('rotationlength')] || '',
          submittedBy: values[headers.indexOf('submittedby')] || ''
        };

        if (opportunity.title && opportunity.department) {
          opportunities.push(opportunity);
        }
      } catch (error) {
        console.warn(`Skipping invalid opportunity at line ${i + 1}:`, error);
      }
    }

    return opportunities;
  }

  private parseEmployeesCSV(csvText: string): Employee[] {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const employees: Employee[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      try {
        const employee: Employee = {
          id: values[headers.indexOf('id')] || `emp_${Date.now()}_${i}`,
          name: values[headers.indexOf('name')] || '',
          email: values[headers.indexOf('email')] || '',
          department: values[headers.indexOf('department')] || '',
          currentRole: values[headers.indexOf('role')] || values[headers.indexOf('currentrole')] || '',
          yearsExperience: parseInt(values[headers.indexOf('experience')] || values[headers.indexOf('yearsexperience')] || '0'),
          performanceRating: this.parsePerformanceRating(values[headers.indexOf('performancerating')] || 'Meets'),
          skills: this.parseSkillsArray(values[headers.indexOf('skills')] || ''),
          interests: this.parseSkillsArray(values[headers.indexOf('interests')] || ''),
          careerGoals: this.parseSkillsArray(values[headers.indexOf('careergoals')] || ''),
          availability: this.parseAvailability(values[headers.indexOf('availability')] || 'Full-time'),
          timeInRole: values[headers.indexOf('timeinrole')] || '',
          lengthOfService: values[headers.indexOf('lengthofservice')] || '',
          promotionForecast: values[headers.indexOf('promotionforecast')] || '',
          retentionRisk: values[headers.indexOf('retentionrisk')] || '',
          tdiZone: values[headers.indexOf('tdizone')] || '',
          myRating: values[headers.indexOf('myrating')] || '',
          yeRating: values[headers.indexOf('yerating')] || '',
          lastPromoDate: values[headers.indexOf('lastpromodate')] || '',
          preparingForPromo: this.parseBoolean(values[headers.indexOf('preparingforpromo')] || 'false'),
          preparingForStretch: this.parseBoolean(values[headers.indexOf('preparingforstretch')] || 'false'),
          preparingForRotation: this.parseBoolean(values[headers.indexOf('preparingforrotation')] || 'false'),
          futureTalentProfile: values[headers.indexOf('futuretalentprofile')] || '',
          differentiatedStrength: values[headers.indexOf('differentiatedstrength')] || '',
          currentGapsOpportunities: values[headers.indexOf('currentgapsopportunities')] || '',
          whatNeedsToBeDemonstrated: values[headers.indexOf('whatneedstobedemonstrated')] || '',
          howToInvest: values[headers.indexOf('howtoinvest')] || '',
          whatSupportNeeded: values[headers.indexOf('whatsupportneeded')] || '',
          associateCareerAspirations: values[headers.indexOf('associatecareeraspirations')] || '',
          previousDifferentialInvestment: values[headers.indexOf('previousdifferentialinvestment')] || '',
          retentionPlanNeeded: this.parseBoolean(values[headers.indexOf('retentionplanneeded')] || 'false'),
          retentionPlanJustification: values[headers.indexOf('retentionplanjustification')] || '',
          rotationStechPlanNeeded: this.parseBoolean(values[headers.indexOf('rotationstechplanneeded')] || 'false'),
          rotationStechPlanJustification: values[headers.indexOf('rotationstechplanjustification')] || '',
          lastHireDate: values[headers.indexOf('lasthiredate')] || '',
          lastPromotedDate: values[headers.indexOf('lastpromoteddate')] || '',
          performanceTrend: values[headers.indexOf('performancetrend')] || '',
          talentDevelopmentInventory: this.parseSkillsArray(values[headers.indexOf('talentdevelopmentinventory')] || ''),
          attritionRisk: parseInt(values[headers.indexOf('attritionrisk')] || '0'),
          skillsetExperience: this.parseSkillsArray(values[headers.indexOf('skillsetexperience')] || ''),
          competencyStrengths: this.parseSkillsArray(values[headers.indexOf('competencystrengths')] || ''),
          careerInterest: this.parseSkillsArray(values[headers.indexOf('careerinterest')] || ''),
          confirmedInterestInRotation: this.parseBoolean(values[headers.indexOf('confirmedinterestinrotation')] || 'false'),
          leadershipSupportOfRotation: this.parseBoolean(values[headers.indexOf('leadershipsupportofrotation')] || 'false')
        };

        if (employee.name && employee.email) {
          employees.push(employee);
        }
      } catch (error) {
        console.warn(`Skipping invalid employee at line ${i + 1}:`, error);
      }
    }

    return employees;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private parseSkillsArray(skillsString: string): string[] {
    if (!skillsString) return [];
    return skillsString.split(';').map(skill => skill.trim()).filter(skill => skill);
  }

  private parseBoolean(value: string): boolean {
    return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
  }

  private parseLevel(value: string): 'Entry' | 'Mid' | 'Senior' | 'Lead' {
    const normalized = value.toLowerCase();
    if (normalized.includes('entry') || normalized.includes('junior')) return 'Entry';
    if (normalized.includes('senior')) return 'Senior';
    if (normalized.includes('lead') || normalized.includes('principal')) return 'Lead';
    return 'Mid';
  }

  private parsePlIc(value: string): 'PL' | 'IC' {
    const normalized = value.toLowerCase();
    return normalized.includes('pl') || normalized.includes('people') || normalized.includes('manager') ? 'PL' : 'IC';
  }

  private parseLossImpact(value: string): 'Low' | 'Medium' | 'High' {
    const normalized = value.toLowerCase();
    if (normalized.includes('low')) return 'Low';
    if (normalized.includes('high')) return 'High';
    return 'Medium';
  }

  private parseAttritionRisk(value: string): 'Low' | 'Medium' | 'High' {
    const normalized = value.toLowerCase();
    if (normalized.includes('low')) return 'Low';
    if (normalized.includes('high')) return 'High';
    return 'Medium';
  }

  private parsePerformanceRating(value: string): 'Exceeds' | 'Meets' | 'Below' | 'Outstanding' {
    const normalized = value.toLowerCase();
    if (normalized.includes('exceed') || normalized.includes('above')) return 'Exceeds';
    if (normalized.includes('below') || normalized.includes('under')) return 'Below';
    if (normalized.includes('outstanding') || normalized.includes('exceptional')) return 'Outstanding';
    return 'Meets';
  }

  private parseAvailability(value: string): 'Full-time' | 'Part-time' | 'Project-based' {
    const normalized = value.toLowerCase();
    if (normalized.includes('part')) return 'Part-time';
    if (normalized.includes('project') || normalized.includes('contract')) return 'Project-based';
    return 'Full-time';
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // File input triggers
  triggerOpportunitiesFileInput(): void {
    const input = document.getElementById('opportunities-file-input') as HTMLInputElement;
    if (input) input.click();
  }

  triggerEmployeesFileInput(): void {
    const input = document.getElementById('employees-file-input') as HTMLInputElement;
    if (input) input.click();
  }

  // Clear file selections
  clearOpportunitiesFile(): void {
    this.opportunitiesFile = null;
    this.opportunitiesResult = null;
    const input = document.getElementById('opportunities-file-input') as HTMLInputElement;
    if (input) input.value = '';
  }

  clearEmployeesFile(): void {
    this.employeesFile = null;
    this.employeesResult = null;
    const input = document.getElementById('employees-file-input') as HTMLInputElement;
    if (input) input.value = '';
  }

  // Download sample CSV templates
  downloadOpportunitiesSample(): void {
    const sampleData = [
      ['id', 'title', 'department', 'location', 'description', 'requiredSkills', 'duration', 'startDate', 'priority', 'status', 'remote', 'experienceLevel', 'workType'],
      ['opp_001', 'Senior Software Engineer', 'Engineering', 'San Francisco, CA', 'Lead development of new features', 'JavaScript;TypeScript;Angular;Node.js', '6 months', '2024-01-15', 'High', 'Open', 'true', 'Senior', 'Full-time'],
      ['opp_002', 'Product Manager', 'Product', 'New York, NY', 'Manage product roadmap and strategy', 'Product Management;Agile;Scrum;Analytics', '12 months', '2024-02-01', 'Medium', 'Open', 'false', 'Mid', 'Full-time']
    ];
    
    this.downloadCSV(sampleData, 'opportunities-sample.csv');
  }

  downloadEmployeesSample(): void {
    const sampleData = [
      ['id', 'name', 'email', 'department', 'role', 'location', 'skills', 'experience', 'availability', 'performanceRating', 'remote', 'workType'],
      ['emp_001', 'John Smith', 'john.smith@company.com', 'Engineering', 'Software Engineer', 'San Francisco, CA', 'JavaScript;React;Node.js;Python', '5', 'Available', '4.2', 'true', 'Full-time'],
      ['emp_002', 'Sarah Johnson', 'sarah.johnson@company.com', 'Product', 'Product Manager', 'New York, NY', 'Product Management;Agile;Analytics;SQL', '3', 'Available', '4.5', 'false', 'Full-time']
    ];
    
    this.downloadCSV(sampleData, 'employees-sample.csv');
  }

  private downloadCSV(data: string[][], filename: string): void {
    const csvContent = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
