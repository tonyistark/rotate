import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Match } from '../../models/employee.model';
import { BaseComponent } from '../../shared/base/base.component';
import { UtilsService } from '../../shared/services/utils.service';
import { FilterService } from '../../shared/services/filter.service';

@Component({
  selector: 'app-opportunity-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './opportunity-modal.component.html',
  styleUrls: ['./opportunity-modal.component.scss']
})
export class OpportunityModalComponent extends BaseComponent {
  constructor(
    public dialogRef: MatDialogRef<OpportunityModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { match: Match },
    private snackBar: MatSnackBar,
    utilsService: UtilsService,
    filterService: FilterService
  ) {
    super(utilsService, filterService);
  }

  get match(): Match {
    return this.data.match;
  }


  onClose(): void {
    this.dialogRef.close();
  }

}
