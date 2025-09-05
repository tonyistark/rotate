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

  // Performance rating scores
  PERFORMANCE_SCORES: {
    'Outstanding': 5,
    'Exceeds': 4,
    'Meets': 3,
    'Below': 2,
    'Strong': 4,
    'Above Strong': 5
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

  // Scoring algorithm weights
  SCORING_WEIGHTS: {
    SKILLS_MATCH: 40,
    PERFORMANCE: 20,
    CAREER_INTEREST: 20,
    AVAILABILITY: 20
  },

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
