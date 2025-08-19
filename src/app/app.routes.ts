import { Routes } from '@angular/router';
import { EmployeeFormComponent } from './components/employee-form/employee-form.component';
import { MatchResultsComponent } from './components/match-results/match-results.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/profile', pathMatch: 'full' },
  { path: 'profile', component: EmployeeFormComponent },
  { path: 'matches', component: MatchResultsComponent },
  { path: 'manager', component: ManagerDashboardComponent },
  { path: '**', redirectTo: '/profile' }
];
