
import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Play, Sparkles, UserPlus, ArrowLeft, Briefcase, BrainCircuit, ScanFace, FileCode, Check, Trash2, Bookmark } from 'lucide-react';
import { Persona, BigFive } from '../types';
import { generateSystemInstruction } from '../services/geminiService';
import { saveCustomPersona, getCustomPersonas, deleteCustomPersona } from '../services/storage';

interface Props {
  onStart: (persona: Persona) => void;
  onBack: () => void;
}

// System Templates
const TEMPLATES: Persona[] = [
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

export const StepSetup: React.FC<Props> = ({ onStart, onBack }) => {
  const [activeTab, setActiveTab] = useState<'template' | 'custom' | 'create'>('template');
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  
  const [myPersonas, setMyPersonas] = useState<Persona[]>([]);

  const [customPersona, setCustomPersona] = useState<Persona>({
    name: "",
    gender: "Female",
    jobTitle: "",
    yearsOfExperience: 3,
    description: "",
    businessPainPoints: "",
    lastPerformance: "B",
    thisPerformance: "C",
    voiceName: "Kore",
    bigFive: {
      openness: 'High',
      conscientiousness: 'High',
      extraversion: 'High',
      agreeableness: 'High',
      neuroticism: 'Low'
    }
  });

  useEffect(() => {
    // Load custom personas on mount
    setMyPersonas(getCustomPersonas());
  }, []);

  const handleStartTemplate = (template: Persona) => {
    onStart(template);
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("确定要删除这个自定义角色吗？")) {
      deleteCustomPersona(id);
      setMyPersonas(getCustomPersonas());
    }
  };

  const generatePreview = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Assign Avatar based on gender
    const randomId = Math.floor(Math.random() * 99);
    const avatarUrl = `https://randomuser.me/api/portraits/${customPersona.gender === 'Male' ? 'men' : 'women'}/${randomId}.jpg`;
    
    // 2. Assign Voice based on gender
    const voiceName = customPersona.gender === 'Male' ? 'Fenrir' : 'Kore';

    const finalPersona = {
        ...customPersona,
        id: customPersona.id || Date.now().toString(),
        isCustom: true,
        avatarUrl,
        voiceName
    };

    setCustomPersona(finalPersona);
    
    // 3. Generate Prompt
    const prompt = generateSystemInstruction(finalPersona);
    setGeneratedPrompt(prompt);
    
    setViewMode('preview');
  };

  const handleConfirmStart = () => {
    // Save the custom persona before starting
    saveCustomPersona(customPersona);
    setMyPersonas(getCustomPersonas()); // Update local list
    onStart(customPersona);
  };

  const handleBigFiveChange = (key: keyof BigFive, value: 'High' | 'Low') => {
    setCustomPersona({
      ...customPersona,
      bigFive: {
        ...customPersona.bigFive,
        [key]: value
      }
    });
  };

  if (viewMode === 'preview') {
    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto p-3 md:p-6 animate-fadeIn pb-safe-bottom">
             <div className="flex items-center justify-between mb-4 md:mb-6">
                <button 
                onClick={() => setViewMode('form')} 
                className="group flex items-center text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors"
                >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 group-hover:border-slate-400 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                返回修改
                </button>
                <div className="text-center">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">角色设定预览</h2>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">AI 将基于以下提示词进行扮演</p>
                </div>
                <div className="w-24"></div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex-1 flex flex-col min-h-0 border border-slate-200">
                <div className="p-4 md:p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4 md:gap-6">
                     <img src={customPersona.avatarUrl} alt={customPersona.name} className="w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-md border-2 border-white object-cover" />
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                             <h3 className="text-lg md:text-xl font-bold text-slate-900">{customPersona.name}</h3>
                             <span className={`px-2 py-0.5 text-xs font-bold rounded text-white ${customPersona.gender === 'Male' ? 'bg-blue-500' : 'bg-pink-500'}`}>
                                {customPersona.gender === 'Male' ? '男' : '女'}
                             </span>
                             <span className="px-2 py-0.5 text-xs font-bold rounded bg-purple-100 text-purple-700">
                                自定义
                             </span>
                        </div>
                        <p className="text-slate-500 font-medium text-sm md:text-base">{customPersona.jobTitle} · 工龄 {customPersona.yearsOfExperience} 年</p>
                     </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 z-10">
                        <span className="flex items-center gap-1 text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            <FileCode className="w-3 h-3" /> System Prompt
                        </span>
                    </div>
                    <textarea 
                        readOnly 
                        className="w-full h-full resize-none p-4 md:p-6 text-xs md:text-sm font-mono text-slate-600 bg-white focus:outline-none"
                        value={generatedPrompt}
                    />
                </div>

                <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50">
                    <button 
                        onClick={handleConfirmStart}
                        className="w-full py-3 md:py-4 bg-slate-900 text-white rounded-xl font-bold text-base md:text-lg shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" /> 保存并开始演练
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto p-3 md:p-6 animate-fadeIn pb-safe-bottom overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 flex-shrink-0">
        <button 
          onClick={onBack} 
          className="group flex items-center text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-2 group-hover:border-slate-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          返回首页
        </button>
        <div className="text-center">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">设定挑战对象</h2>
            <p className="text-xs md:text-sm text-slate-500 mt-1">选择一个典型案例，或创建一个具体的下属画像</p>
        </div>
        <div className="w-24"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 mx-2 md:mx-4 mt-2 md:mt-4 rounded-xl flex-shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('template')}
            className={`flex-1 py-2 md:py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'template' 
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            推荐案例
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 md:py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'custom' 
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bookmark className="w-4 h-4 text-purple-500" />
            我的角色 ({myPersonas.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 md:py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'create' 
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-4 h-4 text-blue-500" />
            新建角色
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="p-4 md:p-8 flex-1 overflow-y-auto bg-gradient-to-b from-white to-slate-50">
          
          {/* 1. Templates Tab */}
          {activeTab === 'template' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 pb-8">
              {TEMPLATES.map((t, idx) => (
                <div key={idx} className="group relative bg-white border border-slate-200 rounded-2xl p-5 md:p-6 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                     <div className="relative">
                        <img src={t.avatarUrl} alt={t.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:shadow-md transition-shadow" />
                        {t.personaTag && (
                          <div className={`absolute -bottom-2 -right-2 px-2 py-0.5 text-[10px] font-bold text-white rounded-full border-2 border-white
                              ${t.personaTag.includes('防御') ? 'bg-orange-500' : 
                                t.personaTag.includes('沉默') ? 'bg-slate-500' : 
                                t.personaTag.includes('争辩') ? 'bg-red-500' : 'bg-blue-500'
                              }`}>
                              {t.personaTag}
                          </div>
                        )}
                     </div>
                     <div className="text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                             <h3 className="text-xl font-bold text-slate-900">{t.name}</h3>
                             <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${t.gender === 'Male' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                                {t.gender === 'Male' ? '男' : '女'}
                             </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t.jobTitle}</p>
                     </div>
                  </div>

                  {/* Card Body */}
                  <div className="mb-6 flex-1 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                       <Users className="w-3 h-3" /> 工龄: {t.yearsOfExperience} 年
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase">主要问题</span>
                        <p className="text-sm text-slate-700 leading-relaxed mt-1 line-clamp-4">
                            {t.businessPainPoints}
                        </p>
                    </div>
                  </div>

                  {/* Button */}
                  <button
                    onClick={() => handleStartTemplate(t)}
                    className="w-full mt-auto bg-slate-50 text-slate-900 font-bold py-3 rounded-xl border border-slate-200 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all flex items-center justify-center gap-2"
                  >
                    开始对谈 <Play className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 2. Custom Personas Tab (Saved) */}
          {activeTab === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 pb-8">
               {myPersonas.length === 0 ? (
                   <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
                       <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <UserPlus className="w-8 h-8 opacity-50" />
                       </div>
                       <p className="text-lg font-medium text-slate-600">还没有创建过角色</p>
                       <p className="text-sm">点击上方 "新建角色" 创建一个属于你的案例</p>
                   </div>
               ) : (
                  myPersonas.map((t, idx) => (
                    <div key={idx} className="group relative bg-white border border-purple-200 rounded-2xl p-5 md:p-6 hover:shadow-xl hover:border-purple-400 hover:-translate-y-1 transition-all duration-300 flex flex-col ring-1 ring-purple-100">
                      
                      <div className="absolute -top-3 left-6 px-3 py-1 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                         自定义
                      </div>

                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-4 mt-2">
                         <div className="relative">
                            <img src={t.avatarUrl} alt={t.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:shadow-md transition-shadow" />
                         </div>
                         <div className="text-right">
                            <div className="flex items-center justify-end gap-2 mb-1">
                                 <h3 className="text-xl font-bold text-slate-900">{t.name}</h3>
                                 <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${t.gender === 'Male' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                                    {t.gender === 'Male' ? '男' : '女'}
                                 </span>
                            </div>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t.jobTitle}</p>
                         </div>
                      </div>

                      {/* Card Body */}
                      <div className="mb-6 flex-1 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                           <Users className="w-3 h-3" /> 工龄: {t.yearsOfExperience} 年
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">主要问题</span>
                            <p className="text-sm text-slate-700 leading-relaxed mt-1 line-clamp-4">
                                {t.businessPainPoints}
                            </p>
                        </div>
                      </div>

                      {/* Button */}
                      <div className="flex gap-2 mt-auto">
                        <button
                            onClick={() => handleStartTemplate(t)}
                            className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            开始 <Play className="w-4 h-4" />
                        </button>
                        <button
                             onClick={(e) => handleDeleteCustom(e, t.id!)}
                             className="p-3 border border-red-200 text-red-400 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
                             title="删除角色"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
               )}
            </div>
          )}

          {/* 3. Create Custom Tab */}
          {activeTab === 'create' && (
            <div className="max-w-4xl mx-auto pb-10">
               <form onSubmit={generatePreview} className="space-y-6 md:space-y-8">
                  
                  {/* Basic Info Section */}
                  <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 md:space-y-6">
                    <h3 className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                      <Briefcase className="w-5 h-5 text-blue-600" /> 基本信息
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">角色姓名</label>
                        <input
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="例如：李明"
                          value={customPersona.name}
                          onChange={e => setCustomPersona({...customPersona, name: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">性别</label>
                        <div className="flex gap-4">
                           <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${customPersona.gender === 'Male' ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}`}>
                               <input 
                                  type="radio" 
                                  name="gender" 
                                  value="Male" 
                                  checked={customPersona.gender === 'Male'} 
                                  onChange={() => setCustomPersona({...customPersona, gender: 'Male'})}
                                  className="hidden"
                                />
                                <span className="text-lg">👨</span> 男
                           </label>
                           <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${customPersona.gender === 'Female' ? 'bg-pink-50 border-pink-200 text-pink-700 font-bold shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}`}>
                               <input 
                                  type="radio" 
                                  name="gender" 
                                  value="Female" 
                                  checked={customPersona.gender === 'Female'} 
                                  onChange={() => setCustomPersona({...customPersona, gender: 'Female'})}
                                  className="hidden"
                                />
                                <span className="text-lg">👩</span> 女
                           </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">职位名称</label>
                        <input
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="例如：高级 Java 开发工程师"
                          value={customPersona.jobTitle}
                          onChange={e => setCustomPersona({...customPersona, jobTitle: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">工龄 (年)</label>
                        <input
                          required
                          type="number"
                          step="0.5"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="例如：3.5"
                          value={customPersona.yearsOfExperience}
                          onChange={e => setCustomPersona({...customPersona, yearsOfExperience: parseFloat(e.target.value)})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">上次绩效</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 outline-none"
                                value={customPersona.lastPerformance}
                                onChange={e => setCustomPersona({...customPersona, lastPerformance: e.target.value})}
                            >
                                <option value="A">A (优秀)</option>
                                <option value="B+">B+ (良好)</option>
                                <option value="B">B (合格)</option>
                                <option value="C">C (不合格)</option>
                                <option value="D">D (淘汰)</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">本次绩效</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 outline-none"
                                value={customPersona.thisPerformance}
                                onChange={e => setCustomPersona({...customPersona, thisPerformance: e.target.value})}
                            >
                                <option value="C">C (不合格)</option>
                                <option value="D">D (淘汰)</option>
                                <option value="B">B (合格-模拟)</option>
                            </select>
                         </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">工作内容描述</label>
                        <textarea
                          required
                          rows={2}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                          placeholder="简述该员工的主要职责。建议包含负责的具体项目或业务板块。例如：负责华东区大客户销售，维护核心KA客户关系。"
                          value={customPersona.description}
                          onChange={e => setCustomPersona({...customPersona, description: e.target.value})}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">业务痛点 / 绩效问题</label>
                        <div className="relative">
                           <textarea
                             required
                             rows={3}
                             className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 pl-10 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                             placeholder="请详细描述具体的绩效问题。建议包含具体的事实案例和员工的态度表现。例如：连续两个季度KPI未达标，且在复盘会上总是归因于市场环境，拒绝反思自身策略。"
                             value={customPersona.businessPainPoints}
                             onChange={e => setCustomPersona({...customPersona, businessPainPoints: e.target.value})}
                           />
                           <AlertTriangle className="absolute top-3 left-3 w-5 h-5 text-amber-500" />
                        </div>
                    </div>
                  </div>

                  {/* Personality Section */}
                  <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 md:space-y-6">
                    <h3 className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                      <BrainCircuit className="w-5 h-5 text-purple-600" /> 性格特征 (大五人格)
                    </h3>
                    <p className="text-sm text-slate-500">AI 将根据以下设定模拟员工的微表情和语言风格。</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {/* Openness */}
                      <div className="space-y-2">
                         <label className="flex justify-between text-sm font-semibold text-slate-700">
                            开放性 (Openness)
                            <span className="text-xs text-slate-400 font-normal">创造力 vs 保守</span>
                         </label>
                         <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-400"
                            value={customPersona.bigFive.openness}
                            onChange={(e) => handleBigFiveChange('openness', e.target.value as 'High' | 'Low')}
                         >
                             <option value="High">高 - 乐于接受新观念，思维活跃</option>
                             <option value="Low">低 - 循规蹈矩，抗拒变化</option>
                         </select>
                      </div>

                      {/* Conscientiousness */}
                      <div className="space-y-2">
                         <label className="flex justify-between text-sm font-semibold text-slate-700">
                            尽责性 (Conscientiousness)
                            <span className="text-xs text-slate-400 font-normal">自律 vs 随性</span>
                         </label>
                         <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-400"
                            value={customPersona.bigFive.conscientiousness}
                            onChange={(e) => handleBigFiveChange('conscientiousness', e.target.value as 'High' | 'Low')}
                         >
                             <option value="High">高 - 条理清晰，注重细节</option>
                             <option value="Low">低 - 随意松散，缺乏条理</option>
                         </select>
                      </div>

                       {/* Extraversion */}
                       <div className="space-y-2">
                         <label className="flex justify-between text-sm font-semibold text-slate-700">
                            外向性 (Extraversion)
                            <span className="text-xs text-slate-400 font-normal">社交 vs 独处</span>
                         </label>
                         <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-400"
                            value={customPersona.bigFive.extraversion}
                            onChange={(e) => handleBigFiveChange('extraversion', e.target.value as 'High' | 'Low')}
                         >
                             <option value="High">高 - 热情主动，表达欲强</option>
                             <option value="Low">低 - 内敛沉默，被动回应</option>
                         </select>
                      </div>

                      {/* Agreeableness */}
                      <div className="space-y-2">
                         <label className="flex justify-between text-sm font-semibold text-slate-700">
                            宜人性 (Agreeableness)
                            <span className="text-xs text-slate-400 font-normal">合作 vs 竞争</span>
                         </label>
                         <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-400"
                            value={customPersona.bigFive.agreeableness}
                            onChange={(e) => handleBigFiveChange('agreeableness', e.target.value as 'High' | 'Low')}
                         >
                             <option value="High">高 - 善解人意，倾向妥协</option>
                             <option value="Low">低 - 质疑挑战，据理力争</option>
                         </select>
                      </div>

                      {/* Neuroticism */}
                      <div className="space-y-2">
                         <label className="flex justify-between text-sm font-semibold text-slate-700">
                            神经质 (Neuroticism)
                            <span className="text-xs text-slate-400 font-normal">敏感 vs 稳定</span>
                         </label>
                         <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 outline-none focus:border-blue-400"
                            value={customPersona.bigFive.neuroticism}
                            onChange={(e) => handleBigFiveChange('neuroticism', e.target.value as 'High' | 'Low')}
                         >
                             <option value="High">高 - 容易焦虑，情绪化</option>
                             <option value="Low">低 - 情绪稳定，冷静</option>
                         </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 pb-10">
                    <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                      <FileCode className="w-5 h-5" /> 预览角色设定 (Prompt)
                    </button>
                  </div>
               </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
