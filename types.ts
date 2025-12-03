
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
  name: string;
  gender: 'Male' | 'Female'; // Added gender
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

export interface FeedbackReport {
  score: number;
  empathyScore: number;
  clarityScore: number;
  goalAchievementScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  transcriptReview: string;
}

export interface NPSData {
  score: number;
  feedback: string;
}

export interface SavedSession {
  id: string;
  date: string;
  persona: Persona;
  messages: Message[];
  report: FeedbackReport;
}
