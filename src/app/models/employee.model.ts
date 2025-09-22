export interface Employee {
  id?: string;
  eid?: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  skills: string[];
  yearsExperience: number;
  performanceRating?: string;
  availability?: string;
  currentRole?: string;
  level?: string;
  jobFamily?: string;
  tdiZone?: string;
  timeInRole?: string;
  lengthOfService?: string;
  lastPromoDate?: string;
  promotionForecast?: string;
  riskOfLeaving?: string;
  reportsTo?: string;
  
  // Performance ratings for specific cycles
  ratingCycles?: {
    'MY24': '1-Exceptional' | '2-Very Strong' | '3-Strong' | '4-Inconsistent' | '5-Action Required' | '6-Too New' | 'No Rating Required';
    'YE24': '1-Exceptional' | '2-Very Strong' | '3-Strong' | '4-Inconsistent' | '5-Action Required' | '6-Too New' | 'No Rating Required';
    'MY25': '1-Exceptional' | '2-Very Strong' | '3-Strong' | '4-Inconsistent' | '5-Action Required' | '6-Too New' | 'No Rating Required';
  };
  
  // Legacy rating fields for backward compatibility
  myRating?: string; // e.g., "Strong"
  yeRating?: string; // e.g., "Above Strong"
  
  // Development Focus
  preparingForPromo: boolean;
  preparingForStretch: boolean;
  preparingForRotation: boolean;
  
  // Future Talent Profile
  futureTalentProfile: string; // e.g., "Outcome Based Leadership"
  differentiatedStrength: string; // e.g., "Talent Magnet"
  currentGapsOpportunities: string; // What is potentially blocking?
  
  // Development needs
  whatNeedsToBeDemonstrated: string; // Skills needed for next level
  howToInvest: string; // Description of support needed
  whatSupportNeeded: string; // What support can the group provide?
  
  // Career aspirations and investment
  associateCareerAspirations: string; // Career aspirations
  previousDifferentialInvestment: string; // Previous differential investment
  
  // Retention and rotation plans
  retentionPlanNeeded: boolean;
  retentionPlanJustification: string;
  rotationStechPlanNeeded: boolean;
  rotationStechPlanJustification: string;
  
  // Legacy fields for backward compatibility
  lastHireDate: string;
  lastPromotedDate: string;
  performanceTrend: string; // e.g., "Exceptional(YE24), Very Strong (MY24)"
  talentDevelopmentInventory: string[]; // e.g., ["Dev Zone", "Loss Impact"]
  attritionRisk: number; // Percentage (0-100)
  skillsetExperience: string[]; // e.g., ["Javascript", "C#", "AI"]
  competencyStrengths: string[]; // e.g., ["Javascript"]
  careerInterest: string[]; // e.g., ["Javascript"]
  confirmedInterestInRotation: boolean;
  leadershipSupportOfRotation: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  timeCommitment: string;
  duration: string;
  learningOutcomes: string[];
  mentorAvailable: boolean;
  remote: boolean;
  level: 'Associate' | 'Senior Associate' | 'Principal Associate' | 'Manager' | 'Sr. Manager' | 'Director' | 'Sr. Director' | 'Senior Director' | 'Principal' | 'Executive';
  applicationDeadline: string;
  startDate: string;
  
  // Assignment fields
  assignedEmployeeId?: string; // ID of assigned employee
  assignedEmployee?: Employee; // Full employee object for display
  assignmentDate?: string; // Date when assignment was made
  
  // Filter metadata fields
  leader: string; // Reports to leader (e.g., "Reports to 4 (CTO)", "Reports to 5")
  jobLevel: string; // Job level classification
  jobFamily: string; // Job family classification
  jobProfile: string; // Job profile classification
  plIc: 'PL' | 'IC'; // People Leader or Individual Contributor
  tenure: string; // Tenure requirements
  location: string; // Location requirements
  dayZero: boolean; // Day 0 indicator
  lossImpact: 'Low' | 'Medium' | 'High'; // Loss impact level
  attritionRisk: 'Low' | 'Medium' | 'High'; // Attrition risk level
  attritionResponse: string; // Attrition response strategy
  previousPerformanceRatings: string[]; // Required previous performance ratings
  rotationLevel: string; // Rotation level requirements
  rotationLength: string; // Length of rotation
  submittedBy: string; // Name of person who submitted the opportunity
}

export interface Match {
  opportunity: Opportunity;
  score: number;
  matchReasons: string[];
  skillGaps: string[];
}
