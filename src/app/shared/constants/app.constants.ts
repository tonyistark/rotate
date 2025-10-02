// Shared constants for the application
export const APP_CONSTANTS = {
  // Performance ratings
  PERFORMANCE_RATINGS: {
    OUTSTANDING: 'Outstanding',
    EXCEEDS: 'Exceeds',
    MEETS: 'Meets',
    BELOW: 'Below',
    STRONG: 'Strong',
    ABOVE_STRONG: 'Above Strong'
  },

  // Rating cycle options (for MY24, YE24, MY25)
  RATING_CYCLE_OPTIONS: [
    '1-Exceptional',
    '2-Very Strong', 
    '3-Strong',
    '4-Inconsistent',
    '5-Action Required',
    '6-Too New',
    'No Rating Required'
  ],

  // Job level options
  JOB_LEVELS: [
    'Associate',
    'Sr. Associate',
    'Principal Associate',
    'Manager',
    'Sr. Manager',
    'Director',
    'Sr. Director',
    'Vice President',
    'Managing VP',
    'Sr. VP',
    'Exec. VP'
  ],

  // Performance rating scores
  PERFORMANCE_SCORES: {
    'Outstanding': 5,
    'Exceeds': 4,
    'Meets': 3,
    'Below': 2,
    'Strong': 4,
    'Above Strong': 5,
    '1-Exceptional': 6,
    '2-Very Strong': 5,
    '3-Strong': 4,
    '4-Inconsistent': 3,
    '5-Action Required': 2,
    '6-Too New': 1,
    'No Rating Required': 0
  },

  // Color mappings
  COLORS: {
    PRIMARY: 'primary',
    ACCENT: 'accent',
    WARN: 'warn',
    BASIC: 'basic'
  },

  // Match score thresholds
  MATCH_SCORES: {
    EXCELLENT: 90,
    VERY_GOOD: 80,
    GOOD: 70,
    FAIR: 60,
    MINIMUM: 20
  },

  // Scoring algorithm weights (as percentages)
  SCORING_WEIGHTS: {
    SKILLS_MATCH: 40,
    PERFORMANCE: 20,
    CAREER_INTEREST: 20,
    AVAILABILITY: 20,
    REQUIRED_SKILLS: 25,
    PREFERRED_SKILLS: 15,
    INTEREST_ALIGNMENT: 20,
    PERFORMANCE_RATING: 15,
    EXPERIENCE_LEVEL: 10,
    CAREER_GOALS: 10,
    DEPARTMENT_DIVERSITY: 5
  },

  // Experience match scores
  EXPERIENCE_MATCH_SCORES: {
    PERFECT: 10,
    CLOSE: 7,
    ACCEPTABLE: 4,
    POOR: 0,
    THRESHOLD_GOOD: 5
  },

  // Experience level requirements (in years)
  LEVEL_REQUIREMENTS: {
    'Associate': { min: 0, max: 2 },
    'Senior Associate': { min: 2, max: 5 },
    'Principal Associate': { min: 3, max: 6 },
    'Manager': { min: 3, max: 8 },
    'Sr. Manager': { min: 5, max: 12 },
    'Director': { min: 6, max: 18 },
    'Sr. Director': { min: 4, max: 20 },
    'Senior Director': { min: 6, max: 20 },
    'Principal': { min: 4, max: 15 },
    'Executive': { min: 10, max: 25 }
  },

  // Performance multipliers for matching
  PERFORMANCE_MULTIPLIERS: {
    'Outstanding': 1.0,
    'Exceeds': 0.8,
    'Meets': 0.6,
    'Below': 0.3
  },

  // Experience match tolerance (years)
  EXPERIENCE_TOLERANCE: {
    CLOSE_MIN: 1,
    CLOSE_MAX: 2,
    ACCEPTABLE_MIN: 2,
    ACCEPTABLE_MAX: 4
  },

  // Maximum match score
  MAX_MATCH_SCORE: 100,

  // Match result limits
  MATCH_LIMITS: {
    DEFAULT_MAX: 8,
    DEFAULT_MIN: 5,
    SPECIAL_CASE_MAX: 3
  },

  // Attrition risk thresholds
  ATTRITION_RISK: {
    LOW: 20,
    MEDIUM: 50
  },

  // Filter options
  FILTER_ALL: 'All',

  // Dialog configurations
  DIALOG_CONFIG: {
    EMPLOYEE_DETAIL: {
      width: '90vw',
      maxWidth: '1200px'
    },
    OPPORTUNITY_MODAL: {
      width: '800px',
      maxWidth: '90vw'
    }
  },

  // Snackbar durations
  SNACKBAR_DURATION: {
    SHORT: 3000,
    MEDIUM: 4000,
    LONG: 5000
  },

  // CSV export settings
  CSV_EXPORT: {
    DATE_FORMAT: 'YYYY-MM-DD',
    FIELD_SEPARATOR: '; ',
    QUOTE_CHAR: '"'
  },

  // Animation durations
  ANIMATIONS: {
    SLIDE_DURATION: 300
  }
};

export const FILTER_LABELS = {
  leader: 'Leader',
  jobLevel: 'Level',
  jobFamily: 'Family',
  jobProfile: 'Profile',
  plIc: 'P&L/IC',
  tenure: 'Tenure',
  location: 'Location',
  rotationLevel: 'Rotation Level',
  rotationLength: 'Rotation Length'
};
