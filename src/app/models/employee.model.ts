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
  
  // New fields for enhanced employee cards
  profilePicture?: string;
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
}

export interface Match {
  opportunity: Opportunity;
  score: number;
  matchReasons: string[];
  skillGaps: string[];
}
