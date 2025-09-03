export interface NewEmployee {
  eid: string;
  full_name: string;
  job_level: string;
  job_family: string;
  last_hire: string;
  last_promoted_date: string;
  dev_zone: string;
  loss_impact: string;
  attrition_risk: string;
  hiring_recommendation: string;
  reporting_structure: {
    reports_to_3: string;
    reports_to_4: string;
    reports_to_5: string;
  };
  career_clarity: string;
  recent_year_end_performance: string;
  mid_year_performance_rating: string;
  overall_rating: string;
  role_type: string;
  specialization: string;
  loss_impact_description: string;
  investment_assessment: string;
  strengths?: string[];
  development_areas: string[];
  competency_evaluations?: {
    [key: string]: {
      rating: string;
      strength_value: string;
      gaps_value_1: string;
      gaps_value_2: string;
    };
  };
  
  // Additional fields filled from existing employees.json for completeness
  email?: string;
  department?: string;
  skills?: string[];
  interests?: string[];
  careerGoals?: string[];
  yearsExperience?: number;
  timeInRole?: string;
  lengthOfService?: string;
  promotionForecast?: string;
  retentionRisk?: string;
}

export interface TalentEvaluationData {
  evaluation_framework: {
    competencies: string[];
    rating_scale: { [key: string]: string };
    dev_zones: string[];
    impact_levels: string[];
    attrition_risk: string[];
    hiring_decisions: string[];
  };
  employees: NewEmployee[];
}

export interface NewEmployeeData {
  talent_evaluation_data: TalentEvaluationData;
}
