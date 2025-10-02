import { Injectable } from '@angular/core';
import { ComprehensiveEmployee } from '../models/comprehensive-employee.model';
import { Opportunity } from '../models/employee.model';

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbName = 'EmployeeDB';
  private dbVersion = 3;
  private employeeStoreName = 'employees';
  private opportunityStoreName = 'opportunities';
  private matchesStoreName = 'matches';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create employees object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.employeeStoreName)) {
          const store = db.createObjectStore(this.employeeStoreName, { keyPath: 'eid' });
          
          // Create indexes for common search fields
          store.createIndex('fullName', 'fullName', { unique: false });
          store.createIndex('jobLevel', 'jobLevel', { unique: false });
          store.createIndex('jobFamily', 'jobFamily', { unique: false });
          store.createIndex('technicalSkillSet', 'technicalSkillSet', { unique: false, multiEntry: true });
          store.createIndex('attritionRisk', 'attritionRisk', { unique: false });
          store.createIndex('lossImpact', 'lossImpact', { unique: false });
        }
        
        // Create opportunities object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.opportunityStoreName)) {
          const oppStore = db.createObjectStore(this.opportunityStoreName, { keyPath: 'id' });
          
          // Create indexes for common search fields
          oppStore.createIndex('title', 'title', { unique: false });
          oppStore.createIndex('department', 'department', { unique: false });
          oppStore.createIndex('level', 'level', { unique: false });
          oppStore.createIndex('requiredSkills', 'requiredSkills', { unique: false, multiEntry: true });
          oppStore.createIndex('preferredSkills', 'preferredSkills', { unique: false, multiEntry: true });
        }

        // Create matches object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.matchesStoreName)) {
          const matchStore = db.createObjectStore(this.matchesStoreName, { keyPath: 'id' });
          // Useful indexes
          matchStore.createIndex('employeeId', 'employeeId', { unique: false });
          matchStore.createIndex('opportunityId', 'opportunityId', { unique: false });
          matchStore.createIndex('score', 'score', { unique: false });
        }
      };
    });
  }

  async saveEmployee(employee: ComprehensiveEmployee): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.employeeStoreName], 'readwrite');
      const store = transaction.objectStore(this.employeeStoreName);
      
      // Add timestamps
      const employeeWithTimestamp = {
        ...employee,
        updatedAt: new Date(),
        createdAt: employee.createdAt || new Date()
      };

      const request = store.put(employeeWithTimestamp);

      request.onerror = () => {
        console.error('Error saving employee:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async updateEmployee(employee: ComprehensiveEmployee): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.employeeStoreName], 'readwrite');
      const store = transaction.objectStore(this.employeeStoreName);
      
      // Use the employee's id or eid as the key
      const key = employee.eid || employee.id;
      if (!key) {
        reject(new Error('Employee must have an id or eid'));
        return;
      }

      // Add updated timestamp, preserve created timestamp
      const employeeWithTimestamp = {
        ...employee,
        eid: key, // Ensure eid is set for IndexedDB key
        updatedAt: new Date(),
        createdAt: employee.createdAt || new Date()
      };

      const request = store.put(employeeWithTimestamp);

      request.onerror = () => {
        console.error('Error updating employee:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async saveEmployees(employees: ComprehensiveEmployee[]): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.employeeStoreName], 'readwrite');
      const store = transaction.objectStore(this.employeeStoreName);
      
      let completed = 0;
      const total = employees.length;

      if (total === 0) {
        resolve();
        return;
      }

      employees.forEach(employee => {
        const employeeWithTimestamp = {
          ...employee,
          updatedAt: new Date(),
          createdAt: employee.createdAt || new Date()
        };

        const request = store.put(employeeWithTimestamp);

        request.onerror = () => {
          console.error('Error saving employee:', employee.eid, request.error);
        };

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      });

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  async getEmployee(eid: string): Promise<ComprehensiveEmployee | null> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.employeeStoreName], 'readonly');
      const store = transaction.objectStore(this.employeeStoreName);
      const request = store.get(eid);

      request.onerror = () => {
        console.error('Error getting employee:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async getAllEmployees(): Promise<ComprehensiveEmployee[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.employeeStoreName], 'readonly');
      const store = transaction.objectStore(this.employeeStoreName);
      const request = store.getAll();

      request.onerror = () => {
        console.error('Error getting all employees:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  async searchEmployees(searchTerm: string): Promise<ComprehensiveEmployee[]> {
    const allEmployees = await this.getAllEmployees();
    
    if (!searchTerm.trim()) {
      return allEmployees;
    }

    const term = searchTerm.toLowerCase();
    
    return allEmployees.filter(employee => 
      (employee.fullName && employee.fullName.toLowerCase().includes(term)) ||
      (employee.name && employee.name.toLowerCase().includes(term)) ||
      (employee.eid && employee.eid.toLowerCase().includes(term)) ||
      (employee.id && employee.id.toLowerCase().includes(term)) ||
      (employee.jobLevel && employee.jobLevel.toLowerCase().includes(term)) ||
      (employee.jobFamily && employee.jobFamily.toLowerCase().includes(term)) ||
      (employee.technicalSkillSet && employee.technicalSkillSet.some(skill => skill.toLowerCase().includes(term))) ||
      (employee.skills && employee.skills.some(skill => skill.toLowerCase().includes(term)))
    );
  }

  async deleteEmployee(eid: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.employeeStoreName], 'readwrite');
      const store = transaction.objectStore(this.employeeStoreName);
      const request = store.delete(eid);

      request.onerror = () => {
        console.error('Error deleting employee:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async clearAllEmployees(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.employeeStoreName], 'readwrite');
      const store = transaction.objectStore(this.employeeStoreName);
      const request = store.clear();

      request.onerror = () => {
        console.error('Error clearing employees:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getEmployeeCount(): Promise<number> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.employeeStoreName], 'readonly');
      const store = transaction.objectStore(this.employeeStoreName);
      const request = store.count();

      request.onerror = () => {
        console.error('Error counting employees:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  // Opportunity methods
  async saveOpportunity(opportunity: Opportunity): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.opportunityStoreName], 'readwrite');
      const store = transaction.objectStore(this.opportunityStoreName);
      
      // Add timestamps
      const opportunityWithTimestamp = {
        ...opportunity,
        updatedAt: new Date(),
        createdAt: (opportunity as any).createdAt || new Date()
      };

      const request = store.put(opportunityWithTimestamp);

      request.onerror = () => {
        console.error('Error saving opportunity:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async updateOpportunity(opportunity: Opportunity): Promise<void> {
    // Use saveOpportunity as it already handles both add and update with put()
    return this.saveOpportunity(opportunity);
  }

  async saveOpportunities(opportunities: Opportunity[]): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.opportunityStoreName], 'readwrite');
      const store = transaction.objectStore(this.opportunityStoreName);
      
      let completed = 0;
      const total = opportunities.length;

      if (total === 0) {
        resolve();
        return;
      }

      opportunities.forEach(opportunity => {
        const opportunityWithTimestamp = {
          ...opportunity,
          updatedAt: new Date(),
          createdAt: (opportunity as any).createdAt || new Date()
        };

        const request = store.put(opportunityWithTimestamp);

        request.onerror = () => {
          console.error('Error saving opportunity:', opportunity.id, request.error);
        };

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      });

      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }

  async getOpportunity(id: string): Promise<Opportunity | null> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.opportunityStoreName], 'readonly');
      const store = transaction.objectStore(this.opportunityStoreName);
      const request = store.get(id);

      request.onerror = () => {
        console.error('Error getting opportunity:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async getAllOpportunities(): Promise<Opportunity[]> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.opportunityStoreName], 'readonly');
      const store = transaction.objectStore(this.opportunityStoreName);
      const request = store.getAll();

      request.onerror = () => {
        console.error('Error getting all opportunities:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  async deleteOpportunity(id: string): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.opportunityStoreName], 'readwrite');
      const store = transaction.objectStore(this.opportunityStoreName);
      const request = store.delete(id);

      request.onerror = () => {
        console.error('Error deleting opportunity:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async clearAllOpportunities(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.opportunityStoreName], 'readwrite');
      const store = transaction.objectStore(this.opportunityStoreName);
      const request = store.clear();

      request.onerror = () => {
        console.error('Error clearing opportunities:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getOpportunityCount(): Promise<number> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.opportunityStoreName], 'readonly');
      const store = transaction.objectStore(this.opportunityStoreName);
      const request = store.count();

      request.onerror = () => {
        console.error('Error counting opportunities:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  // Matches methods
  async saveMatches(matches: Array<{ id: string; employeeId: string; opportunityId: string; score: number; matchReasons: string[]; skillGaps: string[] }>): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.matchesStoreName], 'readwrite');
      const store = transaction.objectStore(this.matchesStoreName);

      let completed = 0;
      const total = matches.length;

      if (total === 0) {
        resolve();
        return;
      }

      matches.forEach(m => {
        const withTimestamps = { ...m, updatedAt: new Date(), createdAt: (m as any).createdAt || new Date() } as any;
        const request = store.put(withTimestamps);
        request.onerror = () => {
          console.error('Error saving match:', m.id, request.error);
        };
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      });

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAllMatches(): Promise<Array<{ id: string; employeeId: string; opportunityId: string; score: number; matchReasons: string[]; skillGaps: string[] }>> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.matchesStoreName], 'readonly');
      const store = transaction.objectStore(this.matchesStoreName);
      const request = store.getAll();

      request.onerror = () => {
        console.error('Error getting all matches:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        resolve(request.result || []);
      };
    });
  }

  async clearAllMatches(): Promise<void> {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.matchesStoreName], 'readwrite');
      const store = transaction.objectStore(this.matchesStoreName);
      const request = store.clear();
      request.onerror = () => {
        console.error('Error clearing matches:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        resolve();
      };
    });
  }
}
