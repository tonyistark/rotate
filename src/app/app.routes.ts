import { Routes } from '@angular/router';
import { EmployeeFormComponent } from './components/employee-form/employee-form.component';
import { MatchResultsComponent } from './components/match-results/match-results.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { CreateOpportunityComponent } from './components/create-opportunity/create-opportunity.component';
import { OpportunitiesListComponent } from './components/opportunities-list/opportunities-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'manager', component: ManagerDashboardComponent },
  { path: 'create-opportunity', component: CreateOpportunityComponent },
  { path: 'edit-opportunity/:id', component: CreateOpportunityComponent },
  { path: 'opportunities', component: OpportunitiesListComponent },
  { path: '**', redirectTo: '/dashboard' }
];
