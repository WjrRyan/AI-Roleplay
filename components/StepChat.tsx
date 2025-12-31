import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Mic, StopCircle, RefreshCw, LogOut, Lightbulb, MessageCircle, X, Sparkles, TrendingDown, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Persona, Message, BigFive } from '../types';
import { startRoleplaySession, getCoachHint, getTurnFeedback, generateSpeech, parseSimulationResponse } from '../services/geminiService';
import { Chat } from '@google/genai';
import { Button, Input, Drawer, Avatar, Tooltip, Badge, Spin, Card as AntdCard, Switch, Tag, message as antdMessage, Modal } from 'antd';
import { SoundOutlined, MutedOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const Card = AntdCard as any;

interface Props {
  persona: Persona;
  onFinish: (messages: Message[]) => void;
  onBack: () => void;
}

const BIG_FIVE_LABELS: Record<keyof BigFive, string> = {
  openness: '开放性',
  conscientiousness: '尽责性',
  extraversion: '外向性',
  agreeableness: '宜人性',
  neuroticism: '神经质'
};

export const StepChat: React.FC<Props> = ({ persona, onFinish, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false);
  const [showMobileStats, setShowMobileStats] = useState(false);
  
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
        setIsListening(false);
        if (event.error === 'not-allowed') antdMessage.error("无法访问麦克风");
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
     setTimeout(() => {
        scrollToBottom();
     }, 300);
  };

  // Profile Content Component (Shared between Drawer and Sidebar)
  const ProfileContent = () => (
     <div className="space-y-6">
         {/* Identity */}
         <div className="text-center">
             <Avatar size={80} src={persona.avatarUrl} shape="square" className="rounded-2xl border-4 border-white shadow-md mb-3" />
             {persona.personaTag && (
                <div className="mt-2">
                    <Tag color={
                        persona.personaTag.includes('防御') ? 'orange' :
                        persona.personaTag.includes('争辩') ? 'red' :
                        'blue'
                    }>{persona.personaTag}</Tag>
                </div>
             )}
             <h3 className="text-xl font-bold mt-2">{persona.name}</h3>
             <p className="text-slate-500">{persona.jobTitle} · {persona.yearsOfExperience}年</p>
         </div>

         {/* Performance */}
         <Card size="small" title={<span className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1"><TrendingDown className="w-3 h-3"/> 绩效趋势</span>}>
             <div className="flex items-center gap-2 justify-center">
                 <div className="text-center p-2 bg-slate-50 rounded">
                     <div className="text-xs text-slate-400">上次</div>
                     <div className="font-bold">{persona.lastPerformance}</div>
                 </div>
                 <ArrowRight className="text-slate-300" />
                 <div className="text-center p-2 bg-red-50 rounded border border-red-100">
                     <div className="text-xs text-red-400">本次</div>
                     <div className="font-bold text-red-600">{persona.thisPerformance}</div>
                 </div>
             </div>
         </Card>

         {/* Pain Points */}
         <Card size="small" className="bg-amber-50 border-amber-100">
             <div className="flex items-center gap-2 mb-2 text-amber-700 font-bold text-xs uppercase">
                 <AlertTriangle className="w-3.5 h-3.5" /> 核心痛点
             </div>
             <p className="text-sm text-slate-700">{persona.businessPainPoints}</p>
         </Card>

         {/* Big Five */}
         <div>
            <div className="text-xs font-bold text-slate-400 uppercase mb-2">大五人格</div>
            <div className="flex flex-wrap gap-2">
                {Object.entries(persona.bigFive).map(([key, value]) => (
                    <Tag key={key} color={value === 'High' ? 'blue' : 'default'}>
                        {BIG_FIVE_LABELS[key as keyof BigFive]}: {value === 'High' ? '高' : '低'}
                    </Tag>
                ))}
            </div>
         </div>
     </div>
  );

  return (
    <div className="flex h-full max-w-7xl mx-auto gap-6 p-0 md:p-6 animate-fadeIn">
      
      {/* Mobile Drawer */}
      <Drawer
        placement="bottom"
        onClose={() => setShowMobileStats(false)}
        open={showMobileStats}
        height="85vh"
        title="角色档案"
        styles={{ body: { padding: '24px' } }}
      >
        <ProfileContent />
      </Drawer>

      {/* Desktop Sidebar */}
      <div className="w-80 hidden lg:flex flex-col bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden h-full">
         <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
             <ProfileContent />
         </div>
         <div className="p-5 border-t border-slate-100 bg-slate-50 flex-shrink-0 space-y-4">
             <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                      {audioEnabled ? <SoundOutlined className="text-blue-500"/> : <MutedOutlined />}
                      语音播报
                  </span>
                  <Switch checked={audioEnabled} onChange={setAudioEnabled} />
             </div>
             <Button danger block icon={<LogOut className="w-4 h-4" />} onClick={() => onFinish(messages)}>
                结束并生成报告
             </Button>
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white md:rounded-3xl shadow-none md:shadow-2xl shadow-slate-200/50 border-x-0 md:border md:border-slate-100 overflow-hidden relative h-full">
        {/* Chat Header */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-100 p-3 md:p-4 flex justify-between items-center absolute top-0 left-0 right-0 z-10 shadow-sm">
           <div className="flex items-center gap-2 md:gap-3">
               <Tooltip title="退出并返回">
                   <Button 
                      type="text" 
                      icon={<ArrowLeft className="w-5 h-5 text-slate-600" />} 
                      onClick={() => {
                        Modal.confirm({
                          title: '退出演练',
                          content: '确定要返回角色选择吗？当前对话进度将丢失。',
                          okText: '确定离开',
                          cancelText: '继续演练',
                          okType: 'danger',
                          onOk: onBack,
                          centered: true,
                        });
                      }}
                   />
               </Tooltip>
               <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowMobileStats(true)}>
                   <div className="lg:hidden relative">
                      <Avatar src={persona.avatarUrl} />
                      <Badge status="processing" className="absolute bottom-0 right-0" />
                   </div>
                   <div>
                      <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                        绩效沟通会议
                        {isListening && <Tag color="red" className="animate-pulse m-0 border-0">正在录音...</Tag>}
                      </h2>
                   </div>
               </div>
           </div>
           <div className="lg:hidden">
              <Button danger size="small" onClick={() => onFinish(messages)}>结束</Button>
           </div>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 pt-20 pb-4 bg-slate-50/50 space-y-6 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'system' ? (
                    <div className="w-full flex justify-center my-6">
                        <Tag icon={<RefreshCw className="w-3 h-3 animate-spin mr-1"/>} className="rounded-full px-4 py-1.5 bg-slate-100 border-slate-200 text-slate-500 shadow-sm">
                            {msg.text}
                        </Tag>
                    </div>
                ) : (
                    <div className={`flex gap-3 max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <Avatar 
                        src={msg.role === 'model' ? persona.avatarUrl : undefined} 
                        icon={msg.role === 'user' && <User className="w-4 h-4" />} 
                        className={`flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white'}`}
                        size={40}
                    />
                    
                    <div className={`flex flex-col gap-2 min-w-[150px] md:min-w-[200px] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.role === 'model' && msg.evaluation && (
                            <div className="mb-1 animate-fadeIn">
                                <Tag className="rounded-full px-2 border-0 bg-white/80 backdrop-blur shadow-sm" color={msg.evaluation.includes('负面') ? 'error' : msg.evaluation.includes('正面') ? 'success' : 'default'}>
                                    {msg.evaluation.includes('负面') ? '⚠️' : msg.evaluation.includes('正面') ? '✨' : '👀'} 评价: {msg.evaluation}
                                </Tag>
                            </div>
                        )}

                        <div 
                            className={`relative px-5 py-3 shadow-md text-sm md:text-base whitespace-pre-wrap leading-relaxed transition-all duration-300
                            ${msg.role === 'user' 
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-none shadow-blue-500/20' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-2xl rounded-tl-none shadow-slate-200/50'
                            }`}
                        >
                            {msg.text}
                        </div>

                        {/* Action Buttons */}
                        {msg.role === 'user' && (
                           <div className="flex gap-2 justify-end opacity-90">
                              <Tooltip title="获取 AI 优化建议">
                                <Button 
                                    size="small" 
                                    type="text" 
                                    icon={msg.isAnalyzing && !msg.suggestion && !msg.analysis ? <Spin size="small"/> : <Lightbulb className="w-3.5 h-3.5" />}
                                    onClick={() => handleGetSuggestion(msg)}
                                    disabled={msg.isAnalyzing}
                                    className={`rounded-full px-3 text-xs ${msg.suggestion ? 'text-indigo-600 bg-indigo-50 font-medium' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100'}`}
                                >
                                    建议
                                </Button>
                              </Tooltip>
                              
                              <Tooltip title="分析这句话的心理影响">
                                <Button 
                                    size="small" 
                                    type="text" 
                                    icon={msg.isAnalyzing && !msg.suggestion && !msg.analysis ? <Spin size="small"/> : <MessageCircle className="w-3.5 h-3.5" />}
                                    onClick={() => handleGetFeedback(msg)}
                                    disabled={msg.isAnalyzing}
                                    className={`rounded-full px-3 text-xs ${msg.analysis ? 'text-amber-600 bg-amber-50 font-medium' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'}`}
                                >
                                    分析
                                </Button>
                              </Tooltip>
                           </div>
                        )}
                    </div>
                    </div>
                )}
                </div>

                {(msg.analysis || msg.suggestion) && (
                    <div className={`flex w-full animate-slideUp ${msg.role === 'user' ? 'justify-end' : 'justify-start ml-12 md:ml-14'}`}>
                        <div className={`bg-slate-800 text-slate-200 rounded-2xl p-4 shadow-xl text-sm relative border border-slate-700 max-w-[90%] md:max-w-[85%] ${msg.role === 'user' ? 'mr-12 md:mr-14' : ''}`}>
                             <Button 
                                type="text" 
                                icon={<X className="w-4 h-4 text-slate-400" />} 
                                onClick={() => clearAnalysis(msg.id)}
                                className="absolute top-1 right-1 hover:bg-slate-700"
                             />

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
            <div className="flex justify-start pl-2">
                 <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-3">
                     <Spin size="small" />
                     <span className="text-slate-500 text-sm">对方正在思考...</span>
                 </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 z-20 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex gap-3 items-end bg-slate-100 p-2 rounded-[26px] border border-slate-200 focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all shadow-inner">
            <div className="flex-1 relative">
                <TextArea
                    value={inputText}
                    disabled={isLoading || isListening}
                    onFocus={handleInputFocus}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder={isListening ? "正在聆听..." : "输入你的回复..."}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    className="text-base py-3 px-4 bg-transparent border-none shadow-none focus:shadow-none focus:bg-transparent resize-none !min-h-[44px]"
                    style={{ fontSize: '16px' }}
                />
            </div>
            
            <Tooltip title={isListening ? "停止录音" : "语音输入"}>
                <Button 
                    type="text"
                    shape="circle"
                    size="large"
                    icon={isListening ? <StopCircle className="w-5 h-5 text-red-500" /> : <Mic className="w-5 h-5 text-slate-500" />}
                    onClick={toggleListening}
                    disabled={!browserSupportsSpeech}
                    className={`flex-shrink-0 mb-1 transition-all duration-300 ${
                        isListening 
                        ? 'bg-red-50 shadow-inner ring-2 ring-red-100 scale-105' 
                        : 'bg-white shadow-sm hover:bg-slate-50 hover:text-blue-600'
                    }`}
                />
            </Tooltip>

            <Button 
                type="primary" 
                shape="circle" 
                size="large"
                icon={<Send className="w-5 h-5" />}
                onClick={handleSendMessage}
                disabled={isLoading || !inputText.trim() || isListening}
                className={`flex-shrink-0 mb-1 shadow-md shadow-blue-500/30 transition-transform ${inputText.trim() ? 'scale-100' : 'scale-90 opacity-80'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};