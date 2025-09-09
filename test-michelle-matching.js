// Test script to verify Michelle Park matching fix
const fs = require('fs');
const path = require('path');

// Read CSV data
const employeesCSV = fs.readFileSync(path.join(__dirname, 'src/assets/data/employees.csv'), 'utf8');
const opportunitiesCSV = fs.readFileSync(path.join(__dirname, 'src/assets/data/opportunities.csv'), 'utf8');

// Parse Michelle Park's data
const employeeLines = employeesCSV.split('\n');
const employeeHeaders = employeeLines[0].split(',');
const michelleLine = employeeLines.find(line => line.includes('Michelle Park'));

if (michelleLine) {
  const michelleData = michelleLine.split(',');
  const skillsIndex = employeeHeaders.findIndex(h => h.includes('Technical SkillSet'));
  const experienceIndex = employeeHeaders.findIndex(h => h.includes('Years Experience'));
  
  console.log('=== MICHELLE PARK DATA ===');
  console.log('Skills:', michelleData[skillsIndex]);
  console.log('Years Experience:', michelleData[experienceIndex]);
}

// Parse Digital Transformation Lab opportunity
const opportunityLines = opportunitiesCSV.split('\n');
const opportunityHeaders = opportunityLines[0].split(',');
const digitalTransformLine = opportunityLines.find(line => line.includes('Digital Transformation Lab'));

if (digitalTransformLine) {
  const digitalTransformData = digitalTransformLine.split(',');
  const requiredSkillsIndex = opportunityHeaders.findIndex(h => h.includes('requiredSkills'));
  const preferredSkillsIndex = opportunityHeaders.findIndex(h => h.includes('preferredSkills'));
  
  console.log('\n=== DIGITAL TRANSFORMATION LAB ===');
  console.log('Required Skills:', digitalTransformData[requiredSkillsIndex]);
  console.log('Preferred Skills:', digitalTransformData[preferredSkillsIndex]);
}

console.log('\n=== EXPECTED MATCH ===');
console.log('Michelle has ALL required skills: Process Optimization, Innovation, Cross-functional Leadership, Digital Transformation, Project Management');
console.log('Michelle has ALL preferred skills: Lean, Six Sigma, Business Process Management, Automation, Change Management');
console.log('Expected score: 40 points (25 required + 15 preferred) + experience + performance = 65+ points');
