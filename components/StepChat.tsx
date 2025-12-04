
import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Volume2, VolumeX, Mic, StopCircle, RefreshCw, LogOut, Lightbulb, MessageCircle, X, Sparkles, Activity, TrendingDown, ArrowRight, BrainCircuit, AlertTriangle } from 'lucide-react';
import { Persona, Message, AcceptanceScores, BigFive } from '../types';
import { startRoleplaySession, getCoachHint, getTurnFeedback, generateSpeech, parseSimulationResponse } from '../services/geminiService';
import { Chat } from '@google/genai';

interface Props {
  persona: Persona;
  onFinish: (messages: Message[]) => void;
}

const BIG_FIVE_LABELS: Record<keyof BigFive, string> = {
  openness: '开放性',
  conscientiousness: '尽责性',
  extraversion: '外向性',
  agreeableness: '宜人性',
  neuroticism: '神经质'
};

export const StepChat: React.FC<Props> = ({ persona, onFinish }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseInputTextRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Check speech support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setBrowserSupportsSpeech(!!SpeechRecognition);

    const session = startRoleplaySession(persona);
    setChatSession(session);
    
    setMessages([
      {
        id: 'init',
        role: 'system',
        text: `场景加载完成。${persona.name} 已进入会议室。目标：传达 C 绩效评级并达成改进计划。`,
        timestamp: new Date()
      }
    ]);

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    return () => {
       if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
           audioContextRef.current.close();
       }
       if (recognitionRef.current) {
           recognitionRef.current.stop();
       }
    };
  }, [persona]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); 

  // Additional delayed scroll for keyboard adjustments
  useEffect(() => {
    const timer = setTimeout(() => {
        scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.map(m => m.analysis || m.suggestion).join('')]); 


  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      
      baseInputTextRef.current = inputText;
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' || event.error === 'aborted') {
            setIsListening(false);
            return;
        }
        console.error("Speech error:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') alert("无法访问麦克风");
      };

      recognition.onresult = (event: any) => {
        let speechTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
           speechTranscript += event.results[i][0].transcript;
        }
        const prefix = baseInputTextRef.current + (baseInputTextRef.current && !baseInputTextRef.current.endsWith(' ') && speechTranscript ? ' ' : '');
        setInputText(prefix + speechTranscript);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const playAudioResponse = async (text: string) => {
    if (!audioEnabled || !audioContextRef.current) return;
    try {
       const buffer = await generateSpeech(text, persona.voiceName || 'Kore');
       if (buffer) {
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          source.start();
       }
    } catch (e) { console.error(e); }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatSession) return;
    
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    
    // Force scroll after user send
    setTimeout(scrollToBottom, 50);

    try {
      const response = await chatSession.sendMessage({ message: userMsg.text });
      const parsed = parseSimulationResponse(response.text);
      
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: parsed.text,
        scores: parsed.scores,
        evaluation: parsed.evaluation,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, modelMsg]);
      
      if (audioEnabled) playAudioResponse(parsed.text);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetSuggestion = async (msg: Message) => {
    if (msg.suggestion || msg.isAnalyzing) return; 
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isAnalyzing: true } : m));
    try {
      const idx = messages.findIndex(m => m.id === msg.id);
      const suggestion = await getCoachHint(messages.slice(0, idx + 1), persona);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isAnalyzing: false, suggestion } : m));
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isAnalyzing: false } : m));
    }
  };

  const handleGetFeedback = async (msg: Message) => {
    if (msg.analysis || msg.isAnalyzing) return;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isAnalyzing: true } : m));
    try {
      const idx = messages.findIndex(m => m.id === msg.id);
      const analysis = await getTurnFeedback(messages.slice(0, idx + 1), persona);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isAnalyzing: false, analysis } : m));
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isAnalyzing: false } : m));
    }
  };

  const clearAnalysis = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, analysis: undefined, suggestion: undefined } : m));
  };

  // Handler for mobile input focus to scroll view
  const handleInputFocus = () => {
     // Small delay to allow keyboard to pop up and resize viewport
     setTimeout(() => {
        scrollToBottom();
        // window.scrollTo(0, document.body.scrollHeight);
     }, 300);
  };

  // Mobile status drawer
  const [showMobileStats, setShowMobileStats] = useState(false);

  return (
    <div className="flex h-full max-w-7xl mx-auto gap-6 p-0 md:p-6 animate-fadeIn">
      {/* Mobile Stats Drawer (Overlay) */}
      {showMobileStats && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowMobileStats(false)}>
           <div className="absolute top-0 left-0 w-full bg-white rounded-b-3xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
               <div className="flex items-center gap-4 mb-6">
                 <img src={persona.avatarUrl} className="w-16 h-16 rounded-full border-2 border-slate-100" />
                 <div>
                    <h3 className="font-bold text-lg">{persona.name}</h3>
                    <p className="text-sm text-slate-500">{persona.jobTitle}</p>
                 </div>
               </div>
               
               {/* Mobile Details */}
               <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="text-xs text-slate-400 uppercase font-bold mb-2">绩效变动</div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 text-center bg-white p-2 rounded-lg border border-slate-100">
                            <span className="text-xs text-slate-400 block">上次</span>
                            <span className="font-bold text-slate-700">{persona.lastPerformance}</span>
                        </div>
                        <ArrowRight className="text-slate-300 w-4 h-4" />
                        <div className="flex-1 text-center bg-white p-2 rounded-lg border border-red-100">
                            <span className="text-xs text-red-400 block">本次</span>
                            <span className="font-bold text-red-600">{persona.thisPerformance}</span>
                        </div>
                      </div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold text-xs uppercase">
                         <AlertTriangle className="w-3.5 h-3.5" /> 核心痛点
                      </div>
                      <p className="text-sm text-slate-700">{persona.businessPainPoints}</p>
                  </div>
               </div>

               <button onClick={() => setShowMobileStats(false)} className="mt-6 w-full py-3 bg-slate-100 rounded-xl font-bold">关闭</button>
           </div>
        </div>
      )}

      {/* Sidebar - Holographic Profile (Merged Card) */}
      <div className="w-80 hidden lg:flex flex-col bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden h-full">
         
         {/* 1. Header & Identity */}
         <div className="relative p-6 text-center border-b border-slate-50 flex-shrink-0">
             <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-blue-50 to-white z-0"></div>
             <div className="relative z-10">
                <div className="relative inline-block">
                    <img src={persona.avatarUrl} alt={persona.name} className="w-20 h-20 rounded-2xl border-4 border-white shadow-md object-cover mb-3" />
                    {persona.personaTag && (
                        <div className={`absolute -bottom-1 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold border-2 border-white ${
                            persona.personaTag.includes('防御') ? 'bg-orange-500 text-white' :
                            persona.personaTag.includes('沉默') ? 'bg-slate-500 text-white' :
                            persona.personaTag.includes('争辩') ? 'bg-red-500 text-white' :
                            'bg-blue-500 text-white'
                        }`}>
                            {persona.personaTag}
                        </div>
                    )}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{persona.name}</h3>
                <p className="text-sm font-medium text-slate-500">{persona.jobTitle}</p>
                <p className="text-xs text-slate-400 mt-1">工龄 {persona.yearsOfExperience} 年</p>
             </div>
         </div>

         {/* 2. Scrollable Details */}
         <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
             
             {/* Performance Trend */}
             <div>
                 <div className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                     <TrendingDown className="w-3 h-3" /> 绩效趋势
                 </div>
                 <div className="flex items-center gap-2">
                     <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                         <div className="text-[10px] text-slate-400 uppercase">Last Year</div>
                         <div className="text-lg font-bold text-slate-700">{persona.lastPerformance}</div>
                     </div>
                     <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                     <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-3 text-center relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-bl-lg"></div>
                         <div className="text-[10px] text-red-400 uppercase">Current</div>
                         <div className="text-lg font-bold text-red-600">{persona.thisPerformance}</div>
                     </div>
                 </div>
             </div>

             {/* Pain Points */}
             <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 relative">
                 <div className="flex items-center gap-2 mb-2">
                     <AlertTriangle className="w-4 h-4 text-amber-500" />
                     <span className="text-xs font-bold text-amber-700 uppercase">核心业务痛点</span>
                 </div>
                 <p className="text-sm text-slate-700 leading-relaxed">
                     {persona.businessPainPoints}
                 </p>
             </div>

             {/* Personality Radar */}
             <div>
                <div className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                     <BrainCircuit className="w-3 h-3" /> 大五人格特征
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(persona.bigFive).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-100">
                            <span className="text-xs text-slate-600">{BIG_FIVE_LABELS[key as keyof BigFive]}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                value === 'High' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {value === 'High' ? '高' : '低'}
                            </span>
                        </div>
                    ))}
                </div>
             </div>
         </div>

         {/* 3. Action Footer */}
         <div className="p-5 border-t border-slate-100 bg-slate-50 flex-shrink-0 space-y-3">
             <div className="flex items-center justify-between text-sm text-slate-500 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <span className="flex items-center gap-2 font-medium">
                      {audioEnabled ? <Volume2 className="w-4 h-4 text-blue-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      语音播报
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={audioEnabled} onChange={() => setAudioEnabled(!audioEnabled)} />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
             </div>
             
             <button 
                onClick={() => onFinish(messages)} 
                className="w-full py-3.5 border border-red-200 bg-white text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <LogOut className="w-4 h-4" /> 结束并生成报告
              </button>
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white md:rounded-3xl shadow-none md:shadow-2xl shadow-slate-200/50 border-x-0 md:border md:border-slate-100 overflow-hidden relative h-full">
        {/* Chat Header */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center absolute top-0 left-0 right-0 z-10 shadow-sm">
           <div className="flex items-center gap-3" onClick={() => setShowMobileStats(true)}>
               <div className="lg:hidden relative">
                  <img src={persona.avatarUrl} className="w-10 h-10 rounded-full border border-slate-200" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
               </div>
               <div>
                  <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                    绩效沟通会议
                    <span className="flex h-2 w-2 relative">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isListening ? 'bg-red-400' : 'bg-green-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isListening ? 'bg-red-500' : 'bg-green-500'}`}></span>
                    </span>
                    {isListening && <span className="text-xs text-red-500 animate-pulse font-normal">正在录音...</span>}
                  </h2>
                  <p className="text-xs text-slate-500 hidden md:block">目标：{persona.name} 接受 C 评级并承诺改进</p>
               </div>
           </div>
           <div className="flex gap-2 lg:hidden">
              <button onClick={() => onFinish(messages)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                结束
              </button>
           </div>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 pt-20 pb-4 bg-slate-50 space-y-6 md:space-y-8 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'system' ? (
                    <div className="w-full flex justify-center my-6">
                    <span className="bg-slate-200/50 backdrop-blur-sm text-slate-600 text-xs px-4 py-1.5 rounded-full font-medium flex items-center gap-1 text-center">
                        <RefreshCw className="w-3 h-3 inline" /> {msg.text}
                    </span>
                    </div>
                ) : (
                    <div className={`flex gap-2 md:gap-3 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden border-2 border-white
                        ${msg.role === 'user' ? 'bg-slate-900' : 'bg-white'}`}>
                        {msg.role === 'user' ? <User className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <img src={persona.avatarUrl} className="w-full h-full object-cover"/>}
                    </div>
                    
                    <div className={`flex flex-col gap-2 min-w-[150px] md:min-w-[200px] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role === 'model' && msg.evaluation && (
                            <div className="flex items-center gap-2 mb-1 animate-fadeIn">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    ['火上浇油', '雪上加霜', '引爆炸药', '极度尴尬'].some(k => msg.evaluation?.includes(k)) 
                                    ? 'bg-red-50 text-red-600 border-red-100' 
                                    : ['拨云见日', '情绪共鸣', '点醒梦中人', '一锤定音'].some(k => msg.evaluation?.includes(k))
                                    ? 'bg-green-50 text-green-600 border-green-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                    {msg.evaluation.includes('负面') ? '⚠️' : msg.evaluation.includes('正面') ? '✨' : '👀'} 你的上一句: {msg.evaluation}
                                </span>
                            </div>
                        )}

                        <div className={`group relative p-3 md:p-4 text-base md:text-sm leading-relaxed shadow-sm transition-all text-left
                            ${msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none hover:shadow-md' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none hover:shadow-md'
                            }`}>
                            {msg.text}
                        </div>

                        {/* Action Buttons - Moved to User Bubble */}
                        {msg.role === 'user' && (
                           <div className="flex gap-2 animate-fadeIn justify-end">
                              <button 
                                onClick={() => handleGetSuggestion(msg)}
                                disabled={msg.isAnalyzing}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-transparent
                                    ${msg.suggestion 
                                        ? 'bg-indigo-100 text-indigo-700' 
                                        : 'bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 shadow-sm'
                                    }`}
                              >
                                {msg.isAnalyzing && !msg.suggestion && !msg.analysis ? (
                                    <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full"></span>
                                ) : (
                                    <Lightbulb className="w-3.5 h-3.5" />
                                )}
                                <span className="hidden md:inline">优化建议</span><span className="md:hidden">建议</span>
                              </button>
                              
                              <button 
                                onClick={() => handleGetFeedback(msg)}
                                disabled={msg.isAnalyzing}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border border-transparent
                                    ${msg.analysis 
                                        ? 'bg-amber-100 text-amber-700' 
                                        : 'bg-white text-slate-500 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-100 shadow-sm'
                                    }`}
                              >
                                 <MessageCircle className="w-3.5 h-3.5" />
                                 <span className="hidden md:inline">分析这句</span><span className="md:hidden">分析</span>
                              </button>
                           </div>
                        )}
                    </div>
                    </div>
                )}
                </div>

                {(msg.analysis || msg.suggestion) && (
                    <div className={`flex w-full animate-slideUp ${msg.role === 'user' ? 'justify-end' : 'justify-start ml-12 md:ml-14'}`}>
                        <div className={`bg-slate-800 text-slate-200 rounded-2xl p-4 shadow-xl text-sm relative border border-slate-700 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'mr-12 md:mr-14' : ''}`}>
                             <button 
                                onClick={() => clearAnalysis(msg.id)}
                                className="absolute top-2 right-2 p-1 text-slate-500 hover:text-white rounded-full hover:bg-slate-700 transition-colors"
                             >
                                <X className="w-4 h-4" />
                             </button>

                             {msg.suggestion && (
                                <div className="mb-4 last:mb-0">
                                    <h5 className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
                                        <Sparkles className="w-4 h-4" /> 建议优化方向
                                    </h5>
                                    <div className="space-y-1 text-slate-300 whitespace-pre-line pl-2 border-l-2 border-indigo-500/30">
                                        {msg.suggestion}
                                    </div>
                                </div>
                             )}

                             {msg.analysis && (
                                <div className="last:mb-0">
                                    <h5 className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
                                        <MessageCircle className="w-4 h-4" /> 话术分析
                                    </h5>
                                    <div className="space-y-1 text-slate-300 whitespace-pre-line pl-2 border-l-2 border-amber-500/30">
                                        {msg.analysis}
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>
                )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
               <div className="flex gap-3 max-w-[70%]">
                 <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                    <img src={persona.avatarUrl} className="w-full h-full object-cover opacity-80"/>
                 </div>
                 <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1.5 h-10 md:h-12">
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                     <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                 </div>
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Optimized for Mobile Keyboard */}
        <div className="p-3 md:p-6 bg-white border-t border-slate-100 z-20 flex-shrink-0">
          {isListening && <div className="text-center text-xs text-red-500 mb-2 font-bold animate-pulse">正在录音中... 请说话</div>}
          <div className="flex gap-2 md:gap-3 items-end">
            <div className={`flex-1 relative bg-slate-100 rounded-2xl border transition-all ${isListening ? 'border-red-500 ring-2 ring-red-100 bg-red-50' : 'border-transparent focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10'}`}>
                <textarea
                    rows={1}
                    value={inputText}
                    disabled={isLoading || isListening}
                    onFocus={handleInputFocus}
                    onChange={(e) => {
                       setInputText(e.target.value);
                       // Auto-grow height slightly
                       e.target.style.height = 'auto';
                       e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder={isListening ? "正在聆听..." : "输入你的回复 (按 Enter 发送)..."}
                    className="w-full bg-transparent border-0 px-3 py-3 md:px-4 md:py-3.5 focus:ring-0 outline-none resize-none min-h-[50px] md:min-h-[60px] max-h-[120px] leading-relaxed disabled:opacity-70 disabled:cursor-not-allowed text-base"
                    style={{ fontSize: '16px' }} // Prevent iOS zoom
                />
                
                <div className="absolute right-2 bottom-2 group">
                   <button 
                      onClick={toggleListening}
                      disabled={!browserSupportsSpeech}
                      className={`p-1.5 md:p-2 rounded-lg transition-all ${
                          !browserSupportsSpeech ? 'opacity-30 cursor-not-allowed' :
                          isListening 
                          ? 'bg-red-500 text-white shadow-lg animate-pulse scale-110' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
                      }`}
                   >
                     {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                   </button>
                </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim() || isListening}
              className={`mb-1 p-3 md:p-3.5 rounded-xl transition-all shadow-md flex items-center justify-center ${
                isLoading || !inputText.trim() || isListening
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg'
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
