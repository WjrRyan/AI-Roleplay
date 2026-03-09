/**
 * 静态性格特征 (0.0 到 1.0)
 */
export interface BigFive {
  /** 开放性 */
  openness: 'High' | 'Low';
  /** 尽责性 */
  conscientiousness: 'High' | 'Low';
  /** 外向性 */
  extraversion: 'High' | 'Low';
  /** 宜人性 */
  agreeableness: 'High' | 'Low';
  /** 神经质 */
  neuroticism: 'High' | 'Low';
}

/**
 * 动态游戏状态 (-1.0 到 1.0)
 */
export interface AcceptanceScores {
  /** 心态开放度 */
  openness: number;
  /** 认知清晰度 */
  clarity: number;
  /** 情感接受度 */
  acceptance: number;
  /** 向前承诺 */
  commitment: number;
}

/**
 * 角色画像
 */
export interface Persona {
  /** 可选ID，用于自定义角色 */
  id?: string;
  /** 是否为用户自定义角色 */
  isCustom?: boolean;
  /** 姓名 */
  name: string;
  /** 性别 */
  gender: 'Male' | 'Female';
  /** 头像URL */
  avatarUrl?: string;
  /** 语音名称 */
  voiceName?: string;
  
  // 基本信息
  /** 职位名称 */
  jobTitle: string;
  /** 工龄 */
  yearsOfExperience: number;
  /** 工作内容描述 */
  description: string;
  /** 业务痛点描述 */
  businessPainPoints: string;
  
  // 绩效历史
  /** 上次绩效 */
  lastPerformance: string;
  /** 本次绩效 */
  thisPerformance: string;
  
  // 性格引擎
  /** 大五人格 */
  bigFive: BigFive;
  
  // UI 辅助 (可选)
  /** 角色标签，如 "防御型" */
  personaTag?: string;
}

/**
 * 消息对象
 */
export interface Message {
  /** 消息ID */
  id: string;
  /** 角色 */
  role: 'user' | 'model' | 'system';
  /** 文本内容 */
  text: string;
  /** 时间戳 */
  timestamp: Date;
  
  // 游戏状态快照 (仅模型消息)
  /** 接受度分数 */
  scores?: AcceptanceScores;
  /** 评估结果，如 "火上浇油" */
  evaluation?: string;
  
  // 内联帮助
  /** 分析 */
  analysis?: string;
  /** 建议 */
  suggestion?: string;
  /** 是否正在分析 */
  isAnalyzing?: boolean;
}

/**
 * 聊天会话
 */
export interface ChatSession {
  /** 角色 */
  persona: Persona;
  /** 消息列表 */
  messages: Message[];
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime?: Date;
}

// --- 详细报告类型 ---

/**
 * 维度评估
 */
export interface DimensionEvaluation {
  /** 分数 1-5 */
  score: number;
  /** 分析 */
  analysis: string;
  /** 检测到的禁止行为列表 */
  forbiddenBehaviors: string[];
}

/**
 * 五步法评估
 */
export interface FiveStepEvaluation {
  /** 步骤名称 */
  stepName: string;
  /** 是否执行 */
  executed: boolean;
  /** 分析 */
  analysis: string;
  /** 推荐话术 (仅当未执行时存在) */
  recommendedScript?: string;
}

/**
 * 学习资源
 */
export interface LearningResource {
  /** 标题 */
  title: string;
  /** URL */
  url: string;
  /** 描述 */
  description: string;
}

/**
 * 反馈报告
 */
export interface FeedbackReport {
  // 摘要
  /** 总分 0-100 */
  score: number;
  /** 等级 */
  level: '新手级' | '发展中' | '胜任级' | '卓越级';
  /** 总结 */
  summary: string;
  /** 优势 */
  strengths: string[];
  /** 挑战 */
  challenges: string[];
  
  // 核心维度 (1-3)
  /** SBI反馈模型评估 */
  sbi: DimensionEvaluation;
  /** GROW模型评估 */
  grow: DimensionEvaluation;
  /** 倾听能力评估 */
  listening: DimensionEvaluation;
  
  // 特殊干预
  /** 是否检测到轮岗谬误 */
  rotationFallacyDetected: boolean;
  
  // 维度 5
  /** 五步法评估列表 */
  fiveSteps: FiveStepEvaluation[];
  
  // 资源
  /** 长期建议 */
  longTermAdvice: string;
  /** 学习资源列表 */
  learningResources: LearningResource[];
  
  // 兼容性字段 (可选)
  empathyScore?: number;
  clarityScore?: number;
  goalAchievementScore?: number;
  improvements?: string[];
  transcriptReview?: string;
}

/**
 * 用户反馈
 */
export interface UserFeedback {
  /** 综合体验 (NPS) */
  overallScore: number;
  /** 角色真实度 */
  realismScore: number;
  /** 报告有用性 */
  utilityScore: number;
  /** 开放反馈 */
  comment?: string;
}

/**
 * 保存的会话
 */
export interface SavedSession {
  /** 会话ID */
  id: string;
  /** 日期 */
  date: string;
  /** 角色 */
  persona: Persona;
  /** 消息列表 */
  messages: Message[];
  /** 报告 */
  report: FeedbackReport;
  /** NPS (旧版) */
  nps?: number;
  /** 用户反馈 (新版) */
  userFeedback?: UserFeedback;
}
