import React, { useEffect, useState } from 'react';
import { Activity, Sparkles, Target, Quote, CheckCircle2, XCircle, BookOpen, ExternalLink, ShieldAlert, ArrowRight, MessageSquare, ThumbsUp, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Message, Persona, FeedbackReport, DimensionEvaluation, UserFeedback } from '../types';
import { generateSessionReport } from '../services/geminiService';
import { saveSession, updateSession } from '../services/storage';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Button, Card as AntdCard, Rate, Tag, Progress, Row, Col, Typography, Spin, Result as AntdResult, Alert, Tooltip, Input, Divider, Collapse } from 'antd';
import { ReloadOutlined, InfoCircleOutlined, StarFilled, CaretRightOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;
const Card = AntdCard as any;
const Result = AntdResult as any;

interface Props {
  messages: Message[];
  persona: Persona;
  onRestart: () => void;
  existingReport?: FeedbackReport; 
  existingNps?: number; // legacy
}

// Helper to determine Level Color
const getLevelColor = (level: string) => {
    switch(level) {
        case '卓越级': return { color: '#ca8a04', bg: '#fefce8' }; // Yellow/Gold
        case '胜任级': return { color: '#16a34a', bg: '#f0fdf4' }; // Green
        case '发展中': return { color: '#2563eb', bg: '#eff6ff' }; // Blue
        default: return { color: '#64748b', bg: '#f8fafc' }; // Slate
    }
};

const DIMENSION_TOOLTIPS = {
    sbi: (
        <div className="text-xs">
            <div className="font-bold mb-1">禁忌行为审查标准：</div>
            <ul className="list-disc pl-3 mb-0 space-y-0.5">
                <li>模糊主观表述 (如“我觉得你态度不行”)</li>
                <li>推卸责任给上级 (如“是老板让我给你C的”)</li>
            </ul>
        </div>
    ),
    grow: (
        <div className="text-xs">
            <div className="font-bold mb-1">禁忌行为审查标准：</div>
            <ul className="list-disc pl-3 mb-0 space-y-0.5">
                <li>只谈问题忽视改进 (只批评不建议)</li>
                <li>面谈准备缺失 (对具体细节一问三不知)</li>
            </ul>
        </div>
    ),
    listening: (
        <div className="text-xs">
            <div className="font-bold mb-1">禁忌行为审查标准：</div>
            <ul className="list-disc pl-3 mb-0 space-y-0.5">
                <li>频繁打断员工发言</li>
                <li>使用攻击性/侮辱性语言</li>
                <li>完全忽视员工的情绪表达</li>
            </ul>
        </div>
    )
};

export const StepReport: React.FC<Props> = ({ messages, persona, onRestart, existingReport, existingNps }) => {
  const [report, setReport] = useState<FeedbackReport | null>(existingReport || null);
  const [loading, setLoading] = useState(!existingReport);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Feedback State
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(existingNps !== undefined);
  const [feedbackData, setFeedbackData] = useState<UserFeedback>({
    overallScore: existingNps || 0,
    realismScore: 0,
    utilityScore: 0,
    comment: ''
  });

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

  const handleSubmitFeedback = () => {
    if (sessionId) {
      updateSession(sessionId, { userFeedback: feedbackData, nps: feedbackData.overallScore });
    }
    setFeedbackSubmitted(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50">
         <Spin size="large" tip="AI 教练正在生成深度评估报告..." />
         <div className="mt-4 text-slate-500 text-sm">正在分析 SBI 反馈模型、GROW 引导技巧及面谈五步法执行情况</div>
      </div>
    );
  }

  if (!report) return null;
  
  const sbi = report.sbi || { score: 0, analysis: 'N/A', forbiddenBehaviors: [] };
  const grow = report.grow || { score: 0, analysis: 'N/A', forbiddenBehaviors: [] };
  const listening = report.listening || { score: 0, analysis: 'N/A', forbiddenBehaviors: [] };
  const fiveSteps = report.fiveSteps || [];
  const resources = report.learningResources || [];

  const radarData = [
    { subject: '反馈有效性', A: (sbi.score / 5) * 100, fullMark: 100 },
    { subject: '引导能力', A: (grow.score / 5) * 100, fullMark: 100 },
    { subject: '倾听共情', A: (listening.score / 5) * 100, fullMark: 100 },
  ];

  const levelInfo = getLevelColor(report.level);

  // Collect all forbidden behaviors
  const forbiddenList = [
      ...(report.rotationFallacyDetected ? [{ category: '特殊干预', text: '触犯“轮流坐庄”谬误：暗示绩效结果是轮流分配的，而非基于实际表现。此举严重损害绩效管理的严肃性与公平性。' }] : []),
      ...(sbi.forbiddenBehaviors || []).map(b => ({ category: '反馈有效性', text: b })),
      ...(grow.forbiddenBehaviors || []).map(b => ({ category: '引导能力', text: b })),
      ...(listening.forbiddenBehaviors || []).map(b => ({ category: '倾听共情', text: b })),
  ];

  // Component to render a Dimension Card
  const DimensionCard = ({ title, data, icon: Icon, tooltipContent }: { title: string, data: DimensionEvaluation, icon: any, tooltipContent: React.ReactNode }) => (
    <Card className="h-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow" bodyStyle={{ padding: '24px' }}>
        <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                     <h4 className="font-bold text-slate-800 text-base m-0 flex items-center gap-2">
                        {title}
                        <Tooltip title={tooltipContent} placement="top" overlayStyle={{ maxWidth: 300 }}>
                            <InfoCircleOutlined className="text-slate-300 cursor-help hover:text-blue-500 transition-colors text-sm" />
                        </Tooltip>
                     </h4>
                </div>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">{data.score}</span>
                <span className="text-sm text-slate-400 font-medium">/5</span>
            </div>
        </div>
        
        <Progress 
            percent={(data.score / 5) * 100} 
            showInfo={false} 
            strokeColor={data.score >= 4 ? '#16a34a' : data.score >= 3 ? '#ca8a04' : '#dc2626'} 
            size="small"
            className="mb-5"
        />
        
        <p className="text-slate-600 leading-relaxed text-sm">
            {data.analysis}
        </p>
    </Card>
  );

  return (
    <div className="h-full overflow-y-auto bg-slate-50 animate-fadeIn scrollbar-hide pb-safe-bottom">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200 p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                       <Tag color="blue">{persona.jobTitle}</Tag>
                       <span className="text-slate-500 text-sm">{new Date().toLocaleDateString()}</span>
                   </div>
                   <Title level={2} style={{ margin: 0 }} className="text-xl md:text-3xl">绩效沟通能力评估报告</Title>
                </div>
                <Button type="primary" size="large" icon={<ReloadOutlined />} onClick={onRestart}>
                   再次演练
                </Button>
            </div>
        </div>

        <div className="p-4 md:p-8 space-y-8">
            
            {/* 1. Summary Dashboard */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                <Row gutter={[32, 32]}>
                    <Col xs={24} md={8} className="border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0">
                         <div className="text-center h-full flex flex-col justify-center">
                            <div className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">综合段位评级</div>
                            <div className="text-4xl font-bold mb-3" style={{ color: levelInfo.color }}>{report.level}</div>
                            <div className="flex justify-center mb-6 items-baseline gap-1">
                                <span className="text-7xl font-bold text-slate-800 tracking-tighter">{report.score}</span>
                                <span className="text-xl text-slate-400 font-medium">/100</span>
                            </div>
                            <div className="text-left bg-slate-50 p-4 rounded-xl text-sm text-slate-600 leading-relaxed border border-slate-100">
                                {report.summary}
                            </div>
                         </div>
                    </Col>
                    
                    <Col xs={24} md={8}>
                         <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar 
                                        name="Performance" 
                                        dataKey="A" 
                                        stroke={levelInfo.color} 
                                        strokeWidth={3}
                                        fill={levelInfo.color} 
                                        fillOpacity={0.2} 
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                         </div>
                    </Col>

                    <Col xs={24} md={8}>
                        <div className="space-y-4 h-full flex flex-col justify-center">
                            <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                                <h5 className="font-bold text-emerald-800 flex items-center gap-2 mb-3 text-sm uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4"/> 核心优势
                                </h5>
                                <ul className="list-none space-y-2">
                                    {report.strengths.map((s, i) => (
                                        <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0"></span>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                                <h5 className="font-bold text-amber-800 flex items-center gap-2 mb-3 text-sm uppercase tracking-wider">
                                    <Target className="w-4 h-4"/> 提升空间
                                </h5>
                                <ul className="list-none space-y-2">
                                    {report.challenges.map((c, i) => (
                                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 flex-shrink-0"></span>
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* 2. Forbidden Behavior Review (New dedicated section) */}
            <div id="forbidden-review" className="scroll-mt-20">
                {forbiddenList.length > 0 ? (
                    <div className="bg-red-50 rounded-2xl border border-red-100 p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-100 rounded-full">
                                <ShieldAlert className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-red-900 m-0">禁忌行为审查</h3>
                                <p className="text-red-600/80 text-sm m-0 mt-1">发现 {forbiddenList.length} 项需要立即纠正的沟通禁忌</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {forbiddenList.map((item, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-xl border-l-4 border-red-500 shadow-sm">
                                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                        <span className="font-bold text-red-600 text-sm uppercase tracking-wider flex items-center gap-1.5">
                                            <XCircle className="w-4 h-4" /> 禁忌 {idx + 1}
                                        </span>
                                        <span className="hidden md:inline text-slate-300">|</span>
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                            {item.category}
                                        </span>
                                    </div>
                                    <div className="text-slate-800 font-medium text-base mb-1">
                                        {item.text}
                                    </div>
                                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                                        <InfoCircleOutlined />
                                        影响：此行为可能导致员工对抗情绪升级或对绩效公正性产生质疑
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100 p-6 flex items-center gap-5">
                        <div className="bg-white p-3 rounded-full shadow-sm">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-emerald-900 font-bold text-lg mb-1">禁忌行为审查通过</h3>
                            <p className="text-emerald-700/80 text-sm m-0">恭喜！在本次沟通中未检测到明显的管理禁忌行为，专业度值得肯定。</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Core Competency Dimensions */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" /> 核心能力维度评估
                </h3>
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={8}>
                        <DimensionCard title="反馈有效性 (SBI)" data={sbi} icon={Target} tooltipContent={DIMENSION_TOOLTIPS.sbi} />
                    </Col>
                    <Col xs={24} md={8}>
                        <DimensionCard title="引导能力 (GROW)" data={grow} icon={ArrowRight} tooltipContent={DIMENSION_TOOLTIPS.grow} />
                    </Col>
                    <Col xs={24} md={8}>
                        <DimensionCard title="倾听与同理心" data={listening} icon={Activity} tooltipContent={DIMENSION_TOOLTIPS.listening} />
                    </Col>
                </Row>
            </div>

            {/* 4. Five Steps Assessment */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 m-0">绩效面谈五步法</h3>
                                <p className="text-slate-500 text-sm m-0 mt-0.5">标准流程执行情况检查</p>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-bold text-indigo-600">
                                 {fiveSteps.filter(s => s.executed).length}
                                 <span className="text-sm text-slate-400 font-normal ml-1">/ 5</span>
                             </div>
                        </div>
                    </div>
                </div>
                
                <div className="divide-y divide-slate-100">
                    {fiveSteps.map((step, index) => (
                        <div key={index} className="p-6 md:p-8 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-start gap-4">
                                <div className="mt-1 flex-shrink-0">
                                    {step.executed ? (
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                                            <XCircle className="w-4 h-4 text-slate-300 group-hover:text-red-500 transition-colors" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className={`text-base font-bold ${step.executed ? 'text-slate-800' : 'text-slate-500'}`}>
                                            {step.stepName}
                                        </h4>
                                        {!step.executed && <Tag color="warning">待改进</Tag>}
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">{step.analysis}</p>
                                    
                                    {!step.executed && step.recommendedScript && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 relative mt-3">
                                            <div className="flex items-start gap-3">
                                                <Quote className="w-5 h-5 text-indigo-400 transform -scale-x-100 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">建议话术</span>
                                                    <p className="text-sm text-indigo-900 italic mb-0 font-medium">{step.recommendedScript}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Learning Resources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Long Term Advice */}
                 <Card className="h-full border-slate-200" title={<span className="font-bold flex items-center gap-2 text-slate-700"><Target className="w-4 h-4 text-blue-500"/> 长期修炼建议</span>}>
                     <p className="text-slate-600 leading-7 text-sm">{report.longTermAdvice}</p>
                 </Card>

                 {/* Links */}
                 <Card className="h-full border-slate-200" title={<span className="font-bold flex items-center gap-2 text-slate-700"><BookOpen className="w-4 h-4 text-purple-500"/> 学习锦囊</span>}>
                     <div className="space-y-4">
                         {resources.map((res, i) => (
                             <a 
                                key={i} 
                                href={res.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block group p-4 rounded-xl bg-slate-50 hover:bg-purple-50 transition-all border border-slate-100 hover:border-purple-200"
                             >
                                 <div className="flex items-start justify-between">
                                     <div>
                                         <div className="font-bold text-slate-800 group-hover:text-purple-700 flex items-center gap-1.5 mb-1 transition-colors">
                                             {res.title}
                                             <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                         </div>
                                         <div className="text-xs text-slate-500 line-clamp-1">{res.description}</div>
                                     </div>
                                 </div>
                             </a>
                         ))}
                         {resources.length === 0 && <div className="text-slate-400 text-center py-8 text-sm">暂无具体课程推荐</div>}
                     </div>
                 </Card>
            </div>

            {/* 6. Enhanced Feedback Section (Large NPS) */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl shadow-xl overflow-hidden mt-8 text-white">
                <div className="p-8 md:p-12">
                    {!feedbackSubmitted ? (
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-10">
                                <h3 className="text-2xl font-bold text-white flex items-center justify-center gap-3 mb-2">
                                    <HelpCircle className="w-7 h-7 text-indigo-200" /> 
                                    协助优化 AI 教练模型 (Beta)
                                </h3>
                                <p className="text-indigo-100 text-base">您的真实反馈将直接用于校准 AI 的评分标准和角色反应逻辑</p>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8 border border-white/10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                     <div className="text-center">
                                         <div className="text-base font-bold text-indigo-100 mb-4 uppercase tracking-wider">整体体验 (NPS)</div>
                                         <Rate 
                                            value={feedbackData.overallScore} 
                                            count={10}
                                            className="text-3xl text-yellow-400 [&_.ant-rate-star-second]:text-indigo-900/40" 
                                            onChange={(val) => setFeedbackData({...feedbackData, overallScore: val})}
                                         />
                                         <div className="mt-2 text-indigo-200 text-sm font-medium">{feedbackData.overallScore > 0 ? `${feedbackData.overallScore} 分` : '请评分'}</div>
                                     </div>
                                     <div className="text-center border-l border-white/10 md:pl-10">
                                         <div className="text-base font-bold text-indigo-100 mb-4 uppercase tracking-wider">角色真实度</div>
                                         <Rate 
                                            value={feedbackData.realismScore} 
                                            character={<StarFilled style={{ fontSize: '28px' }} />}
                                            className="text-amber-400 [&_.ant-rate-star-second]:text-indigo-900/40"
                                            onChange={(val) => setFeedbackData({...feedbackData, realismScore: val})} 
                                         />
                                         <div className="text-sm text-indigo-300 mt-2">员工反应是否符合人设?</div>
                                     </div>
                                     <div className="text-center border-l border-white/10 md:pl-10">
                                         <div className="text-base font-bold text-indigo-100 mb-4 uppercase tracking-wider">建议有用性</div>
                                         <Rate 
                                            value={feedbackData.utilityScore} 
                                            character={<StarFilled style={{ fontSize: '28px' }} />}
                                            className="text-emerald-400 [&_.ant-rate-star-second]:text-indigo-900/40" 
                                            onChange={(val) => setFeedbackData({...feedbackData, utilityScore: val})}
                                         />
                                         <div className="text-sm text-indigo-300 mt-2">报告指导是否落地?</div>
                                     </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                 <div className="text-base font-bold text-indigo-100 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5" /> 
                                    更多建议 (可选)
                                 </div>
                                 <TextArea 
                                    placeholder="例如：AI 员工太容易妥协了 / 评分标准过于严格 / 这句话AI理解错了..."
                                    rows={3}
                                    className="!bg-white/10 !border-white/20 !text-white !placeholder-indigo-300/50 rounded-xl text-base p-4"
                                    value={feedbackData.comment}
                                    onChange={(e) => setFeedbackData({...feedbackData, comment: e.target.value})}
                                 />
                            </div>

                            <div className="text-center">
                                <Button 
                                    type="primary" 
                                    size="large" 
                                    onClick={handleSubmitFeedback} 
                                    disabled={feedbackData.overallScore === 0}
                                    className="h-14 px-12 text-lg font-bold rounded-full bg-white text-indigo-600 hover:!bg-indigo-50 border-0 shadow-lg"
                                >
                                    提交反馈
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center animate-fadeIn">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500 text-white mb-6 shadow-lg shadow-green-900/20">
                                <ThumbsUp className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2">感谢您的反馈！</h2>
                            <p className="text-indigo-200 text-lg max-w-xl mx-auto">
                                您的评价（{feedbackData.overallScore}分）已记录。我们将持续迭代模型，为您打造更真实的管理陪练体验。
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
};