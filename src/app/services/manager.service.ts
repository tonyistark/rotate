import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Employee, Opportunity, Match } from '../models/employee.model';
import { OpportunityService } from './opportunity.service';
import { MatchingService } from './matching.service';

export interface EmployeeWithMatches {
  employee: Employee;
  topMatches: Match[];
  assignments: string[]; // Array of opportunity IDs assigned by manager
}

@Injectable({
  providedIn: 'root'
})
export class ManagerService {
  private teamEmployeesSubject = new BehaviorSubject<Employee[]>([]);
  private assignmentsSubject = new BehaviorSubject<Map<string, string[]>>(new Map());

  constructor(
    private http: HttpClient,
    private opportunityService: OpportunityService,
    private matchingService: MatchingService
  ) {
    this.loadEmployeeData();
  }

  private loadEmployeeData(): void {
    this.http.get<Employee[]>('/assets/data/employees.json')
      .pipe(
        tap(employees => employees)
      )
      .subscribe({
        next: (employees) => {
          this.teamEmployeesSubject.next(employees);
        },
        error: (error) => {
          console.error('Error loading employee data:', error);
          // Fallback to empty array if JSON fails to load
          this.teamEmployeesSubject.next([]);
        }
      });
  }

  getTeamWithMatches(): Observable<EmployeeWithMatches[]> {
    return combineLatest([
      this.teamEmployeesSubject.asObservable(),
      this.opportunityService.getOpportunities(),
      this.assignmentsSubject.asObservable()
    ]).pipe(
      map(([employees, opportunities, assignments]) => {
        return employees.map(employee => {
          const allMatches = this.matchingService.calculateMatches(employee, opportunities);
          const topMatches = allMatches.slice(0, 3); // Top 3 matches
          const employeeAssignments = assignments.get(employee.id) || [];

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
