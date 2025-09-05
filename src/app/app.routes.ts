import { Routes } from '@angular/router';
import { EmployeeFormComponent } from './components/employee-form/employee-form.component';
import { MatchResultsComponent } from './components/match-results/match-results.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { OpportunitiesListComponent } from './components/opportunities-list/opportunities-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { HrbpDashboardComponent } from './components/hrbp-dashboard/hrbp-dashboard.component';
import { NewEmployeeListComponent } from './components/new-employee-list/new-employee-list.component';
import { AdminComponent } from './components/admin/admin.component';

export const routes: Routes = [
  { path: '', redirectTo: '/hrbp-dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'hrbp-dashboard', component: HrbpDashboardComponent },
  { path: 'new-employees', component: NewEmployeeListComponent },
  { path: 'manager', component: ManagerDashboardComponent },
  { path: 'opportunities', component: OpportunitiesListComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '/hrbp-dashboard' }
];
