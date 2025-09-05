import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Employee } from '../models/employee.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private currentEmployeeSubject = new BehaviorSubject<Employee | null>(null);
  private employees: Employee[] = [];

  constructor(private http: HttpClient) {
    this.loadEmployees();
  }

  private loadEmployees(): void {
    this.http.get<Employee[]>('assets/data/employees.json').subscribe(
      employees => {
        this.employees = employees;
      }
    );
  }

  getEmployees(): Observable<Employee[]> {
    if (this.employees.length > 0) {
      return of(this.employees);
    }
    return this.http.get<Employee[]>('assets/data/employees.json');
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

  uploadEmployees(employees: Employee[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Add unique IDs to employees that don't have them
        const processedEmployees = employees.map(emp => ({
          ...emp,
          id: emp.id || this.generateId()
        }));

        // Replace existing employees with uploaded ones
        this.employees = processedEmployees;
        
        console.log(`Successfully uploaded ${employees.length} employees`);
        resolve();
      } catch (error) {
        console.error('Error uploading employees:', error);
        reject(error);
      }
    });
  }

  private generateId(): string {
    return 'emp_' + Math.random().toString(36).substr(2, 9);
  }
}
