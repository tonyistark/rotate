export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  currentRole: string;
  yearsExperience: number;
  performanceRating: 'Exceeds' | 'Meets' | 'Below' | 'Outstanding';
  skills: string[];
  interests: string[];
  careerGoals: string[];
  availability: 'Full-time' | 'Part-time' | 'Project-based';
  
  // Enhanced profile fields
  profilePicture?: string;
  level?: string;
  jobTitle?: string;
  
  // TDI Profile fields
  timeInRole: string; // e.g., "2 years 5 months"
  lengthOfService: string; // e.g., "5 years 2 months"
  promotionForecast: string; // e.g., "YE 2026"
  retentionRisk: string; // e.g., "30%"
  tdiZone: string; // e.g., "Invest Now"
  
  // Performance ratings for specific cycles
  ratingCycles?: {
    'MY24': 'Below Strong' | 'Strong' | 'Above Strong';
    'YE24': 'Below Strong' | 'Strong' | 'Above Strong';
    'MY25': 'Below Strong' | 'Strong' | 'Above Strong';
  };
  
  // Legacy rating fields for backward compatibility
  myRating: string; // e.g., "Strong"
  yeRating: string; // e.g., "Above Strong"
  lastPromoDate: string; // e.g., "1/1/2023"
  
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
  level: 'Entry' | 'Mid' | 'Senior' | 'Lead';
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
