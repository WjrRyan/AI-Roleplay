
import React, { useEffect, useState } from 'react';
import { Activity, Sparkles, Target, Quote } from 'lucide-react';
import { Message, Persona, FeedbackReport } from '../types';
import { generateSessionReport } from '../services/geminiService';
import { saveSession, updateSession } from '../services/storage';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Button, Card, Rate, Tag, Progress, Row, Col, Typography, Spin, Result } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface Props {
  messages: Message[];
  persona: Persona;
  onRestart: () => void;
  existingReport?: FeedbackReport; 
  existingNps?: number;
}

const getGrade = (score: number) => {
  if (score >= 90) return { label: 'S', color: '#ca8a04', text: '完美应对' };
  if (score >= 80) return { label: 'A', color: '#16a34a', text: '非常优秀' };
  if (score >= 70) return { label: 'B', color: '#2563eb', text: '合格通过' };
  if (score >= 60) return { label: 'C', color: '#ea580c', text: '有待提升' };
  return { label: 'D', color: '#dc2626', text: '演练失败' };
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
      <div className="flex flex-col items-center justify-center h-full bg-slate-50">
         <Spin size="large" tip="AI 教练正在复盘分析中..." />
         <div className="mt-4 text-slate-500 text-sm">正在评估同理心、沟通清晰度与目标达成率</div>
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
    <div className="h-full overflow-y-auto bg-slate-50 animate-fadeIn scrollbar-hide pb-safe-bottom">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200 p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                       <Tag>{persona.jobTitle}</Tag>
                       <span className="text-slate-500 text-sm">{new Date().toLocaleDateString()}</span>
                   </div>
                   <Title level={2} style={{ margin: 0 }} className="text-xl md:text-3xl">演练评估报告</Title>
                   <Text type="secondary" className="text-xs md:text-sm">智能分析完成</Text>
                </div>
                <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={onRestart} className="w-full md:w-auto">
                   再次演练
                </Button>
            </div>
        </div>

        <div className="p-4 md:p-8 space-y-6">
            
            {/* 1. Score Dashboard */}
            <Row gutter={[24, 24]}>
                 <Col xs={24} md={9}>
                     <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-100 to-transparent rounded-bl-[100px] pointer-events-none"></div>
                         
                         <div className="text-slate-400 text-sm font-medium mb-4 uppercase tracking-wider">综合得分</div>
                         
                         <div className="flex items-baseline justify-center mb-6">
                            <span className="text-6xl md:text-7xl font-bold transition-all duration-500" style={{ color: grade.color }}>
                                {report.score}
                            </span>
                            <span className="text-2xl text-slate-300 font-medium ml-2">/ 100</span>
                         </div>
                         
                         <div 
                            className="px-8 py-2 rounded-lg text-white font-bold text-lg shadow-md transform hover:scale-105 transition-transform"
                            style={{ backgroundColor: grade.color }}
                         >
                            {grade.label} - {grade.text}
                         </div>
                     </div>
                 </Col>

                 <Col xs={24} md={15}>
                     <div className="h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                        <Row align="middle" className="h-full" gutter={[0, 24]}>
                            <Col xs={24} sm={14} className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar 
                                            name="Performance" 
                                            dataKey="A" 
                                            stroke="#94a3b8" 
                                            strokeWidth={2}
                                            fill="#cbd5e1" 
                                            fillOpacity={0.4} 
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </Col>
                            <Col xs={24} sm={10}>
                                <div className="space-y-6 pl-0 md:pl-4">
                                    <h4 className="font-bold flex items-center gap-2 text-slate-700">
                                        <Activity className="w-4 h-4 text-blue-500" /> 
                                        维度拆解
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1 text-slate-500 font-medium">
                                                <span>同理心</span>
                                                <span>{report.empathyScore}</span>
                                            </div>
                                            <Progress percent={report.empathyScore} showInfo={false} strokeColor="#94a3b8" trailColor="#f1f5f9" size="small" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1 text-slate-500 font-medium">
                                                <span>清晰度</span>
                                                <span>{report.clarityScore}</span>
                                            </div>
                                            <Progress percent={report.clarityScore} showInfo={false} strokeColor="#94a3b8" trailColor="#f1f5f9" size="small" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1 text-slate-500 font-medium">
                                                <span>目标达成</span>
                                                <span>{report.goalAchievementScore}</span>
                                            </div>
                                            <Progress percent={report.goalAchievementScore} showInfo={false} strokeColor="#94a3b8" trailColor="#f1f5f9" size="small" />
                                        </div>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                     </div>
                 </Col>
            </Row>

            {/* 2. Executive Summary */}
            <Card className="bg-slate-900 border-none shadow-lg rounded-2xl" bodyStyle={{ padding: '24px 32px' }}>
                <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-3">
                       <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                       <Text className="text-slate-400 text-xs font-bold tracking-wider uppercase">AI 教练点评</Text>
                   </div>
                   <Paragraph className="text-white text-base md:text-lg font-medium mb-0 leading-relaxed indent-0 opacity-95">
                       <Quote className="w-8 h-8 text-slate-700 inline mr-2 align-top transform -scale-x-100" />
                       {report.summary}
                   </Paragraph>
                </div>
            </Card>

            {/* 3. Feedback Grid */}
            <Row gutter={[24, 24]}>
                 <Col xs={24} md={12}>
                     <div className="h-full bg-green-50/50 border border-green-100 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-green-600"/> 
                            <span className="font-bold text-green-900">亮点表现</span>
                        </div>
                        <ul className="space-y-4 pl-0 list-none mb-0">
                           {report.strengths.map((point, i) => (
                              <li key={i} className="flex items-start gap-3">
                                 <div className="w-6 h-6 rounded-full bg-green-200 text-green-700 flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">{i+1}</div>
                                 <span className="text-green-900 text-sm leading-6 pt-0.5">{point}</span>
                              </li>
                           ))}
                        </ul>
                     </div>
                 </Col>

                 <Col xs={24} md={12}>
                     <div className="h-full bg-orange-50/50 border border-orange-100 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Target className="w-5 h-5 text-orange-600"/> 
                            <span className="font-bold text-orange-900">提升建议</span>
                        </div>
                        <ul className="space-y-4 pl-0 list-none mb-0">
                           {report.improvements.map((point, i) => (
                              <li key={i} className="flex items-start gap-3">
                                 <div className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">{i+1}</div>
                                 <span className="text-orange-900 text-sm leading-6 pt-0.5">{point}</span>
                              </li>
                           ))}
                        </ul>
                     </div>
                 </Col>
            </Row>

            {/* 4. NPS */}
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center mt-8">
                {!npsSubmitted ? (
                    <>
                        <Title level={4} className="text-base md:text-lg mb-6">本次模拟对您有帮助吗？</Title>
                        <div className="flex justify-center">
                            <Rate 
                                count={10} 
                                onChange={handleSubmitNPS} 
                                className="text-2xl md:text-3xl [&_.ant-rate-star-second]:text-slate-200 [&_.ant-rate-star-full_.ant-rate-star-second]:text-yellow-400" 
                            />
                        </div>
                    </>
                ) : (
                    <Result
                        status="success"
                        title="感谢您的反馈！"
                        subTitle={<span className="text-slate-500">您打出了 <span className="font-bold text-slate-800">{npsScore}</span> 分</span>}
                        className="py-0"
                    />
                )}
            </div>

            <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
};
