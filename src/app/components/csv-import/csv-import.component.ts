import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { CsvImportService } from '../../services/csv-import.service';
import { IndexedDbService } from '../../services/indexed-db.service';

@Component({
  selector: 'app-csv-import',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    MatChipsModule
  ],
  template: `
    <div class="csv-import-container">
      <mat-card class="import-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>upload_file</mat-icon>
            Import Employee Data
          </mat-card-title>
          <mat-card-subtitle>
            Upload a CSV file with employee information to populate the database
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- File Upload Area -->
          <div class="upload-area" 
               [class.dragover]="isDragOver"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               (click)="fileInput.click()">
            
            <input #fileInput 
                   type="file" 
                   accept=".csv"
                   (change)="onFileSelected($event)"
                   style="display: none;">
            
            <div class="upload-content">
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <h3>Drop CSV file here or click to browse</h3>
              <p>Supported format: .csv files only</p>
            </div>
          </div>

          <!-- Selected File Info -->
          <div *ngIf="selectedFile" class="file-info">
            <mat-icon>description</mat-icon>
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
            <button mat-icon-button (click)="clearFile()" color="warn">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <!-- Validation Results -->
          <div *ngIf="validationResult" class="validation-results">
            <div class="validation-status" [class.valid]="validationResult.valid" [class.invalid]="!validationResult.valid">
              <mat-icon>{{ validationResult.valid ? 'check_circle' : 'error' }}</mat-icon>
              <span>{{ validationResult.valid ? 'CSV structure is valid' : 'CSV validation failed' }}</span>
            </div>
            
            <div *ngIf="validationResult.errors.length > 0" class="validation-errors">
              <h4>Issues found:</h4>
              <ul>
                <li *ngFor="let error of validationResult.errors">{{ error }}</li>
              </ul>
            </div>

            <!-- Preview Table -->
            <div *ngIf="validationResult.preview.length > 0" class="preview-section">
              <h4>Data Preview (first 5 rows):</h4>
              <div class="preview-table-container">
                <table mat-table [dataSource]="validationResult.preview" class="preview-table">
                  <ng-container *ngFor="let column of getPreviewColumns()" [matColumnDef]="column">
                    <th mat-header-cell *matHeaderCellDef>{{ column }}</th>
                    <td mat-cell *matCellDef="let row">{{ row[column] | slice:0:50 }}{{ row[column]?.length > 50 ? '...' : '' }}</td>
                  </ng-container>
                  
                  <tr mat-header-row *matHeaderRowDef="getPreviewColumns()"></tr>
                  <tr mat-row *matRowDef="let row; columns: getPreviewColumns()"></tr>
                </table>
              </div>
            </div>
          </div>

          <!-- Progress Bar -->
          <mat-progress-bar *ngIf="isImporting" mode="indeterminate" class="import-progress"></mat-progress-bar>

          <!-- Import Results -->
          <div *ngIf="importResult" class="import-results">
            <div class="result-summary">
              <mat-icon [color]="importResult.success > 0 ? 'primary' : 'warn'">
                {{ importResult.success > 0 ? 'check_circle' : 'error' }}
              </mat-icon>
              <span>
                {{ importResult.success > 0 ? 
                   'Successfully imported ' + importResult.success + ' employees' : 
                   'Import failed' }}
              </span>
            </div>
            
            <div *ngIf="importResult.errors.length > 0" class="import-errors">
              <h4>Errors:</h4>
              <ul>
                <li *ngFor="let error of importResult.errors">{{ error }}</li>
              </ul>
            </div>
          </div>

          <!-- Database Stats -->
          <div *ngIf="employeeCount !== null" class="db-stats">
            <mat-chip-set>
              <mat-chip>
                <mat-icon matChipAvatar>people</mat-icon>
                {{ employeeCount }} employees in database
              </mat-chip>
            </mat-chip-set>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button 
                  color="primary" 
                  [disabled]="!selectedFile || !validationResult?.valid || isImporting"
                  (click)="importFile()">
            <mat-icon>upload</mat-icon>
            Import Data
          </button>
          
          <button mat-button 
                  [disabled]="isImporting"
                  (click)="validateFile()" 
                  *ngIf="selectedFile && !validationResult">
            <mat-icon>verified</mat-icon>
            Validate CSV
          </button>
          
          <button mat-button 
                  color="warn"
                  [disabled]="isImporting || employeeCount === 0"
                  (click)="clearDatabase()">
            <mat-icon>delete_sweep</mat-icon>
            Clear Database
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .csv-import-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .import-card {
      .mat-mdc-card-header {
        .mat-mdc-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.5rem;
        }
      }
    }

    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      margin: 16px 0;

      &:hover, &.dragover {
        border-color: #2196f3;
        background-color: #f5f5f5;
      }

      .upload-content {
        .upload-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: #666;
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          color: #333;
        }

        p {
          margin: 0;
          color: #666;
          font-size: 0.9rem;
        }
      }
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 4px;
      margin: 16px 0;

      .file-name {
        font-weight: 500;
        flex: 1;
      }

      .file-size {
        color: #666;
        font-size: 0.9rem;
      }
    }

    .validation-results {
      margin: 16px 0;
      
      .validation-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 16px;

        &.valid {
          background-color: #e8f5e8;
          color: #2e7d32;
        }

        &.invalid {
          background-color: #ffebee;
          color: #c62828;
        }
      }

      .validation-errors {
        background-color: #fff3e0;
        padding: 16px;
        border-radius: 4px;
        margin-bottom: 16px;

        h4 {
          margin: 0 0 8px 0;
          color: #ef6c00;
        }

        ul {
          margin: 0;
          padding-left: 20px;
        }
      }
    }

    .preview-section {
      margin-top: 16px;

      h4 {
        margin: 0 0 12px 0;
      }

      .preview-table-container {
        max-height: 300px;
        overflow: auto;
        border: 1px solid #ddd;
        border-radius: 4px;

        .preview-table {
          width: 100%;
          
          th, td {
            padding: 8px 12px;
            border-bottom: 1px solid #eee;
            font-size: 0.85rem;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          th {
            background-color: #f5f5f5;
            font-weight: 600;
            position: sticky;
            top: 0;
            z-index: 1;
          }
        }
      }
    }

    .import-progress {
      margin: 16px 0;
    }

    .import-results {
      margin: 16px 0;

      .result-summary {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
        margin-bottom: 12px;
      }

      .import-errors {
        background-color: #ffebee;
        padding: 16px;
        border-radius: 4px;

        h4 {
          margin: 0 0 8px 0;
          color: #c62828;
        }

        ul {
          margin: 0;
          padding-left: 20px;
        }
      }
    }

    .db-stats {
      margin-top: 16px;
      
      mat-chip-set {
        display: flex;
        justify-content: center;
      }
    }

    mat-card-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  `]
})
export class CsvImportComponent {
  selectedFile: File | null = null;
  isDragOver = false;
  isImporting = false;
  validationResult: any = null;
  importResult: any = null;
  employeeCount: number | null = null;

  constructor(
    private csvImportService: CsvImportService,
    private indexedDbService: IndexedDbService,
    private snackBar: MatSnackBar
  ) {
    this.loadEmployeeCount();
  }

  async loadEmployeeCount(): Promise<void> {
    try {
      this.employeeCount = await this.indexedDbService.getEmployeeCount();
    } catch (error) {
      console.error('Error loading employee count:', error);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelection(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFileSelection(file);
    }
  }

  private handleFileSelection(file: File): void {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.snackBar.open('Please select a CSV file', 'Close', { duration: 3000 });
      return;
    }

    this.selectedFile = file;
    this.validationResult = null;
    this.importResult = null;
    
    // Auto-validate the file
    this.validateFile();
  }

  async validateFile(): Promise<void> {
    if (!this.selectedFile) return;

    try {
      this.validationResult = await this.csvImportService.validateCSVStructure(this.selectedFile);
    } catch (error) {
      this.snackBar.open('Error validating CSV file', 'Close', { duration: 3000 });
      console.error('Validation error:', error);
    }
  }

  async importFile(): Promise<void> {
    if (!this.selectedFile || !this.validationResult?.valid) return;

    this.isImporting = true;
    this.importResult = null;

    try {
      this.importResult = await this.csvImportService.importFromFile(this.selectedFile);
      
      if (this.importResult.success > 0) {
        this.snackBar.open(
          `Successfully imported ${this.importResult.success} employees`, 
          'Close', 
          { duration: 5000 }
        );
        await this.loadEmployeeCount();
      } else {
        this.snackBar.open('Import failed. Check the errors below.', 'Close', { duration: 5000 });
      }
    } catch (error) {
      this.snackBar.open('Error importing CSV file', 'Close', { duration: 3000 });
      console.error('Import error:', error);
    } finally {
      this.isImporting = false;
    }
  }

  async clearDatabase(): Promise<void> {
    if (confirm('Are you sure you want to clear all employee data? This action cannot be undone.')) {
      try {
        await this.indexedDbService.clearAllEmployees();
        this.employeeCount = 0;
        this.snackBar.open('Database cleared successfully', 'Close', { duration: 3000 });
      } catch (error) {
        this.snackBar.open('Error clearing database', 'Close', { duration: 3000 });
        console.error('Clear database error:', error);
      }
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.validationResult = null;
    this.importResult = null;
  }

  getPreviewColumns(): string[] {
    if (!this.validationResult?.preview || this.validationResult.preview.length === 0) {
      return [];
    }
    return Object.keys(this.validationResult.preview[0]).slice(0, 6); // Show first 6 columns
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
