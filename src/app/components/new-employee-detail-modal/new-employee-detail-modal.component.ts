import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { NewEmployee } from '../../models/new-employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';

@Component({
  selector: 'app-new-employee-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatTabsModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './new-employee-detail-modal.component.html',
  styleUrls: ['./new-employee-detail-modal.component.scss']
})
export class NewEmployeeDetailModalComponent extends BaseComponent {
  isEditMode = false;
  editableEmployee: NewEmployee;
  originalEmployee: NewEmployee;

  constructor(
    public dialogRef: MatDialogRef<NewEmployeeDetailModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { employee: NewEmployee },
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
    this.originalEmployee = { ...data.employee };
    this.editableEmployee = { ...data.employee };
  }

  get employee(): NewEmployee {
    return this.isEditMode ? this.editableEmployee : this.originalEmployee;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.editableEmployee = { ...this.originalEmployee };
    }
  }

  saveChanges(): void {
    Object.assign(this.originalEmployee, this.editableEmployee);
    this.isEditMode = false;
    this.dialogRef.close({ action: 'save', employee: this.editableEmployee });
  }

  cancelEdit(): void {
    this.editableEmployee = { ...this.originalEmployee };
    this.isEditMode = false;
  }

  getDevZoneClass(zone: string): string {
    return this.utilsService.getTdiZoneClass(zone);
  }

  getRatingClass(rating: string): string {
    return this.utilsService.getRatingClass(rating);
  }

  override getAttritionRiskClass(risk: string | number): string {
    if (typeof risk === 'number') {
      return super.getAttritionRiskClass(risk);
    }
    const riskMap: { [key: string]: string } = {
      'Low': 'low-risk',
      'Medium': 'medium-risk',
      'High': 'high-risk'
    };
    return riskMap[risk] || '';
  }

  getLossImpactClass(impact: string): string {
    const impactMap: { [key: string]: string } = {
      'Low': 'low-impact',
      'Medium': 'medium-impact',
      'High': 'high-impact'
    };
    return impactMap[impact] || '';
  }

  getHiringRecommendationClass(recommendation: string): string {
    if (recommendation.includes('aggressive') || recommendation.includes('Hire back for this role')) {
      return 'high-recommendation';
    } else if (recommendation.includes('Maybe')) {
      return 'medium-recommendation';
    } else if (recommendation.includes('Not')) {
      return 'low-recommendation';
    }
    return 'medium-recommendation';
  }

  getCareerClarityClass(clarity: string): string {
    if (clarity === 'Agree') {
      return 'high-clarity';
    } else if (clarity === 'Somewhat Agree') {
      return 'medium-clarity';
    } else if (clarity === 'Neutral') {
      return 'neutral-clarity';
    }
    return 'no-data';
  }

  calculateTenure(): string {
    if (!this.employee.last_hire) return 'N/A';
    
    const hireDate = new Date(this.employee.last_hire);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hireDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    return `${diffYears} years, ${diffMonths} months`;
  }

  calculateTimeInCurrentRole(): string {
    if (!this.employee.last_promoted_date) return 'N/A';
    
    const promotionDate = new Date(this.employee.last_promoted_date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - promotionDate.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    
    if (diffYears > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''}, ${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    }
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  }
}
