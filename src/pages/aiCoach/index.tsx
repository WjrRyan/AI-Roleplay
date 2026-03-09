import React, { useState } from 'react';
import { AppStep } from './constants';
import { Persona, Message, SavedSession, FeedbackReport } from './types';
import { AIAssistantView } from './components/AIAssistantView';
import { StepIntro } from './components/StepIntro';
import { StepSetup } from './components/StepSetup';
import { StepChat } from './components/StepChat';
import { StepReport } from './components/StepReport';
import { StepHistory } from './components/StepHistory';

/**
 * AI 绩效陪练页面
 * 包含完整的陪练流程：助手入口 -> 介绍 -> 设置 -> 聊天 -> 报告 -> 历史
 */
const AiCoachPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.ASSISTANT);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [sessionReport, setSessionReport] = useState<FeedbackReport | undefined>(undefined);
  const [sessionNps, setSessionNps] = useState<number | undefined>(undefined);

  // 流程处理函数
  const handleStartIntro = () => {
    setCurrentStep(AppStep.INTRO);
  };

  const handleStartSetup = () => {
    setCurrentStep(AppStep.SETUP);
  };

  const handleStartChat = (persona: Persona) => {
    setSelectedPersona(persona);
    setSessionReport(undefined); // Reset previous report
    setSessionNps(undefined);
    setCurrentStep(AppStep.CHAT);
  };

  const handleFinishChat = (messages: Message[]) => {
    setSessionMessages(messages);
    setCurrentStep(AppStep.REPORT);
  };

  const handleRestart = () => {
    setSelectedPersona(null);
    setSessionMessages([]);
    setSessionReport(undefined);
    setSessionNps(undefined);
    setCurrentStep(AppStep.INTRO);
  };

  const handleBackToIntro = () => {
    setCurrentStep(AppStep.INTRO);
  };

  const handleBackToSetup = () => {
    setCurrentStep(AppStep.SETUP);
  };
  
  const handleGoToHistory = () => {
    setCurrentStep(AppStep.HISTORY);
  };

  const handleViewHistorySession = (session: SavedSession) => {
    setSelectedPersona(session.persona);
    setSessionMessages(session.messages);
    setSessionReport(session.report);
    setSessionNps(session.nps);
    setCurrentStep(AppStep.REPORT);
  };

  return (
    <div className="h-[100dvh] w-screen bg-white flex flex-col font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 w-full h-full overflow-hidden relative">
        {currentStep === AppStep.ASSISTANT && (
          <AIAssistantView onNext={handleStartIntro} onHistory={handleGoToHistory} />
        )}

        {currentStep === AppStep.INTRO && (
          <StepIntro onNext={handleStartSetup} onHistory={handleGoToHistory} />
        )}

        {currentStep === AppStep.SETUP && (
          <StepSetup onStart={handleStartChat} onBack={handleBackToIntro} />
        )}

        {currentStep === AppStep.CHAT && selectedPersona && (
          <StepChat 
            persona={selectedPersona} 
            onFinish={handleFinishChat} 
            onBack={handleBackToSetup}
          />
        )}

        {currentStep === AppStep.REPORT && selectedPersona && (
          <StepReport 
             messages={sessionMessages} 
             persona={selectedPersona} 
             onRestart={handleRestart}
             existingReport={sessionReport}
             existingNps={sessionNps}
          />
        )}
        
        {currentStep === AppStep.HISTORY && (
          <StepHistory onBack={handleBackToIntro} onViewSession={handleViewHistorySession} />
        )}
      </main>
    </div>
  );
};

export default AiCoachPage;
