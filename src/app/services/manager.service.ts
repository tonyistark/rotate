import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Employee, Opportunity, Match } from '../models/employee.model';
import { OpportunityService } from './opportunity.service';
import { MatchingService } from './matching.service';
import { EmployeeService } from './employee.service';

export interface EmployeeWithMatches {
  employee: Employee;
  topMatches: Match[];
  assignments: string[]; // Array of opportunity IDs assigned by manager
}

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  private assignmentsSubject = new BehaviorSubject<Map<string, string[]>>(new Map());

  constructor(
    private employeeService: EmployeeService,
    private opportunityService: OpportunityService,
    private matchingService: MatchingService
  ) {}


  getTeamWithMatches(): Observable<EmployeeWithMatches[]> {
    return combineLatest([
      this.employeeService.getEmployees(),
      this.opportunityService.getOpportunities(),
      this.assignmentsSubject.asObservable()
    ]).pipe(
      map(([employees, opportunities, assignments]) => {
        return employees.map(employee => {
          const allMatches = this.matchingService.calculateMatches(employee, opportunities);
          const topMatches = allMatches.slice(0, 3); // Top 3 matches
          const employeeAssignments = assignments.get(employee.id || '') || [];

          return {
            employee,
            topMatches,
            assignments: employeeAssignments
          };
        });
      })
    );
  }

  assignOpportunityToEmployee(employeeId: string, opportunityId: string): void {
    const currentAssignments = this.assignmentsSubject.value;
    const employeeAssignments = currentAssignments.get(employeeId) || [];
    
    if (!employeeAssignments.includes(opportunityId)) {
      employeeAssignments.push(opportunityId);
      currentAssignments.set(employeeId, employeeAssignments);
      this.assignmentsSubject.next(new Map(currentAssignments));
    }
  }

  removeAssignment(employeeId: string, opportunityId: string): void {
    const currentAssignments = this.assignmentsSubject.value;
    const employeeAssignments = currentAssignments.get(employeeId) || [];
    
    const updatedAssignments = employeeAssignments.filter(id => id !== opportunityId);
    currentAssignments.set(employeeId, updatedAssignments);
    this.assignmentsSubject.next(new Map(currentAssignments));
  }

  getAssignments(): Observable<Map<string, string[]>> {
    return this.assignmentsSubject.asObservable();
  }
}
