import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { CsvExportService } from './csv-export.service';

@Injectable({ providedIn: 'root' })
export class ZipExportService {
  constructor(private csvExport: CsvExportService) {}

  async createDataZip(): Promise<Blob> {
    const zip = new JSZip();

    const [employeesCsv, opportunitiesCsv, matchesCsv] = await Promise.all([
      this.csvExport.exportEmployeesCSV(),
      this.csvExport.exportOpportunitiesCSV(),
      this.csvExport.exportMatchesCSV()
    ]);

    zip.file('employees.csv', employeesCsv);
    zip.file('opportunities.csv', opportunitiesCsv);
    zip.file('matches.csv', matchesCsv);

    return zip.generateAsync({ type: 'blob' });
  }
}
