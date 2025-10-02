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
import { CsvImportService } from '../../services/csv-import.service';
import { CsvExportService } from '../../services/csv-export.service';
import { CsvParserService } from '../../services/csv-parser.service';
import { MatchesCsvService } from '../../services/matches-csv.service';
import { IndexedDbService } from '../../services/indexed-db.service';
import { MatchingService } from '../../services/matching.service';
import { ZipExportService } from '../../services/zip-export.service';
import { Opportunity, Employee } from '../../models/employee.model';
import { ComprehensiveEmployee } from '../../models/comprehensive-employee.model';

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
  matchesUploading = false;
  
  // Drag and drop states
  opportunitiesDragOver = false;
  employeesDragOver = false;
  // (Optional) matches drag-over could be added later
  
  // File references
  opportunitiesFile: File | null = null;
  employeesFile: File | null = null;
  matchesFile: File | null = null;
  
  // Upload results
  opportunitiesResult: UploadResult | null = null;
  employeesResult: UploadResult | null = null;
  matchesResult: UploadResult | null = null;
  
  // Statistics
  currentOpportunities = 0;
  currentEmployees = 0;

  // Help popup state
  showHelpPopup = false;

  constructor(
    private opportunityService: OpportunityService,
    private employeeService: EmployeeService,
    private csvImportService: CsvImportService,
    private csvParserService: CsvParserService,
    private indexedDbService: IndexedDbService,
    private csvExportService: CsvExportService,
    private matchesCsvService: MatchesCsvService,
    private matchingService: MatchingService,
    private zipExportService: ZipExportService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCurrentStats();
  }

  async exportAllZip(): Promise<void> {
    try {
      const blob = await this.zipExportService.createDataZip();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hrbp-data-export.zip';
      link.click();
      window.URL.revokeObjectURL(url);
      this.snackBar.open('Exported all data to ZIP', 'Close', { duration: 4000 });
    } catch (e) {
      this.snackBar.open('Failed to export ZIP', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleHelpPopup(): void {
    this.showHelpPopup = !this.showHelpPopup;
  }

  private async loadCurrentStats(): Promise<void> {
    this.opportunityService.getOpportunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe(opportunities => {
        this.currentOpportunities = opportunities.length;
      });

    // Load employee count from IndexedDB
    try {
      this.currentEmployees = await this.indexedDbService.getEmployeeCount();
    } catch (error) {
      console.error('Error loading employee count:', error);
      // Fallback to original service
      this.employeeService.getEmployees()
        .pipe(takeUntil(this.destroy$))
        .subscribe(employees => {
          this.currentEmployees = employees.length;
        });
    }
  }

  // Opportunities CSV Upload
  onOpportunitiesFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleOpportunitiesFile(file);
    }
  }

  private handleOpportunitiesFile(file: File): void {
    if (file && file.type === 'text/csv') {
      this.opportunitiesFile = file;
      this.opportunitiesResult = null;
    } else {
      this.snackBar.open('Please select a valid CSV file', 'Close', { duration: 3000 });
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

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.opportunitiesResult = {
        success: false,
        message: `Upload failed: ${errorMessage}`,
        errors: [errorMessage]
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
    const file = input.files?.[0];
    if (file) {
      this.handleEmployeesFile(file);
    }
  }

  private handleEmployeesFile(file: File): void {
    if (file && file.type === 'text/csv') {
      this.employeesFile = file;
      this.employeesResult = null;
    } else {
      this.snackBar.open('Please select a valid CSV file', 'Close', { duration: 3000 });
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
      // Use the comprehensive CSV import service
      const result = await this.csvImportService.importFromFile(this.employeesFile);
      
      if (result.success > 0) {
        this.employeesResult = {
          success: true,
          message: `Successfully imported ${result.success} employees to IndexedDB`,
          count: result.success
        };
        
        this.snackBar.open(this.employeesResult.message, 'Close', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      } else {
        throw new Error(result.errors.join(', ') || 'Import failed');
      }
      
      this.loadCurrentStats();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.employeesResult = {
        success: false,
        message: `Upload failed: ${errorMessage}`,
        errors: [errorMessage]
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
          requiredSkills: this.parseSkillsArray(values[headers.indexOf('requiredskills')] || ''),
          preferredSkills: this.parseSkillsArray(values[headers.indexOf('preferredskills')] || ''),
          timeCommitment: values[headers.indexOf('timecommitment')] || '',
          duration: values[headers.indexOf('duration')] || '',
          learningOutcomes: this.parseSkillsArray(values[headers.indexOf('learningoutcomes')] || ''),
          mentorAvailable: this.parseBoolean(values[headers.indexOf('mentoravailable')] || 'false'),
          remote: this.parseBoolean(values[headers.indexOf('remote')] || 'false'),
          level: this.parseLevel(values[headers.indexOf('level')] || values[headers.indexOf('experiencelevel')] || 'Associate'),
          applicationDeadline: values[headers.indexOf('applicationdeadline')] || '',
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
          previousPerformanceRatings: this.parseSkillsArray(values[headers.indexOf('previousperformanceratings')] || ''),
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
          id: values[headers.indexOf('eid')] || values[headers.indexOf('id')] || `emp_${Date.now()}_${i}`,
          name: values[headers.indexOf('full name')] || values[headers.indexOf('name')] || '',
          email: values[headers.indexOf('email')] || '',
          department: values[headers.indexOf('job family')] || values[headers.indexOf('department')] || '',
          jobTitle: values[headers.indexOf('job title')] || values[headers.indexOf('jobtitle')] || values[headers.indexOf('currentrole')] || '',
          currentRole: values[headers.indexOf('job level')] || values[headers.indexOf('role')] || values[headers.indexOf('currentrole')] || '',
          yearsExperience: parseInt(values[headers.indexOf('years experience')] || values[headers.indexOf('experience')] || values[headers.indexOf('yearsexperience')] || '0'),
          performanceRating: this.parsePerformanceRating(values[headers.indexOf('recent year end performance')] || values[headers.indexOf('performancerating')] || 'Meets'),
          skills: this.parseSkillsArray(values[headers.indexOf('technical skillset')] || values[headers.indexOf('skills')] || ''),
          availability: this.parseAvailability(values[headers.indexOf('availability')] || 'Full-time'),
          timeInRole: values[headers.indexOf('time in role')] || values[headers.indexOf('timeinrole')] || '',
          lengthOfService: values[headers.indexOf('length of service')] || values[headers.indexOf('lengthofservice')] || '',
          promotionForecast: values[headers.indexOf('promotion forecast')] || values[headers.indexOf('promotionforecast')] || '',
          tdiZone: values[headers.indexOf('dev zone')] || values[headers.indexOf('tdizone')] || '',
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
    return this.csvParserService.parseCSVLine(line);
  }

  private parseSkillsArray(skillsString: string): string[] {
    return this.csvParserService.parseSkillsArray(skillsString);
  }

  private parseBoolean(value: string): boolean {
    return this.csvParserService.parseBoolean(value);
  }

  private parseLevel(value: string): 'Associate' | 'Senior Associate' | 'Principal Associate' | 'Manager' | 'Sr. Manager' | 'Director' | 'Sr. Director' | 'Senior Director' | 'Principal' | 'Executive' {
    return this.csvParserService.parseLevel(value);
  }

  private parsePlIc(value: string): 'PL' | 'IC' {
    return this.csvParserService.parsePlIc(value);
  }

  private parseLossImpact(value: string): 'Low' | 'Medium' | 'High' {
    return this.csvParserService.parseLossImpact(value);
  }

  private parseAttritionRisk(value: string): 'Low' | 'Medium' | 'High' {
    return this.csvParserService.parseAttritionRisk(value);
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
    // Reset the file input
    const fileInput = document.getElementById('opportunities-file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  onOpportunitiesDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.opportunitiesDragOver = true;
  }

  onOpportunitiesDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.opportunitiesDragOver = false;
  }

  onOpportunitiesDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.opportunitiesDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.handleOpportunitiesFile(file);
    }
  }

  clearEmployeesFile(): void {
    this.employeesFile = null;
    this.employeesResult = null;
    const input = document.getElementById('employees-file-input') as HTMLInputElement;
    if (input) input.value = '';
  }

  // Drag and drop handlers for employees
  onEmployeesDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.employeesDragOver = true;
  }

  onEmployeesDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.employeesDragOver = false;
  }

  onEmployeesDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.employeesDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.handleEmployeesFile(file);
    }
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
      ['EID', 'Full Name', 'Job Level', 'Job Family', 'Last Hire', 'Last Promoted Data', 'Dev Zone', 'Loss Impact', 'Attrition Risk', 'Attrition Response', 'Career Clarity', 'Recent Year End Performance', 'Mid Year Performance Rating', 'Last Year End Performance Rating', 'PL or IC', 'Reports to 3', 'Reports to 4', 'Reports to 5', 'Technical SkillSet', 'Loss Impact Description', 'Investment Assessment', 'Strength Type', 'Strength Value', 'Gaps Type 1', 'Gaps Recommendation 1', 'Gaps Value 1', 'Gaps Type 2', 'Gaps Recommendation 2', 'Gaps Value 2'],
      ['EID0001', 'Jordan Blake', 'Director', 'Software Engineering', '9/15/08', '2/3/25', 'Invest Now', 'Medium', 'Low', 'Enthusiasically look to retain', 'Somewhat Agree', '2-Very Strong', 'Strong', '2-Very Strong', 'IC', 'Kamlesh', 'Chris Nicotra, Howard Dierking', 'Parvesh Kumar, Jana Ragupathy', 'Fullstack, Backend', 'Associate has been emerging as a strong engineer among, taking ownership of initiatives', 'They need continued coaching and mentorship to refine their skills', 'Hard/Job Specific Skills, Problem Solving', 'They have demonstrated strong leadership by mentoring the team', 'It will set the associate up for success at the next level', 'They need to improve their ability to articulate complex technical concepts', 'They need to improve their ability to articulate complex technical concepts to non-technical stakeholders', 'It would close a gap that is currently getting in the associates way', 'Focus on communication and presentation skills training', 'Develop better stakeholder management and technical communication abilities']
    ];
    
    this.downloadCSV(sampleData, 'comprehensive-employees-sample.csv');
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

  // Generic text download helper
  private downloadTextFile(filename: string, text: string, mime: string = 'text/csv'): void {
    const blob = new Blob([text], { type: mime });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Export handlers
  async exportEmployees(): Promise<void> {
    try {
      const csv = await this.csvExportService.exportEmployeesCSV();
      this.downloadTextFile('employees-export.csv', csv);
      this.snackBar.open('Employees exported', 'Close', { duration: 3000 });
    } catch (e) {
      this.snackBar.open('Failed to export employees', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
    }
  }

  async exportOpportunities(): Promise<void> {
    try {
      const csv = await this.csvExportService.exportOpportunitiesCSV();
      this.downloadTextFile('opportunities-export.csv', csv);
      this.snackBar.open('Opportunities exported', 'Close', { duration: 3000 });
    } catch (e) {
      this.snackBar.open('Failed to export opportunities', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
    }
  }

  async exportMatches(): Promise<void> {
    try {
      // Get the currently selected opportunity from HRBP dashboard if available
      const selectedOpportunityId = this.getCurrentSelectedOpportunityId();
      const csv = await this.csvExportService.exportMatchesCSV(selectedOpportunityId);
      
      const filename = selectedOpportunityId 
        ? `matches-export-${selectedOpportunityId}.csv`
        : 'matches-export-all.csv';
      
      this.downloadTextFile(filename, csv);
      
      const message = selectedOpportunityId 
        ? 'Current opportunity matches exported'
        : 'All matches exported';
      
      this.snackBar.open(message, 'Close', { duration: 3000 });
    } catch (e) {
      this.snackBar.open('Failed to export matches', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
    }
  }

  private getCurrentSelectedOpportunityId(): string | undefined {
    // Try to get the selected opportunity from localStorage or a shared service
    // This is a simple approach - in a real app you might use a state management solution
    try {
      const dashboardState = localStorage.getItem('hrbp-dashboard-state');
      if (dashboardState) {
        const state = JSON.parse(dashboardState);
        return state.selectedOpportunityId;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return undefined;
  }

  // Import Matches
  onMatchesFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleMatchesFile(file);
    }
  }

  private handleMatchesFile(file: File): void {
    if (file && file.type === 'text/csv') {
      this.matchesFile = file;
      this.matchesResult = null;
    } else {
      this.snackBar.open('Please select a valid CSV file', 'Close', { duration: 3000 });
    }
  }

  async uploadMatches(): Promise<void> {
    if (!this.matchesFile) {
      this.snackBar.open('Please select a CSV file first', 'Close', { duration: 3000 });
      return;
    }
    this.matchesUploading = true;
    this.matchesResult = null;
    try {
      const result = await this.matchesCsvService.importFromFile(this.matchesFile);
      if (result.success > 0) {
        this.matchesResult = {
          success: true,
          message: `Successfully imported ${result.success} matches`,
          count: result.success
        };
        this.snackBar.open(this.matchesResult.message, 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
      } else {
        throw new Error(result.errors.join(', ') || 'Import failed');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.matchesResult = {
        success: false,
        message: `Upload failed: ${errorMessage}`,
        errors: [errorMessage]
      };
      this.snackBar.open(this.matchesResult.message, 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    } finally {
      this.matchesUploading = false;
    }
  }

  triggerMatchesFileInput(): void {
    const input = document.getElementById('matches-file-input') as HTMLInputElement;
    if (input) input.click();
  }

  clearMatchesFile(): void {
    this.matchesFile = null;
    this.matchesResult = null;
    const input = document.getElementById('matches-file-input') as HTMLInputElement;
    if (input) input.value = '';
  }

  // Save current matches (compute and persist in IndexedDB)
  async saveCurrentMatches(): Promise<void> {
    try {
      // Load data
      const [employeesRaw, opportunities] = await Promise.all([
        this.indexedDbService.getAllEmployees(),
        this.indexedDbService.getAllOpportunities()
      ]);

      // Compute matches (top 5 per employee)
      const allMatches: Array<{ id: string; employeeId: string; opportunityId: string; score: number; matchReasons: string[]; skillGaps: string[] }> = [];
      for (const e of employeesRaw) {
        const emp = this.mapComprehensiveToEmployee(e);
        const matches = this.matchingService.calculateMatches(emp, opportunities);
        matches.slice(0, 5).forEach((m, idx) => {
          allMatches.push({
            id: `${emp.id || 'emp'}_${m.opportunity.id}_${idx}`,
            employeeId: emp.id || '',
            opportunityId: m.opportunity.id,
            score: m.score,
            matchReasons: m.matchReasons,
            skillGaps: m.skillGaps
          });
        });
      }

      // Persist
      await this.indexedDbService.clearAllMatches();
      await this.indexedDbService.saveMatches(allMatches);

      this.snackBar.open(`Saved ${allMatches.length} matches`, 'Close', { duration: 4000, panelClass: ['success-snackbar'] });
    } catch (err) {
      this.snackBar.open('Failed to save matches', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  // Map comprehensive employee record to Employee model for matching
  private mapComprehensiveToEmployee(e: ComprehensiveEmployee): Employee {
    return {
      id: e.eid || e.id || '',
      name: e.fullName || e.name || '',
      email: e.email || '',
      department: e.jobFamily || e.department || '',
      jobTitle: e.jobTitle || e.currentRole || '',
      currentRole: e.jobLevel || e.currentRole || '',
      yearsExperience: Number(e.yearsExperience || 0),
      performanceRating: (e.myRating || e.yeRating || e.performanceRating || 'Meets') as Employee['performanceRating'],
      skills: Array.isArray(e.technicalSkillSet)
        ? e.technicalSkillSet
        : (e.technicalSkillSet as any)
          ? String(e.technicalSkillSet).split(',').map((s: string) => s.trim())
          : (e.skills || []),
      availability: e.availability || 'Full-time',
      timeInRole: e.timeInRole || '',
      lengthOfService: e.lengthOfService || '',
      promotionForecast: e.promotionForecast || '',
      tdiZone: e.tdiZone || '',
      myRating: e.myRating || '',
      yeRating: e.yeRating || '',
      lastPromoDate: e.lastPromoDate || '',
      preparingForPromo: !!e.preparingForPromo,
      preparingForStretch: !!e.preparingForStretch,
      preparingForRotation: !!e.preparingForRotation,
      futureTalentProfile: e.futureTalentProfile || '',
      differentiatedStrength: e.differentiatedStrength || '',
      currentGapsOpportunities: e.currentGapsOpportunities || '',
      whatNeedsToBeDemonstrated: e.whatNeedsToBeDemonstrated || '',
      howToInvest: e.howToInvest || '',
      whatSupportNeeded: e.whatSupportNeeded || '',
      associateCareerAspirations: e.associateCareerAspirations || '',
      previousDifferentialInvestment: e.previousDifferentialInvestment || '',
      retentionPlanNeeded: !!e.retentionPlanNeeded,
      retentionPlanJustification: e.retentionPlanJustification || '',
      rotationStechPlanNeeded: !!e.rotationStechPlanNeeded,
      rotationStechPlanJustification: e.rotationStechPlanJustification || '',
      lastHireDate: typeof e.lastHireDate === 'string' ? e.lastHireDate : (e.lastHireDate ? (e.lastHireDate as any).toISOString() : ''),
      lastPromotedDate: typeof e.lastPromotedDate === 'string' ? e.lastPromotedDate : (e.lastPromotedDate ? (e.lastPromotedDate as Date).toISOString() : ''),
      performanceTrend: e.performanceTrend || '',
      talentDevelopmentInventory: Array.isArray(e.talentDevelopmentInventory) ? e.talentDevelopmentInventory : [],
      attritionRisk: Number(e.attritionRisk || 0),
      skillsetExperience: Array.isArray(e.skillsetExperience) ? e.skillsetExperience : [],
      competencyStrengths: Array.isArray(e.competencyStrengths) ? e.competencyStrengths : [],
      careerInterest: Array.isArray(e.careerInterest) ? e.careerInterest : [],
      confirmedInterestInRotation: !!e.confirmedInterestInRotation,
      leadershipSupportOfRotation: !!e.leadershipSupportOfRotation
    };
  }
}
