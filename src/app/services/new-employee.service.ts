import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { NewEmployee, NewEmployeeData } from '../models/new-employee.model';

@Injectable({
  providedIn: 'root'
})
export class NewEmployeeService {
  private dataUrl = 'assets/data/newEmployee.json';

  constructor(private http: HttpClient) {}

  getNewEmployees(): Observable<NewEmployee[]> {
    return this.http.get<NewEmployeeData>(this.dataUrl).pipe(
      map(data => this.enrichEmployeeData(data.talent_evaluation_data.employees))
    );
  }

  getNewEmployeeById(eid: string): Observable<NewEmployee | undefined> {
    return this.getNewEmployees().pipe(
      map(employees => employees.find(emp => emp.eid === eid))
    );
  }

  private enrichEmployeeData(employees: NewEmployee[]): NewEmployee[] {
    return employees.map(employee => ({
      ...employee,
      // Add missing fields with sensible defaults based on existing data
      email: this.generateEmail(employee.full_name),
      department: this.mapJobFamilyToDepartment(employee.job_family),
      skills: this.generateSkillsFromSpecialization(employee.specialization),
      interests: this.generateInterestsFromSpecialization(employee.specialization),
      careerGoals: this.generateCareerGoals(employee.job_level, employee.role_type),
      yearsExperience: this.calculateYearsExperience(employee.last_hire),
      timeInRole: this.calculateTimeInRole(employee.last_promoted_date),
      lengthOfService: this.calculateLengthOfService(employee.last_hire),
      promotionForecast: this.generatePromotionForecast(employee.dev_zone, employee.overall_rating),
      retentionRisk: this.mapAttritionRiskToPercentage(employee.attrition_risk)
    }));
  }

  private generateEmail(fullName: string): string {
    return fullName.toLowerCase().replace(' ', '.') + '@company.com';
  }

  private mapJobFamilyToDepartment(jobFamily: string): string {
    const mapping: { [key: string]: string } = {
      'Software Engineering': 'Engineering',
      'Data Engineering': 'Data Science',
      'Machine Learning': 'AI/ML',
      'DevOps': 'Platform Engineering'
    };
    return mapping[jobFamily] || 'Engineering';
  }

  private generateSkillsFromSpecialization(specialization: string): string[] {
    const skillsMap: { [key: string]: string[] } = {
      'Fullstack': ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS'],
      'AI': ['Python', 'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'Statistics'],
      'Back': ['Java', 'Spring Boot', 'Microservices', 'REST APIs', 'Database Design', 'Docker'],
      'Mobile': ['React Native', 'iOS', 'Android', 'Swift', 'Kotlin', 'Mobile UI/UX'],
      'Data Engineer': ['Python', 'SQL', 'Apache Spark', 'Kafka', 'ETL', 'Data Warehousing'],
      'Machine Learning': ['Python', 'Scikit-learn', 'Deep Learning', 'MLOps', 'Feature Engineering', 'Model Deployment'],
      'Other': ['Project Management', 'Agile', 'Leadership', 'Communication', 'Problem Solving']
    };
    return skillsMap[specialization] || ['Technical Skills', 'Problem Solving', 'Communication'];
  }

  private generateInterestsFromSpecialization(specialization: string): string[] {
    const interestsMap: { [key: string]: string[] } = {
      'Fullstack': ['Full Stack Development', 'Cloud Architecture', 'DevOps'],
      'AI': ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
      'Back': ['Backend Architecture', 'System Design', 'Performance Optimization'],
      'Mobile': ['Mobile Development', 'User Experience', 'Cross-platform Development'],
      'Data Engineer': ['Big Data', 'Data Pipeline Architecture', 'Real-time Analytics'],
      'Machine Learning': ['AI Research', 'Model Optimization', 'MLOps'],
      'Other': ['Leadership', 'Strategy', 'Innovation']
    };
    return interestsMap[specialization] || ['Technology', 'Innovation', 'Team Leadership'];
  }

  private generateCareerGoals(jobLevel: string, roleType: string): string[] {
    if (roleType === 'PL') {
      return ['Senior Leadership', 'Director', 'VP of Engineering'];
    }
    
    const levelGoalsMap: { [key: string]: string[] } = {
      'Sr. Associate': ['Principal Associate', 'Manager', 'Technical Lead'],
      'Principal Associate': ['Director', 'Senior Manager', 'Principal Engineer'],
      'Manager': ['Senior Manager', 'Director', 'VP'],
      'Sr. Manager': ['Director', 'VP', 'Chief Technology Officer'],
      'Director': ['VP', 'SVP', 'Chief Technology Officer']
    };
    
    return levelGoalsMap[jobLevel] || ['Career Advancement', 'Leadership Role', 'Technical Excellence'];
  }

  private calculateYearsExperience(lastHire: string): number {
    const hireDate = new Date(lastHire);
    const now = new Date();
    return Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365));
  }

  private calculateTimeInRole(lastPromotedDate: string): string {
    const promotionDate = new Date(lastPromotedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - promotionDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    }
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  }

  private calculateLengthOfService(lastHire: string): string {
    const hireDate = new Date(lastHire);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  }

  private generatePromotionForecast(devZone: string, overallRating: string): string {
    if (devZone === 'Invest Now' && (overallRating.includes('Exceptional') || overallRating.includes('Very Strong'))) {
      return 'YE 2025';
    } else if (devZone === 'Emerging Growth') {
      return 'MY 2026';
    }
    return 'YE 2026';
  }

  private mapAttritionRiskToPercentage(attritionRisk: string): string {
    const riskMap: { [key: string]: string } = {
      'Low': '15%',
      'Medium': '35%',
      'High': '65%'
    };
    return riskMap[attritionRisk] || '25%';
  }
}
