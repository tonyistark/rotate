import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private currentEmployeeSubject = new BehaviorSubject<Employee | null>(null);

  getCurrentEmployee(): Observable<Employee | null> {
    return this.currentEmployeeSubject.asObservable();
  }

  setCurrentEmployee(employee: Employee): void {
    this.currentEmployeeSubject.next(employee);
  }

  clearCurrentEmployee(): void {
    this.currentEmployeeSubject.next(null);
  }
}
