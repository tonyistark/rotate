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

  async updateEmployee(updatedEmployee: Employee): Promise<void> {
    try {
      // Convert to ComprehensiveEmployee format
      const comprehensiveEmployee: ComprehensiveEmployee = {
        id: updatedEmployee.id || '',
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        department: updatedEmployee.department,
        currentRole: updatedEmployee.currentRole || '',
        yearsExperience: updatedEmployee.yearsExperience,
        performanceRating: updatedEmployee.performanceRating || 'Meets',
        skills: updatedEmployee.skills,
        availability: updatedEmployee.availability || 'Full-time',
        interests: [], // Employee doesn't have interests
        careerGoals: [], // Employee doesn't have careerGoals
        level: updatedEmployee.level,
        jobTitle: updatedEmployee.jobTitle,
        timeInRole: updatedEmployee.timeInRole,
        lengthOfService: updatedEmployee.lengthOfService,
        promotionForecast: updatedEmployee.promotionForecast,
        tdiZone: updatedEmployee.tdiZone,
        ratingCycles: updatedEmployee.ratingCycles,
        myRating: updatedEmployee.myRating,
        yeRating: updatedEmployee.yeRating,
        lastPromoDate: updatedEmployee.lastPromoDate,
        preparingForPromo: updatedEmployee.preparingForPromo,
        preparingForStretch: updatedEmployee.preparingForStretch,
        preparingForRotation: updatedEmployee.preparingForRotation,
        futureTalentProfile: updatedEmployee.futureTalentProfile,
        differentiatedStrength: updatedEmployee.differentiatedStrength,
        currentGapsOpportunities: updatedEmployee.currentGapsOpportunities,
        whatNeedsToBeDemonstrated: updatedEmployee.whatNeedsToBeDemonstrated,
        howToInvest: updatedEmployee.howToInvest,
        whatSupportNeeded: updatedEmployee.whatSupportNeeded,
        associateCareerAspirations: updatedEmployee.associateCareerAspirations,
        previousDifferentialInvestment: updatedEmployee.previousDifferentialInvestment,
        retentionPlanNeeded: updatedEmployee.retentionPlanNeeded,
        retentionPlanJustification: updatedEmployee.retentionPlanJustification,
        rotationStechPlanNeeded: updatedEmployee.rotationStechPlanNeeded,
        rotationStechPlanJustification: updatedEmployee.rotationStechPlanJustification,
        lastHireDate: updatedEmployee.lastHireDate,
        lastPromotedDate: updatedEmployee.lastPromotedDate,
        performanceTrend: updatedEmployee.performanceTrend,
        talentDevelopmentInventory: updatedEmployee.talentDevelopmentInventory,
        attritionRisk: updatedEmployee.attritionRisk,
        skillsetExperience: updatedEmployee.skillsetExperience,
        competencyStrengths: updatedEmployee.competencyStrengths,
        careerInterest: updatedEmployee.careerInterest,
        confirmedInterestInRotation: updatedEmployee.confirmedInterestInRotation,
        leadershipSupportOfRotation: updatedEmployee.leadershipSupportOfRotation
      };

      // Update in IndexedDB
      await this.indexedDbService.updateEmployee(comprehensiveEmployee);
      
      // Update local cache
      const index = this.employees.findIndex(emp => emp.id === updatedEmployee.id);
      if (index !== -1) {
        this.employees[index] = updatedEmployee;
        this.employeesSubject.next([...this.employees]);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
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
        currentRole: emp.currentRole || '',
        yearsExperience: emp.yearsExperience,
        performanceRating: emp.performanceRating || 'Meets',
        skills: emp.skills,
        availability: emp.availability || 'Full-time',
        interests: [], // Employee doesn't have interests
        careerGoals: [], // Employee doesn't have careerGoals
        level: emp.level,
        jobTitle: emp.jobTitle,
        jobFamily: emp.jobFamily as any,
        timeInRole: emp.timeInRole,
        lengthOfService: emp.lengthOfService,
        promotionForecast: emp.promotionForecast,
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

  private normalizeJobFamily(family: string | undefined): string {
    if (!family) return '';
    
    const normalized = family.toLowerCase().trim();
    
    // Map common variations to standard values
    if (normalized.includes('software') || normalized.includes('engineering') && !normalized.includes('data')) {
      return 'Software Engineering';
    } else if (normalized.includes('data eng')) {
      return 'Data Engineering';
    } else if (normalized.includes('data sci')) {
      return 'Data Science';
    } else if (normalized.includes('design')) {
      return 'Design';
    } else if (normalized.includes('finance')) {
      return 'Finance';
    } else if (normalized.includes('sales')) {
      return 'Sales';
    } else if (normalized.includes('product')) {
      return 'Product';
    } else if (normalized.includes('hr') || normalized.includes('human')) {
      return 'HR';
    } else if (normalized.includes('market')) {
      return 'Marketing';
    } else if (normalized.includes('operation')) {
      return 'Operations';
    } else if (normalized === 'engineering') {
      return 'Engineering';
    }
    
    // Return original if no match found
    return family;
  }

  private normalizeRetentionRisk(risk: string | number | undefined): 'Low' | 'Medium' | 'High' {
    if (!risk) return 'Low';
    
    // Convert to string and normalize
    const normalized = risk.toString().toLowerCase().trim();
    
    // Handle direct Low/Medium/High values
    if (normalized === 'low') return 'Low';
    if (normalized === 'medium') return 'Medium';
    if (normalized === 'high') return 'High';
    
    // Handle percentage values
    const percentMatch = normalized.match(/(\d+)/);
    if (percentMatch) {
      const percent = parseInt(percentMatch[1]);
      if (percent <= 30) return 'Low';
      if (percent <= 60) return 'Medium';
      return 'High';
    }
    
    // Handle numeric values (assuming 0-100 scale)
    if (typeof risk === 'number') {
      if (risk <= 30) return 'Low';
      if (risk <= 60) return 'Medium';
      return 'High';
    }
    
    // Default to Low if unable to parse
    return 'Low';
  }

  private normalizeRatingCycle(rating: string): '1-Exceptional' | '2-Very Strong' | '3-Strong' | '4-Inconsistent' | '5-Action Required' | '6-Too New' | 'No Rating Required' {
    if (!rating) return 'No Rating Required';
    
    const normalized = rating.toLowerCase().trim();
    
    // Handle new format ratings
    if (normalized.includes('1-exceptional') || normalized === '1-exceptional') return '1-Exceptional';
    if (normalized.includes('2-very strong') || normalized === '2-very strong') return '2-Very Strong';
    if (normalized.includes('3-strong') || normalized === '3-strong') return '3-Strong';
    if (normalized.includes('4-inconsistent') || normalized === '4-inconsistent') return '4-Inconsistent';
    if (normalized.includes('5-action required') || normalized === '5-action required') return '5-Action Required';
    if (normalized.includes('6-too new') || normalized === '6-too new') return '6-Too New';
    if (normalized.includes('no rating') || normalized === 'no rating required') return 'No Rating Required';
    
    // Handle legacy format ratings
    if (normalized.includes('above') || normalized.includes('exceeds') || normalized.includes('outstanding') || normalized.includes('exceptional')) {
      return '1-Exceptional';
    } else if (normalized.includes('very strong') || normalized.includes('strong') && !normalized.includes('below')) {
      return '2-Very Strong';
    } else if (normalized.includes('below') || normalized.includes('needs') || normalized.includes('poor') || normalized.includes('inconsistent')) {
      return '4-Inconsistent';
    } else if (normalized.includes('action') || normalized.includes('improvement')) {
      return '5-Action Required';
    } else if (normalized.includes('new') || normalized.includes('too new')) {
      return '6-Too New';
    }
    
    return 'No Rating Required';
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
      jobFamily: this.normalizeJobFamily(emp.jobFamily),
      tdiZone: emp.tdiZone || 'Support in Current Role',
      timeInRole: emp.timeInRole || '0-1 years',
      lengthOfService: emp.lengthOfService || '0-1 years',
      lastPromoDate: emp.lastPromoDate || 'N/A',
      promotionForecast: emp.promotionForecast || 'N/A',
      riskOfLeaving: emp.riskOfLeaving || 'Low',
      reportsTo: emp.reportsTo || 'N/A',
      ratingCycles: emp.ratingCycles ? {
        'MY24': this.normalizeRatingCycle(emp.ratingCycles['MY24']),
        'YE24': this.normalizeRatingCycle(emp.ratingCycles['YE24']),
        'MY25': this.normalizeRatingCycle(emp.ratingCycles['MY25'])
      } : undefined,
      myRating: emp.myRating || emp.performanceRating || '',
      yeRating: emp.yeRating || emp.performanceRating || '',
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
