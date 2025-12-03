
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, Calendar, User, ChevronRight, FileText } from 'lucide-react';
import { SavedSession } from '../types';
import { getSavedSessions, deleteSession } from '../services/storage';

interface Props {
  onBack: () => void;
  onViewSession: (session: SavedSession) => void;
}

export const StepHistory: React.FC<Props> = ({ onBack, onViewSession }) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  useEffect(() => {
    setSessions(getSavedSessions());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("确定要删除这条记录吗？")) {
      deleteSession(id);
      setSessions(getSavedSessions());
    }
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <h2 className="text-2xl font-bold text-slate-800">历史模拟记录</h2>
        <div className="w-16"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex-1 flex flex-col p-6">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
             <Calendar className="w-16 h-16 mb-4 opacity-20" />
             <p>暂无历史记录，快去开始第一次模拟吧！</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-2">
            {sessions.map((session) => (
              <div 
                key={session.id} 
                onClick={() => onViewSession(session)}
                className="group border border-slate-200 rounded-xl p-6 flex items-center hover:shadow-md hover:border-blue-300 transition-all cursor-pointer bg-slate-50 hover:bg-white"
              >
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                     <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-800 text-lg">{session.persona.name}</h3>
                      <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full font-bold">{session.persona.jobTitle}</span>
                   </div>
                   <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(session.date).toLocaleString('zh-CN')}
                   </p>
                </div>

                <div className="flex items-center gap-6">
                   <div className="text-right hidden md:block">
                      <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">性格特征</div>
                      <div className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full inline-block mt-1">
                        {session.persona.personaTag || '自定义'}
                      </div>
                   </div>
                   
                   <button 
                     onClick={(e) => handleDelete(e, session.id)}
                     className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                   
                   <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
