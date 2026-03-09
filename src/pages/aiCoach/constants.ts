import { BigFive, Persona } from './types';

/**
 * 应用步骤枚举
 * @enum {string}
 */
export enum AppStep {
  ASSISTANT = 'ASSISTANT',
  INTRO = 'INTRO',
  SETUP = 'SETUP',
  CHAT = 'CHAT',
  REPORT = 'REPORT',
  HISTORY = 'HISTORY'
}

// Personality Presets Mapping
export interface PersonalityPreset {
    id: string;
    name: string;
    description: string;
    bigFive: BigFive;
}

export const PERSONALITY_PRESETS: PersonalityPreset[] = [
    {
        id: 'volatile',
        name: '易怒对抗型',
        description: '情绪不稳，自我中心，视批评为攻击',
        bigFive: { openness: 'Low', conscientiousness: 'Low', extraversion: 'High', agreeableness: 'Low', neuroticism: 'High' }
    },
    {
        id: 'pragmatic',
        name: '务实直率型',
        description: '目标驱动，就事论事，不喜绕弯',
        bigFive: { openness: 'Low', conscientiousness: 'High', extraversion: 'High', agreeableness: 'Low', neuroticism: 'Low' }
    },
    {
        id: 'pleaser',
        name: '温和讨好型',
        description: '恐惧冲突，牺牲立场，寻求表面和谐',
        bigFive: { openness: 'Low', conscientiousness: 'High', extraversion: 'Low', agreeableness: 'High', neuroticism: 'High' }
    },
    {
        id: 'analytical',
        name: '理性分析型',
        description: '思维缜密，关注逻辑，情感反应钝',
        bigFive: { openness: 'High', conscientiousness: 'High', extraversion: 'Low', agreeableness: 'Low', neuroticism: 'Low' }
    },
    {
        id: 'avoidant',
        name: '消极回避型',
        description: '缺乏主动，不愿担责，对话中退缩',
        bigFive: { openness: 'Low', conscientiousness: 'Low', extraversion: 'Low', agreeableness: 'Low', neuroticism: 'High' }
    },
    {
        id: 'transactional',
        name: '精明交易型',
        description: '视评估为谈判，关注利益交换',
        bigFive: { openness: 'High', conscientiousness: 'High', extraversion: 'High', agreeableness: 'Low', neuroticism: 'Low' }
    },
    {
        id: 'dedicated',
        name: '平和奉献型',
        description: '情绪稳定，集体主义，真诚合作',
        bigFive: { openness: 'Low', conscientiousness: 'High', extraversion: 'Low', agreeableness: 'High', neuroticism: 'Low' }
    }
];

// System Templates
export const TEMPLATES: Persona[] = [
  {
    name: "小陈",
    gender: 'Male',
    jobTitle: "初级开发工程师",
    yearsOfExperience: 0.8,
    description: "负责前端基础组件开发和日常Bug修复。",
    businessPainPoints: "代码质量低，Bug 率远超团队平均水平。经常以'需求不清晰'为由推卸责任，甚至反问'为什么不一开始就定好'。",
    lastPerformance: "B",
    thisPerformance: "C",
    personaTag: "沉默型",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    voiceName: "Fenrir",
    bigFive: {
      openness: 'Low',
      conscientiousness: 'Low',
      extraversion: 'Low',
      agreeableness: 'High',
      neuroticism: 'High'
    }
  },
  {
    name: "莎莎",
    gender: 'Female',
    jobTitle: "资深销售",
    yearsOfExperience: 3,
    description: "负责华东区大客户维护和新客户拓展。",
    businessPainPoints: "连续两个季度未达成 KPI，且近期在客户面前情绪失控，遭到投诉。面对质问容易情绪崩溃。",
    lastPerformance: "B+",
    thisPerformance: "C",
    personaTag: "防御型",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    voiceName: "Kore",
    bigFive: {
      openness: 'Low',
      conscientiousness: 'High',
      extraversion: 'High',
      agreeableness: 'Low',
      neuroticism: 'High'
    }
  },
  {
    name: "老王",
    gender: 'Male',
    jobTitle: "项目经理",
    yearsOfExperience: 5,
    description: "负责核心业务系统的项目管理和交付。",
    businessPainPoints: "团队管理风格粗暴，近半年导致两名核心骨干离职。拒绝承认管理方式有问题，认为员工太脆弱。",
    lastPerformance: "A",
    thisPerformance: "C",
    personaTag: "争辩型",
    avatarUrl: "https://randomuser.me/api/portraits/men/85.jpg",
    voiceName: "Charon",
    bigFive: {
      openness: 'High',
      conscientiousness: 'High',
      extraversion: 'High',
      agreeableness: 'Low',
      neuroticism: 'Low'
    }
  }
];
