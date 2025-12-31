
export enum AppStep {
  INTRO = 'INTRO',
  SETUP = 'SETUP',
  CHAT = 'CHAT',
  REPORT = 'REPORT',
  HISTORY = 'HISTORY'
}

// Static Personality Traits (0.0 to 1.0)
export interface BigFive {
  openness: 'High' | 'Low';
  conscientiousness: 'High' | 'Low';
  extraversion: 'High' | 'Low';
  agreeableness: 'High' | 'Low';
  neuroticism: 'High' | 'Low';
}

// Dynamic Game State (-1.0 to 1.0)
export interface AcceptanceScores {
  openness: number;      // 心态开放度
  clarity: number;       // 认知清晰度
  acceptance: number;    // 情感接受度
  commitment: number;    // 向前承诺
}

export interface Persona {
  id?: string;                // Optional ID for custom personas
  isCustom?: boolean;         // Flag to identify user-created personas
  name: string;
  gender: 'Male' | 'Female';
  avatarUrl?: string;
  voiceName?: string;
  
  // Basic Info
  jobTitle: string;           // 职位名称 (was role)
  yearsOfExperience: number;  // 工龄 (was tenure)
  description: string;        // 工作内容描述
  businessPainPoints: string; // 业务痛点描述 (was performanceIssue)
  
  // Performance History
  lastPerformance: string;    // 上次绩效
  thisPerformance: string;    // 本次绩效
  
  // Personality Engine
  bigFive: BigFive;
  
  // UI Helper (Optional)
  personaTag?: string;        // For badges like "防御型"
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  
  // Game State Snapshot (For Model Messages)
  scores?: AcceptanceScores;
  evaluation?: string; // e.g., "火上浇油", "拨云见日"
  
  // Inline Help
  analysis?: string;
  suggestion?: string;
  isAnalyzing?: boolean;
}

export interface ChatSession {
  persona: Persona;
  messages: Message[];
  startTime: Date;
  endTime?: Date;
}

// --- Detailed Report Types ---

export interface DimensionEvaluation {
  score: number; // 1-5
  analysis: string;
  forbiddenBehaviors: string[]; // List of specific forbidden behaviors detected
}

export interface FiveStepEvaluation {
  stepName: string;
  executed: boolean;
  analysis: string;
  recommendedScript?: string; // Only present if executed is false
}

export interface LearningResource {
  title: string;
  url: string;
  description: string;
}

export interface FeedbackReport {
  // Summary
  score: number; // 0-100 overall
  level: '新手级' | '发展中' | '胜任级' | '卓越级';
  summary: string;
  strengths: string[];
  challenges: string[];
  
  // Core Dimensions (1-3)
  sbi: DimensionEvaluation;
  grow: DimensionEvaluation;
  listening: DimensionEvaluation;
  
  // Special Intervention
  rotationFallacyDetected: boolean;
  
  // Dimension 5
  fiveSteps: FiveStepEvaluation[];
  
  // Resources
  longTermAdvice: string;
  learningResources: LearningResource[];
  
  // Legacy fields for compatibility (optional)
  empathyScore?: number;
  clarityScore?: number;
  goalAchievementScore?: number;
  improvements?: string[];
  transcriptReview?: string;
}

export interface UserFeedback {
  overallScore: number;   // 综合体验 (NPS)
  realismScore: number;   // 角色真实度
  utilityScore: number;   // 报告有用性
  comment?: string;       // 开放反馈
}

export interface SavedSession {
  id: string;
  date: string;
  persona: Persona;
  messages: Message[];
  report: FeedbackReport;
  nps?: number; // Legacy
  userFeedback?: UserFeedback; // New detailed feedback
}