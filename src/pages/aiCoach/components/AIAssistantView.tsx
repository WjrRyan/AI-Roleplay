import React, { useState } from 'react';
import { Bot, Send, Sparkles, X, MessageSquare, PlayCircle, ArrowUp, MessagesSquare } from 'lucide-react';
import { Button, Input } from 'antd';

interface Props {
  onNext: () => void;
  onHistory: () => void;
}

export const AIAssistantView: React.FC<Props> = ({ onNext, onHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="relative w-full h-full bg-[#F5F7FA] overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Simulated Dashboard Background (Blurred) */}
      <div className="absolute inset-0 z-0 opacity-100 pointer-events-none select-none overflow-hidden bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')] bg-cover bg-center">
         <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
         {/* Top Nav Simulation */}
         <div className="relative h-16 border-b border-slate-200/50 flex items-center px-6 justify-between bg-white/50">
            <div className="flex gap-8 items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg shadow-sm"></div>
                <div className="flex gap-8 text-sm font-medium text-slate-600">
                    <span className="text-slate-900">首页</span>
                    <span>课程</span>
                    <span>考试</span>
                    <span>学习包</span>
                </div>
            </div>
            <div className="flex gap-4 items-center">
                <div className="w-64 h-9 bg-slate-100/50 rounded-full border border-slate-200/50"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
            </div>
         </div>
         {/* Content Simulation */}
         <div className="p-8 max-w-7xl mx-auto relative">
            <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl mb-8 border border-white/50 shadow-sm"></div>
            <div className="grid grid-cols-3 gap-6">
                <div className="h-64 bg-white/60 rounded-xl border border-white/50 shadow-sm"></div>
                <div className="h-64 bg-white/60 rounded-xl border border-white/50 shadow-sm"></div>
                <div className="h-64 bg-white/60 rounded-xl border border-white/50 shadow-sm"></div>
            </div>
         </div>
      </div>

      {/* Floating Action Button (Mascot Style) */}
      {!isOpen && (
        <div className="absolute right-8 bottom-8 z-50 flex flex-col items-end gap-4 animate-bounce-slow">
            {/* Tooltip Bubble */}
            <div 
                className="cursor-pointer relative group"
                onClick={() => setIsOpen(true)}
            >
                <div className="bg-white px-4 py-3 rounded-2xl rounded-br-none shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-blue-50 flex items-center gap-3 transform transition-transform group-hover:-translate-y-1 relative">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-sm font-medium text-slate-700">iHub AI新增了绩效对谈功能，快来体验吧</span>
                    </div>
                    {/* Speech Bubble Tail */}
                    <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white border-b border-r border-blue-50 transform rotate-45"></div>
                </div>
            </div>

            {/* Glowing Mascot Button */}
            <button 
                onClick={() => setIsOpen(true)}
                className="relative w-16 h-16 group"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 via-purple-400 to-pink-400 rounded-full blur opacity-70 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative w-full h-full bg-gradient-to-b from-white to-blue-50 rounded-full shadow-lg flex items-center justify-center border-2 border-white overflow-hidden">
                    <div className="w-full h-full bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-blue-100 via-indigo-100 to-purple-100 opacity-50"></div>
                    <Bot size={32} className="absolute text-slate-700 drop-shadow-sm" />
                    {/* Shine effect */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/80 to-transparent rounded-t-full pointer-events-none"></div>
                </div>
            </button>
        </div>
      )}

      {/* Glass Overlay */}
      {isOpen && (
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-10 transition-opacity duration-300" onClick={() => setIsOpen(false)}></div>
      )}

      {/* Assistant Modal */}
      {isOpen && (
        <div className="absolute right-4 bottom-4 top-20 w-[440px] bg-[#F4F8FF] rounded-[32px] shadow-2xl border border-white/60 flex flex-col z-20 animate-slideUp overflow-hidden font-sans">
            
            {/* Header */}
            <div className="px-6 py-4 flex justify-end items-center bg-transparent z-10">
                <Button 
                    type="text" 
                    shape="circle" 
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                    onClick={() => setIsOpen(false)}
                >
                    <X size={20} />
                </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
                <div className="space-y-6 mt-2">

                    {/* AI Coach Feature Promotion (Moved to Top) */}
                    <div className="relative">
                         <div className="flex items-center gap-2 mb-3 px-1">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">推荐功能</span>
                         </div>
                         
                         <div 
                            className="bg-gradient-to-br from-white to-indigo-50/50 p-1 rounded-[24px] shadow-sm border border-indigo-100 cursor-pointer group hover:shadow-md transition-all duration-300"
                            onClick={onNext}
                         >
                            <div className="bg-white rounded-[20px] p-5 relative overflow-hidden">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-110 transition-transform duration-300">
                                        <MessagesSquare size={20} />
                                    </div>
                                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">NEW</span>
                                </div>
                                
                                <h4 className="font-bold text-slate-800 mb-1">AI 绩效陪练</h4>
                                <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                                    模拟真实管理场景，与 C 类绩效员工进行面谈。
                                </p>

                                <div className="flex items-center text-indigo-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                                    立即开始 <PlayCircle size={12} className="ml-1" />
                                </div>

                                {/* Decorative Elements */}
                                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-indigo-50 rounded-full blur-xl"></div>
                            </div>
                         </div>
                    </div>
                    
                    {/* Greeting Card */}
                    <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-blue-50/50 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">
                                Hi, 我是 iHub AI 助手
                            </h3>
                            <p className="text-slate-600 leading-relaxed text-[15px]">
                                我已经学习了站内公开的课程内容，你可以基于课程和知识点向我提问，比如：
                            </p>
                        </div>
                        {/* Decorative background blob */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-opacity"></div>
                    </div>

                    {/* Suggestion Chips */}
                    <div className="flex flex-wrap gap-2.5">
                        {[
                            "什么是技德合领?",
                            "请推荐一些提升管理能力的课程。",
                            "iHub视频播放可以记录时间节点么?"
                        ].map((text, i) => (
                            <button 
                                key={i}
                                className="px-4 py-2.5 bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1967D2] text-[13px] font-medium rounded-full transition-colors text-left leading-snug"
                            >
                                {text}
                            </button>
                        ))}
                    </div>

                </div>
            </div>

            {/* Bottom Input Area */}
            <div className="p-6 bg-transparent">
                <div className="relative group">
                    <div className="absolute inset-0 bg-white rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"></div>
                    <div className="relative flex items-center p-2 pl-6">
                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="问我想知道的一切"
                            className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 text-[15px]"
                        />
                        <div className="flex items-center gap-3 pr-2">
                            <span className="text-xs text-slate-300 font-medium select-none">
                                {inputValue.length} / 2000
                            </span>
                            <button className="w-10 h-10 bg-[#0f172a] hover:bg-black text-white rounded-full flex items-center justify-center transition-colors shadow-lg shadow-slate-200">
                                <ArrowUp size={20} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="text-center mt-3">
                     <span className="text-[10px] text-slate-400/80 font-medium">AI生成内容仅供参考</span>
                </div>
            </div>

        </div>
      )}
    </div>
  );
};

