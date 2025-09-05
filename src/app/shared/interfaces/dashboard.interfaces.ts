// Dashboard-specific interfaces for better type safety

export interface SkillsAnalytics {
  totalUniqueSkills: number;
  totalOpportunities: number;
  totalEmployees: number;
  skillGaps: SkillGap[];
  criticalGaps: SkillGap[];
}

export interface SkillGap {
  skill: string;
  demand: number;
  supply: number;
  gap: number;
  status: 'shortage' | 'balanced' | 'surplus';
  severity: 'critical' | 'moderate' | 'low';
}

export interface EmployeeMatch {
  employee: Employee;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
}

export interface MatchTableData {
  opportunityId: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  opportunityTitle: string;
  opportunityDepartment: string;
  assignmentDate: string;
  duration: string;
  location: string;
  remote: boolean;
  matchingSkills: string[];
}

export interface MatchRecommendation {
  match: EmployeeMatch;
  confidence: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Poor';
  reason: string;
}

export interface DashboardState {
  isLoading: boolean;
  error: string | null;
  selectedOpportunity: Opportunity | null;
  selectedEmployee: Employee | null;
  showEmployeePanel: boolean;
  showInstructionPopup: boolean;
  selectedTabIndex: number;
}

// Re-export from models for convenience
import { Employee, Opportunity } from '../../models/employee.model';
export { Employee, Opportunity };
