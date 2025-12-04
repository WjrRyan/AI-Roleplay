
import React, { useEffect, useState } from 'react';
import { Activity, BrainCircuit, Sparkles, TrendingUp, ArrowRight, Quote, MessageSquare, Target } from 'lucide-react';
import { Message, Persona, FeedbackReport } from '../types';
import { generateSessionReport } from '../services/geminiService';
import { saveSession, updateSession } from '../services/storage';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface Props {
  messages: Message[];
  persona: Persona;
  onRestart: () => void;
  existingReport?: FeedbackReport; 
  existingNps?: number;
}

// Helper to calculate Grade
const getGrade = (score: number) => {
  if (score >= 90) return { label: 'S', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', text: '完美应对', icon: '🏆' };
  if (score >= 80) return { label: 'A', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', text: '非常优秀', icon: '🌟' };
  if (score >= 70) return { label: 'B', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: '合格通过', icon: '👍' };
  if (score >= 60) return { label: 'C', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', text: '有待提升', icon: '⚠️' };
  return { label: 'D', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: '演练失败', icon: '💔' };
};

export const StepReport: React.FC<Props> = ({ messages, persona, onRestart, existingReport, existingNps }) => {
  const [report, setReport] = useState<FeedbackReport | null>(existingReport || null);
  const [loading, setLoading] = useState(!existingReport);
  const [sessionId, setSessionId] = useState<string>('');
  const [npsScore, setNpsScore] = useState<number | null>(existingNps !== undefined ? existingNps : null);
  const [npsSubmitted, setNpsSubmitted] = useState(existingNps !== undefined);

  useEffect(() => {
    if (existingReport) return;

    const fetchReport = async () => {
      // Filter out system messages for cleaner context
      const conversationHistory = messages.filter(m => m.role !== 'system');
      const data = await generateSessionReport(conversationHistory, persona);
      
      const newId = Date.now().toString();
      saveSession({
        id: newId,
        date: new Date().toISOString(),
        persona: persona,
        messages: messages,
        report: data
      });
      setSessionId(newId);

      setReport(data);
      setLoading(false);
    };
    fetchReport();
  }, [messages, persona, existingReport]);

  const handleSubmitNPS = (score: number) => {
    setNpsScore(score);
    if (sessionId) {
      updateSession(sessionId, { nps: score });
    }
    setNpsSubmitted(true);
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
        <div className="space-y-3 text-sm text-slate-500 max-w-xs mx-auto mt-4">
           <p className="animate-pulse flex items-center justify-center gap-2"><BrainCircuit className="w-4 h-4"/> 分析沟通同理心</p>
           <p className="animate-pulse delay-150 flex items-center justify-center gap-2"><TrendingUp className="w-4 h-4"/> 评估目标达成率</p>
           <p className="animate-pulse delay-300 flex items-center justify-center gap-2"><Sparkles className="w-4 h-4"/> 生成改进建议</p>
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
    <div className="h-full overflow-y-auto bg-slate-50 animate-fadeIn scrollbar-hide">
      <div className="max-w-5xl mx-auto pb-safe-bottom">
        
        {/* Header Section - Clean Style */}
        <div className="bg-white border-b border-slate-200 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                        对象: {persona.name}
                      </span>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                        {persona.jobTitle}
                      </span>
                   </div>
                   <h1 className="text-2xl md:text-3xl font-bold text-slate-900">演练评估报告</h1>
                   <p className="text-slate-500 mt-1 text-sm">{new Date().toLocaleDateString()} · 智能分析完成</p>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={onRestart}
                     className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                   >
                     再次演练 <ArrowRight className="w-4 h-4" />
                   </button>
                </div>
            </div>
        </div>

        <div className="p-4 md:p-8 space-y-6">
            
            {/* 1. Score Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Main Score Card */}
                 <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden group">
                     <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity ${grade.bg.replace('bg-', 'bg-')}`}></div>
                     
                     <div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">综合得分</span>
                        <div className="flex items-baseline gap-2 mt-2">
                           <span className={`text-6xl font-black ${grade.color}`}>{report.score}</span>
                           <span className="text-slate-400 font-medium">/ 100</span>
                        </div>
                     </div>

                     <div className="mt-8 flex items-center justify-between">
                        <div>
                           <div className="text-slate-500 text-xs mb-1">能力评级</div>
                           <div className={`text-2xl font-bold ${grade.color}`}>{grade.label} - {grade.text}</div>
                        </div>
                        <div className="text-4xl">{grade.icon}</div>
                     </div>
                 </div>

                 {/* Radar Chart */}
                 <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center">
                      <div className="w-full h-48 md:w-1/2 flex-shrink-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Performance"
                                    dataKey="A"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fill="#3b82f6"
                                    fillOpacity={0.2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full md:w-1/2 md:pl-6 pt-4 md:pt-0 space-y-4">
                           <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              <Activity className="w-4 h-4 text-blue-500" /> 维度分析
                           </h4>
                           <div className="space-y-3">
                               <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">同理心</span>
                                  <div className="flex items-center gap-3 w-32">
                                     <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{width: `${report.empathyScore}%`}}></div>
                                     </div>
                                     <span className="font-bold text-slate-700 w-6 text-right">{report.empathyScore}</span>
                                  </div>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">表达清晰度</span>
                                  <div className="flex items-center gap-3 w-32">
                                     <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{width: `${report.clarityScore}%`}}></div>
                                     </div>
                                     <span className="font-bold text-slate-700 w-6 text-right">{report.clarityScore}</span>
                                  </div>
                               </div>
                               <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-500">目标达成</span>
                                  <div className="flex items-center gap-3 w-32">
                                     <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 rounded-full" style={{width: `${report.goalAchievementScore}%`}}></div>
                                     </div>
                                     <span className="font-bold text-slate-700 w-6 text-right">{report.goalAchievementScore}</span>
                                  </div>
                               </div>
                           </div>
                      </div>
                 </div>
            </div>

            {/* 2. Executive Summary */}
            <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Quote className="w-24 h-24 text-white transform rotate-12" />
                </div>
                <div className="relative z-10">
                   <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-3">AI 教练点评</h3>
                   <p className="text-lg md:text-xl font-medium leading-relaxed">"{report.summary}"</p>
                </div>
            </div>

            {/* 3. Feedback Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Highlights */}
                 <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
                    <h3 className="font-bold text-green-800 text-lg mb-4 flex items-center gap-2">
                       <Sparkles className="w-5 h-5" /> 亮点表现 (Keep Doing)
                    </h3>
                    <ul className="space-y-3">
                       {report.strengths.map((point, i) => (
                          <li key={i} className="flex items-start gap-3">
                             <div className="w-5 h-5 rounded-full bg-green-200 text-green-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i+1}</div>
                             <span className="text-green-900 text-sm leading-relaxed">{point}</span>
                          </li>
                       ))}
                    </ul>
                 </div>

                 {/* Improvements */}
                 <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
                    <h3 className="font-bold text-orange-800 text-lg mb-4 flex items-center gap-2">
                       <Target className="w-5 h-5" /> 提升建议 (Improve)
                    </h3>
                    <ul className="space-y-3">
                       {report.improvements.map((point, i) => (
                          <li key={i} className="flex items-start gap-3">
                             <div className="w-5 h-5 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{i+1}</div>
                             <span className="text-orange-900 text-sm leading-relaxed">{point}</span>
                          </li>
                       ))}
                    </ul>
                 </div>
            </div>

            {/* 4. Critical Moment */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <MessageSquare className="w-5 h-5 text-blue-500" /> 关键转折点复盘
               </h3>
               <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-blue-500">
                  <p className="text-slate-600 italic mb-3">"{report.transcriptReview}"</p>
                  <p className="text-xs text-slate-400 font-bold uppercase">AI 局势分析</p>
               </div>
            </div>

            {/* 5. NPS */}
            {!npsSubmitted ? (
               <div className="mt-8 bg-slate-900 rounded-2xl p-8 text-center">
                  <h3 className="text-white font-bold text-lg mb-2">本次模拟对您有帮助吗？</h3>
                  <p className="text-slate-400 text-sm mb-6">请打分 (0-10)</p>
                  <div className="flex flex-wrap justify-center gap-2">
                     {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <button
                          key={num}
                          onClick={() => handleSubmitNPS(num)}
                          className="w-10 h-10 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-white hover:text-slate-900 transition-all hover:-translate-y-1"
                        >
                           {num}
                        </button>
                     ))}
                  </div>
               </div>
            ) : (
                <div className="mt-8 text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                   <p className="text-slate-500 text-sm">感谢您的反馈！(评分: {npsScore})</p>
                </div>
            )}

            <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
};
