const fs = require('fs');
const path = require('path');

// Script to reload opportunities from CSV file
// This will help refresh the IndexedDB with updated CSV data

console.log('=== Opportunity Data Reload Script ===');
console.log('');
console.log('The opportunities are currently loaded from IndexedDB cache.');
console.log('To see the updated CSV changes (Sr. Director job level fixes), you need to:');
console.log('');
console.log('1. Open the Angular app in your browser');
console.log('2. Open browser DevTools (F12)');
console.log('3. Go to Application tab > Storage > IndexedDB');
console.log('4. Delete the "HRBPDatabase" database');
console.log('5. Refresh the page');
console.log('');
console.log('OR');
console.log('');
console.log('1. Use the admin interface to re-upload the CSV file');
console.log('2. Navigate to the upload section');
console.log('3. Select the updated opportunities.csv file');
console.log('4. Upload to refresh the database');
console.log('');

// Read the current CSV to show the Sr. Director opportunities
const csvPath = path.join(__dirname, 'src/assets/data/opportunities.csv');
try {
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n');
  
  console.log('Current Sr. Director opportunities in CSV:');
  console.log('=====================================');
  
  lines.forEach((line, index) => {
    if (line.includes('Sr. Director') && index > 0) {
      const parts = line.split(',');
      const id = parts[0];
      const title = parts[1]?.replace(/"/g, '');
      const department = parts[2]?.replace(/"/g, '');
      console.log(`${id}: ${title} (${department})`);
    }
  });
  
} catch (error) {
  console.error('Error reading CSV file:', error.message);
}

console.log('');
console.log('After clearing IndexedDB, the Sr. Director filter should work correctly.');
