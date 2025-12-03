import React from 'react';
import { Target, ArrowRight, CheckCircle2, History, Zap, ShieldAlert, Award } from 'lucide-react';

interface Props {
  onNext: () => void;
  onHistory: () => void;
}

export const StepIntro: React.FC<Props> = ({ onNext, onHistory }) => {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-10 skew-y-3 transform origin-top-left pointer-events-none"></div>
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {/* Main Scrollable Area */}
      <div className="relative z-10 flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6 md:px-6 md:py-8 overflow-y-auto scrollbar-hide">
        {/* Top Navigation */}
        <div className="flex justify-end mb-4 flex-shrink-0">
          <button 
            onClick={onHistory}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-all py-2 px-4 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md text-sm font-medium"
          >
            <History className="w-4 h-4" /> 
            历史战绩
          </button>
        </div>

        {/* Intro Text */}
        <div className="text-center mb-6 md:mb-8 animate-slideUp flex-shrink-0">
          <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            告别照本宣科。在这里，你将面对最真实、最棘手的管理挑战。<br className="hidden md:inline"/>
            在一个安全的环境中，打磨你的沟通艺术与领导力。
          </p>
        </div>

        {/* Mission Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8 animate-fadeIn delay-100 transform hover:scale-[1.01] transition-transform duration-300 flex-shrink-0">
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
            <h3 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              本次核心任务
            </h3>
            <span className="text-slate-400 text-xs md:text-sm font-medium">Mission Briefing</span>
          </div>
          
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
             <div className="space-y-6">
                <div>
                   <h4 className="text-slate-500 text-xs md:text-sm font-semibold uppercase tracking-wider mb-2">情境设定</h4>
                   <p className="text-slate-800 text-base md:text-lg font-medium leading-relaxed">
                     你需要与一名绩效被评定为 <span className="text-red-600 font-bold px-1 bg-red-50 rounded">C (不合格)</span> 的员工进行面谈。
                     该员工可能存在抵触、沉默或情绪化反应。
                   </p>
                </div>
                <div>
                   <h4 className="text-slate-500 text-xs md:text-sm font-semibold uppercase tracking-wider mb-3">通关条件</h4>
                   <ul className="space-y-3">
                     <li className="flex items-start gap-3">
                       <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                       <span className="text-slate-700 text-sm md:text-base">准确、坚定地传达 C 类绩效结果，不回避问题。</span>
                     </li>
                     <li className="flex items-start gap-3">
                       <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-green-500 flex-shrink-0 mt-0.5" />
                       <span className="text-slate-700 text-sm md:text-base">引导员工从情绪对抗转为理性接受，并<b>达成改进共识</b>。</span>
                     </li>
                   </ul>
                </div>
             </div>

             <div className="bg-slate-50 rounded-xl p-5 md:p-6 border border-slate-100 relative">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded shadow-sm rotate-12">
                  CHALLENGE
                </div>
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  你将获得
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                     <span className="text-slate-600">情绪对抗模拟</span>
                     <span className="font-semibold text-slate-900">100% 真实</span>
                  </div>
                   <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-full"></div>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-slate-600">实时语音互动</span>
                     <span className="font-semibold text-slate-900">支持</span>
                  </div>
                   <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full w-full"></div>
                   </div>
                   <div className="flex items-center justify-between text-sm">
                     <span className="text-slate-600">多维度能力评估报告</span>
                     <span className="font-semibold text-slate-900">包含</span>
                  </div>
                   <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full w-full"></div>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pb-8 animate-slideUp delay-200 flex-shrink-0 mt-auto">
          <button
            onClick={onNext}
            className="group relative inline-flex items-center justify-center px-6 py-4 md:px-8 md:py-5 text-base md:text-lg font-bold text-white transition-all duration-200 bg-slate-900 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 hover:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 w-full md:w-auto"
          >
            <span className="mr-3">接受挑战 · 设定画像</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            <div className="absolute -inset-3 rounded-full border border-slate-200 opacity-20 group-hover:opacity-40 animate-pulse"></div>
          </button>
        </div>
        
        <p className="text-center text-slate-400 text-xs md:text-sm pb-4">
           支持麦克风语音输入 • 请在安静环境下使用
        </p>
      </div>
    </div>
  );
};