export interface ComprehensiveEmployee {
  // Basic Information (merged from both sources)
  id: string; // from employees.json
  eid?: string; // from CSV data
  name: string; // from employees.json
  fullName?: string; // from CSV data
  email: string; // from employees.json
  department: string; // from both
  currentRole: string; // from employees.json
  jobLevel?: 'Director' | 'Principal Associate' | 'Manager' | 'Sr. Manager' | 'Sr. Director' | 'Associate' | 'Senior Associate' | 'Principal' | 'Senior Principal' | 'Senior Director'; // expanded
  jobFamily?: 'Software Engineering' | 'Data Engineering' | 'Design' | 'Finance' | 'Sales' | 'Product' | 'HR' | 'Data Science' | 'Marketing' | 'Operations' | 'Engineering'; // expanded
  level?: string; // from employees.json
  jobTitle?: string; // from employees.json
  
  // Experience & Tenure
  yearsExperience: number; // from employees.json
  timeInRole?: string; // from employees.json
  lengthOfService?: string; // from employees.json
  lastHire?: Date; // from CSV
  lastHireDate?: string; // from employees.json
  lastPromotedDate?: Date | string; // from both
  lastPromoDate?: string; // from employees.json
  
  // Performance & Ratings
  performanceRating: string; // from employees.json
  recentYearEndPerformance?: '1-Exceptional' | '2-Very Strong' | '3-Strong' | '4-Inconsistent' | '5-Action Required' | '6-Too New';
  midYearPerformanceRating?: 'Above Strong' | 'Strong' | 'Below Strong' | 'No Rating Required';
  lastYearEndPerformanceRating?: '1-Exceptional' | '2-Very Strong' | '3-Strong' | '4-Inconsistent' | '5-Action Required' | '6-Too New';
  myRating?: string; // from employees.json
  yeRating?: string; // from employees.json
  performanceTrend?: string; // from employees.json
  ratingCycles?: { [key: string]: string }; // from employees.json
  
  // Development & Career
  devZone?: 'Invest Now' | 'Emerging Growth' | 'Support in Current Role' | 'Develop'; // expanded
  tdiZone?: string; // from employees.json
  careerClarity?: 'Neutral' | 'Somewhat Agree' | 'No data Available';
  promotionForecast?: string; // from employees.json
  preparingForPromo?: boolean; // from employees.json
  preparingForStretch?: boolean; // from employees.json
  preparingForRotation?: boolean; // from employees.json
  
  // Skills & Competencies
  skills: string[]; // from employees.json
  technicalSkillSet?: ('Fullstack' | 'AI' | 'Backend' | 'Frontend' | 'Mobile')[];
  skillsetExperience?: string[]; // from employees.json
  competencyStrengths?: string[]; // from employees.json
  
  // Interests & Goals
  interests: string[]; // from employees.json
  careerGoals: string[]; // from employees.json
  careerInterest?: string[]; // from employees.json
  associateCareerAspirations?: string; // from employees.json
  
  // Availability & Work
  availability: string; // from employees.json
  
  // Risk & Retention
  lossImpact?: 'Low' | 'Medium' | 'High';
  attritionRisk?: 'Low' | 'Medium' | 'High' | number; // from both (number from employees.json)
  retentionRisk?: string; // from employees.json
  attritionResponse?: 'Act aggressive to retain' | 'Enthusiasically look to retain' | 'Maybe hire back' | 
                     'Hire back for this role' | 'Hire back for this or other role' | 'Not attempt to retain' | 
                     'Time bound retention';
  retentionPlanNeeded?: boolean; // from employees.json
  retentionPlanJustification?: string; // from employees.json
  
  // Role & Leadership
  plOrIc?: 'IC' | 'PL';
  reportsTo3?: string;
  reportsTo4?: string[];
  reportsTo5?: string[];
  
  // Talent Development
  futureTalentProfile?: string; // from employees.json
  differentiatedStrength?: string; // from employees.json
  talentDevelopmentInventory?: string[]; // from employees.json
  
  // Development Areas
  currentGapsOpportunities?: string; // from employees.json
  whatNeedsToBeDemonstrated?: string; // from employees.json
  howToInvest?: string; // from employees.json
  whatSupportNeeded?: string; // from employees.json
  previousDifferentialInvestment?: string; // from employees.json
  lossImpactDescription?: string;
  investmentAssessment?: string;
  
  // Strengths (from CSV)
  strengthType?: ('Hard/Job Specific Skills' | 'People Leadership' | 'Communication' | 'Customer Focus' | 
                 'Influence' | 'Judgment' | 'Lives the Values' | 'Problem Solving' | 'Results Focus' | 'Teamwork')[];
  strengthValue?: string;
  
  // Development Gaps (from CSV)
  gapsType1?: 'It would close a gap that\'s currently getting in the associates way' | 
             'It\'s an area of strength that if improved upon could unlock even better results' | 
             'It will set the associate up for success at the next level' | 
             'It will set the associate up for success in a different future role';
  gapsRecommendation1?: string;
  gapsValue1?: string;
  gapsType2?: 'It would close a gap that\'s currently getting in the associates way' | 
             'It\'s an area of strength that if improved upon could unlock even better results' | 
             'It will set the associate up for success at the next level' | 
             'It will set the associate up for success in a different future role';
  gapsRecommendation2?: string;
  gapsValue2?: string;
  
  // Rotation & Stretch
  rotationStechPlanNeeded?: boolean; // from employees.json
  rotationStechPlanJustification?: string; // from employees.json
  confirmedInterestInRotation?: boolean; // from employees.json
  leadershipSupportOfRotation?: boolean; // from employees.json
  
  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CSVEmployeeData {
  [key: string]: string;
}

export const FIELD_MAPPINGS: { [csvField: string]: keyof ComprehensiveEmployee } = {
  'EID': 'eid',
  'Full Name': 'fullName',
  'Job Level': 'jobLevel',
  'Job Family': 'jobFamily',
  'Last Hire': 'lastHire',
  'Last Promoted Data': 'lastPromotedDate',
  'Years Experience': 'yearsExperience',
  'Time in Role': 'timeInRole',
  'Length of Service': 'lengthOfService',
  'Dev Zone': 'devZone',
  'Loss Impact': 'lossImpact',
  'Attrition Risk': 'attritionRisk',
  'Attrition Response': 'attritionResponse',
  'Career Clarity': 'careerClarity',
  'Recent Year End Performance': 'recentYearEndPerformance',
  'Mid Year Performance Rating': 'midYearPerformanceRating',
  'Last Year End Performance Rating': 'lastYearEndPerformanceRating',
  'PL or IC': 'plOrIc',
  'Reports to 3': 'reportsTo3',
  'Reports to 4': 'reportsTo4',
  'Reports to 5': 'reportsTo5',
  'Technical SkillSet': 'technicalSkillSet',
  'Loss Impact Description': 'lossImpactDescription',
  'Investment Assessment': 'investmentAssessment',
  'Strength Type': 'strengthType',
  'Strength Value': 'strengthValue',
  'Gaps Type 1': 'gapsType1',
  'Gaps Recommendation 1': 'gapsRecommendation1',
  'Gaps Value 1': 'gapsValue1',
  'Gaps Type 2': 'gapsType2',
  'Gaps Recommendation 2': 'gapsRecommendation2',
  'Gaps Value 2': 'gapsValue2',
  'Skillset Experience': 'skillsetExperience',
  'Career Interest': 'careerInterest',
  'Current Gaps Opportunities': 'currentGapsOpportunities'
};
