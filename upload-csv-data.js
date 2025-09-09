// Script to programmatically upload CSV data to IndexedDB
// Run this in the browser console on the admin page

async function uploadCSVData() {
  console.log('Starting CSV data upload...');
  
  try {
    // Load opportunities CSV
    const opportunitiesResponse = await fetch('/assets/data/opportunities.csv');
    const opportunitiesCSV = await opportunitiesResponse.text();
    
    // Load employees CSV  
    const employeesResponse = await fetch('/assets/data/employees.csv');
    const employeesCSV = await employeesResponse.text();
    
    // Create File objects
    const opportunitiesFile = new File([opportunitiesCSV], 'opportunities.csv', { type: 'text/csv' });
    const employeesFile = new File([employeesCSV], 'employees.csv', { type: 'text/csv' });
    
    // Get the admin component
    const adminElement = document.querySelector('app-admin');
    const adminComponent = ng.getComponent(adminElement);
    
    if (!adminComponent) {
      console.error('Admin component not found');
      return;
    }
    
    // Upload opportunities
    console.log('Uploading opportunities...');
    adminComponent.opportunitiesFile = opportunitiesFile;
    await adminComponent.uploadOpportunities();
    
    // Upload employees
    console.log('Uploading employees...');
    adminComponent.employeesFile = employeesFile;
    await adminComponent.uploadEmployees();
    
    console.log('CSV data upload completed successfully!');
    
    // Refresh the page to load the new data
    window.location.reload();
    
  } catch (error) {
    console.error('Error uploading CSV data:', error);
  }
}

// Run the upload
uploadCSVData();
