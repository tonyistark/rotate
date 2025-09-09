import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, from } from 'rxjs';
import { Employee } from '../models/employee.model';
import { ComprehensiveEmployee } from '../models/comprehensive-employee.model';
import { IndexedDbService } from './indexed-db.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private currentEmployeeSubject = new BehaviorSubject<Employee | null>(null);
  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  private employees: Employee[] = [];

  constructor(
    private http: HttpClient,
    private indexedDbService: IndexedDbService
  ) {
    this.loadEmployees();
  }

  private async loadEmployees(): Promise<void> {
    try {
      // Load only from IndexedDB - no JSON fallback
      const indexedEmployees = await this.indexedDbService.getAllEmployees();
      
      if (indexedEmployees.length > 0) {
        // Convert ComprehensiveEmployee to Employee format
        this.employees = this.convertToEmployeeFormat(indexedEmployees);
        this.employeesSubject.next(this.employees);
      } else {
        // No employees in IndexedDB - user needs to upload CSV data
        console.log('No employees found in IndexedDB. Please upload employee CSV data through the admin interface.');
        this.employees = [];
        this.employeesSubject.next([]);
      }
    } catch (error) {
      console.error('Error loading employees from IndexedDB:', error);
      this.employees = [];
      this.employeesSubject.next([]);
    }
  }

  getEmployees(): Observable<Employee[]> {
    // Return the BehaviorSubject observable for reactive updates
    return this.employeesSubject.asObservable();
  }

  private async getEmployeesFromIndexedDB(): Promise<Employee[]> {
    try {
      const indexedEmployees = await this.indexedDbService.getAllEmployees();
      
      if (indexedEmployees.length > 0) {
        const convertedEmployees = this.convertToEmployeeFormat(indexedEmployees);
        this.employees = convertedEmployees;
        return convertedEmployees;
      } else {
        console.log('No employees found in IndexedDB');
        return [];
      }
    } catch (error) {
      console.error('Error getting employees from IndexedDB:', error);
      return [];
    }
  }

  getCurrentEmployee(): Observable<Employee | null> {
    return this.currentEmployeeSubject.asObservable();
  }

  setCurrentEmployee(employee: Employee): void {
    this.currentEmployeeSubject.next(employee);
  }

  clearCurrentEmployee(): void {
    this.currentEmployeeSubject.next(null);
  }

  async refreshEmployees(): Promise<void> {
    await this.loadEmployees();
  }

  async uploadEmployees(employees: Employee[]): Promise<void> {
    try {
      // Add unique IDs to employees that don't have them
      const processedEmployees = employees.map(emp => ({
        ...emp,
        id: emp.id || this.generateId()
      }));

      // Convert to ComprehensiveEmployee format and save to IndexedDB
      const comprehensiveEmployees: ComprehensiveEmployee[] = processedEmployees.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        currentRole: emp.currentRole,
        yearsExperience: emp.yearsExperience,
        performanceRating: emp.performanceRating,
        skills: emp.skills,
        interests: emp.interests,
        careerGoals: emp.careerGoals,
        availability: emp.availability,
        level: emp.level,
        jobTitle: emp.jobTitle,
        timeInRole: emp.timeInRole,
        lengthOfService: emp.lengthOfService,
        promotionForecast: emp.promotionForecast,
        retentionRisk: emp.retentionRisk,
        tdiZone: emp.tdiZone,
        ratingCycles: emp.ratingCycles,
        myRating: emp.myRating,
        yeRating: emp.yeRating,
        lastPromoDate: emp.lastPromoDate,
        preparingForPromo: emp.preparingForPromo,
        preparingForStretch: emp.preparingForStretch,
        preparingForRotation: emp.preparingForRotation,
        futureTalentProfile: emp.futureTalentProfile,
        differentiatedStrength: emp.differentiatedStrength,
        currentGapsOpportunities: emp.currentGapsOpportunities,
        whatNeedsToBeDemonstrated: emp.whatNeedsToBeDemonstrated,
        howToInvest: emp.howToInvest,
        whatSupportNeeded: emp.whatSupportNeeded,
        associateCareerAspirations: emp.associateCareerAspirations,
        previousDifferentialInvestment: emp.previousDifferentialInvestment,
        retentionPlanNeeded: emp.retentionPlanNeeded,
        retentionPlanJustification: emp.retentionPlanJustification,
        rotationStechPlanNeeded: emp.rotationStechPlanNeeded,
        rotationStechPlanJustification: emp.rotationStechPlanJustification,
        lastHireDate: emp.lastHireDate,
        lastPromotedDate: emp.lastPromotedDate,
        performanceTrend: emp.performanceTrend,
        talentDevelopmentInventory: emp.talentDevelopmentInventory,
        attritionRisk: emp.attritionRisk,
        skillsetExperience: emp.skillsetExperience,
        competencyStrengths: emp.competencyStrengths,
        careerInterest: emp.careerInterest,
        confirmedInterestInRotation: emp.confirmedInterestInRotation,
        leadershipSupportOfRotation: emp.leadershipSupportOfRotation
      }));

      // Save to IndexedDB
      await this.indexedDbService.saveEmployees(comprehensiveEmployees);
      
      // Update local cache and notify subscribers
      this.employees = processedEmployees;
      this.employeesSubject.next(this.employees);
    } catch (error) {
      console.error('Error uploading employees:', error);
      throw error;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private normalizePerformanceRating(rating: string): 'Exceeds' | 'Meets' | 'Below' | 'Outstanding' {
    if (!rating) return 'Meets';
    
    const normalized = rating.toLowerCase().trim();
    
    // Map various rating formats to our standard format
    if (normalized.includes('outstanding') || normalized.includes('excellent') || normalized === '5' || normalized === 'a') {
      return 'Outstanding';
    } else if (normalized.includes('exceeds') || normalized.includes('above') || normalized.includes('strong') || normalized === '4' || normalized === 'b') {
      return 'Exceeds';
    } else if (normalized.includes('meets') || normalized.includes('good') || normalized.includes('satisfactory') || normalized === '3' || normalized === 'c') {
      return 'Meets';
    } else if (normalized.includes('below') || normalized.includes('needs') || normalized.includes('improvement') || normalized.includes('poor') || normalized === '2' || normalized === '1' || normalized === 'd' || normalized === 'f') {
      return 'Below';
    }
    
    // Default fallback
    return 'Meets';
  }

  private normalizeAvailability(availability: string): 'Full-time' | 'Part-time' | 'Project-based' {
    if (!availability) return 'Full-time';
    
    const normalized = availability.toLowerCase().trim();
    
    if (normalized.includes('part') || normalized.includes('partial')) {
      return 'Part-time';
    } else if (normalized.includes('project') || normalized.includes('contract')) {
      return 'Project-based';
    }
    
    return 'Full-time';
  }

  private normalizeRatingCycle(rating: string): 'Below Strong' | 'Strong' | 'Above Strong' {
    if (!rating) return 'Strong';
    
    const normalized = rating.toLowerCase().trim();
    
    if (normalized.includes('above') || normalized.includes('exceeds') || normalized.includes('outstanding')) {
      return 'Above Strong';
    } else if (normalized.includes('below') || normalized.includes('needs') || normalized.includes('poor')) {
      return 'Below Strong';
    }
    
    return 'Strong';
  }

  private convertToEmployeeFormat(comprehensiveEmployees: ComprehensiveEmployee[]): Employee[] {
    return comprehensiveEmployees.map(emp => ({
      id: emp.id || emp.eid || this.generateId(),
      name: emp.name || emp.fullName || '',
      email: emp.email || '',
      department: emp.department || '',
      currentRole: emp.currentRole || emp.jobLevel || '',
      yearsExperience: emp.yearsExperience || 0,
      performanceRating: this.normalizePerformanceRating(emp.performanceRating || emp.myRating || 'Strong'),
      skills: emp.skills || emp.technicalSkillSet || [],
      interests: emp.interests || emp.careerInterest || [],
      careerGoals: emp.careerGoals || [],
      availability: this.normalizeAvailability(emp.availability || 'Full-time'),
      level: emp.level || emp.jobLevel || '',
      jobTitle: emp.jobTitle || emp.currentRole || '',
      timeInRole: emp.timeInRole || '',
      lengthOfService: emp.lengthOfService || '',
      promotionForecast: emp.promotionForecast || '',
      retentionRisk: emp.retentionRisk || (emp.attritionRisk ? emp.attritionRisk.toString() : ''),
      tdiZone: emp.tdiZone || emp.devZone || '',
      ratingCycles: emp.ratingCycles ? {
        'MY24': this.normalizeRatingCycle(emp.ratingCycles['MY24']),
        'YE24': this.normalizeRatingCycle(emp.ratingCycles['YE24']),
        'MY25': this.normalizeRatingCycle(emp.ratingCycles['MY25'])
      } : undefined,
      myRating: emp.myRating || emp.performanceRating || '',
      yeRating: emp.yeRating || emp.performanceRating || '',
      lastPromoDate: emp.lastPromoDate || (emp.lastPromotedDate ? emp.lastPromotedDate.toString() : ''),
      preparingForPromo: emp.preparingForPromo || false,
      preparingForStretch: emp.preparingForStretch || false,
      preparingForRotation: emp.preparingForRotation || false,
      futureTalentProfile: emp.futureTalentProfile || '',
      differentiatedStrength: emp.differentiatedStrength || emp.strengthValue || '',
      currentGapsOpportunities: emp.currentGapsOpportunities || emp.gapsValue1 || '',
      whatNeedsToBeDemonstrated: emp.whatNeedsToBeDemonstrated || '',
      howToInvest: emp.howToInvest || emp.investmentAssessment || '',
      whatSupportNeeded: emp.whatSupportNeeded || '',
      associateCareerAspirations: emp.associateCareerAspirations || '',
      previousDifferentialInvestment: emp.previousDifferentialInvestment || '',
      retentionPlanNeeded: emp.retentionPlanNeeded || false,
      retentionPlanJustification: emp.retentionPlanJustification || '',
      rotationStechPlanNeeded: emp.rotationStechPlanNeeded || false,
      rotationStechPlanJustification: emp.rotationStechPlanJustification || '',
      lastHireDate: emp.lastHireDate || (emp.lastHire ? emp.lastHire.toString() : ''),
      lastPromotedDate: emp.lastPromotedDate ? emp.lastPromotedDate.toString() : '',
      performanceTrend: emp.performanceTrend || '',
      talentDevelopmentInventory: emp.talentDevelopmentInventory || [],
      attritionRisk: typeof emp.attritionRisk === 'number' ? emp.attritionRisk : 0,
      skillsetExperience: emp.skillsetExperience || emp.skills || [],
      competencyStrengths: emp.competencyStrengths || [],
      careerInterest: emp.careerInterest || emp.interests || [],
      confirmedInterestInRotation: emp.confirmedInterestInRotation || false,
      leadershipSupportOfRotation: emp.leadershipSupportOfRotation || false
    }));
  }
}
