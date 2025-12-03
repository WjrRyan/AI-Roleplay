
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCcw, Home, ThumbsUp, Activity, Award, Quote, ChevronRight, Share2 } from 'lucide-react';
import { Message, Persona, FeedbackReport } from '../types';
import { generateSessionReport } from '../services/geminiService';
import { saveSession } from '../services/storage';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface Props {
  messages: Message[];
  persona: Persona;
  onRestart: () => void;
  existingReport?: FeedbackReport; 
}

// Helper to calculate Grade
const getGrade = (score: number) => {
  if (score >= 90) return { label: 'S', color: 'text-yellow-500', bg: 'bg-yellow-50', text: '完美' };
  if (score >= 80) return { label: 'A', color: 'text-green-500', bg: 'bg-green-50', text: '优秀' };
  if (score >= 70) return { label: 'B', color: 'text-blue-500', bg: 'bg-blue-50', text: '合格' };
  if (score >= 60) return { label: 'C', color: 'text-orange-500', bg: 'bg-orange-50', text: '待提升' };
  return { label: 'D', color: 'text-red-500', bg: 'bg-red-50', text: '不合格' };
};

export const StepReport: React.FC<Props> = ({ messages, persona, onRestart, existingReport }) => {
  const [report, setReport] = useState<FeedbackReport | null>(existingReport || null);
  const [loading, setLoading] = useState(!existingReport);
  const [npsSubmitted, setNpsSubmitted] = useState(false);
  const [npsScore, setNpsScore] = useState<number>(0);

  useEffect(() => {
    if (existingReport) return;

    const fetchReport = async () => {
      // Filter out system messages for cleaner context
      const conversationHistory = messages.filter(m => m.role !== 'system');
      const data = await generateSessionReport(conversationHistory, persona);
      
      saveSession({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        persona: persona,
        messages: messages,
        report: data
      });

      setReport(data);
      setLoading(false);
    };
    fetchReport();
  }, [messages, persona, existingReport]);

  const handleNPS = () => {
    setNpsSubmitted(true);
    // In a real app, send this to backend
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fadeIn bg-slate-50 px-6 text-center">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
           <Activity className="absolute inset-0 m-auto text-blue-600 w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">AI 教练正在复盘...</h2>
        <div className="space-y-2 text-sm text-slate-500 max-w-xs mx-auto">
           <p className="animate-pulse delay-75">• 分析沟通同理心</p>
           <p className="animate-pulse delay-150">• 评估目标达成率</p>
           <p className="animate-pulse delay-300">• 生成改进建议</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const grade = getGrade(report.score);
  
  const radarData = [
    { subject: '同理心', A: report.empathyScore, fullMark: 100 },
    { subject: '清晰度', A: report.clarityScore, fullMark: 100 },
    { subject: '目标达成', A: report.goalAchievementScore, fullMark: 100 },
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 animate-fadeIn">
      <div className="max-w-5xl mx-auto pb-safe-bottom">
        
        {/* 1. Header & Score Dashboard */}
        <div className="bg-white pb-6 pt-8 px-4 md:px-8 shadow-sm border-b border-slate-100">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                 <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                    <Award className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
                    演练评估报告
                 </h1>
                 <p className="text-slate-500 text-sm mt-1">
                    对象: <span className="font-semibold text-slate-900">{persona.name}</span> ({persona.jobTitle})
                 </p>
              </div>
              <div className="flex gap-2 text-xs font-bold bg-slate-100 p-1 rounded-lg">
                 <div className="px-3 py-1 bg-white rounded shadow-sm text-slate-800">AI 智能评分</div>
                 <div className="px-3 py-1 text-slate-400">v2.5 Model</div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Score Card */}
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white overflow-hidden shadow-xl">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Award className="w-24 h-24" />
                 </div>
                 <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
                    <span className="text-slate-300 text-sm font-medium uppercase tracking-wider">综合得分</span>
                    <div className="flex items-baseline gap-2">
                       <span className="text-5xl md:text-6xl font-black tracking-tight">{report.score}</span>
                       <span className="text-xl text-slate-400">/ 100</span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                       <span className={`text-2xl font-black px-3 py-1 rounded-lg ${grade.bg} ${grade.color}`}>
                          {grade.label}
                       </span>
                       <span className="font-bold text-lg">{grade.text}</span>
                    </div>
                 </div>
              </div>

              {/* Radar Chart */}
              <div className="col-span-1 md:col-span-2 bg-white border border-slate-100 rounded-3xl p-2 h-[220px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Performance"
                        dataKey="A"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fill="#3b82f6"
                        fillOpacity={0.2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                  {/* Stats Legend */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 text-xs">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-slate-500">本次表现</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                        <span className="text-slate-300">标准基线</span>
                     </div>
                  </div>
              </div>
           </div>
        </div>

        {/* 2. Content Body */}
        <div className="px-4 md:px-8 py-6 space-y-6 md:space-y-8">
            
            {/* Executive Summary */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking