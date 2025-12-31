import React from 'react';
import { Target, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { Button, Card as AntdCard, Typography, Space, Badge } from 'antd';
import { HistoryOutlined, ArrowRightOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const Card = AntdCard as any;

interface Props {
  onNext: () => void;
  onHistory: () => void;
}

export const StepIntro: React.FC<Props> = ({ onNext, onHistory }) => {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-50 to-white overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-10 skew-y-3 transform origin-top-left pointer-events-none"></div>
      
      {/* Main Scrollable Area */}
      <div className="relative z-10 flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 py-6 md:px-6 md:py-8 overflow-y-auto scrollbar-hide">
        {/* Top Navigation */}
        <div className="flex justify-end mb-4 flex-shrink-0">
          <Button 
            icon={<HistoryOutlined />} 
            onClick={onHistory}
            shape="round"
            size="large"
          >
            历史战绩
          </Button>
        </div>

        {/* Intro Text */}
        <div className="text-center mb-6 md:mb-8 animate-slideUp flex-shrink-0">
          <Title level={2} style={{ margin: 0 }}>AI 绩效陪练</Title>
          <Paragraph className="text-slate-500 text-lg mt-2 max-w-2xl mx-auto">
            告别照本宣科。在这里，你将面对最真实、最棘手的管理挑战。<br className="hidden md:inline"/>
            在一个安全的环境中，打磨你的沟通艺术与领导力。
          </Paragraph>
        </div>

        {/* Mission Card */}
        <Card 
          className="shadow-xl border-slate-200 overflow-hidden mb-8 animate-fadeIn transform hover:scale-[1.01] transition-transform duration-300 flex-shrink-0"
          bodyStyle={{ padding: 0 }}
        >
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
            <div className="text-white font-bold text-base md:text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              本次核心任务
            </div>
            <span className="text-slate-400 text-xs md:text-sm font-medium">Mission Briefing</span>
          </div>
          
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
             <div className="space-y-6">
                <div>
                   <Text type="secondary" strong className="uppercase text-xs tracking-wider block mb-2">情境设定</Text>
                   <Text className="text-lg">
                     你需要与一名绩效被评定为 <Text mark className="bg-red-50 text-red-600 px-1">C (不合格)</Text> 的员工进行面谈。
                     该员工可能存在抵触、沉默或情绪化反应。
                   </Text>
                </div>
                <div>
                   <Text type="secondary" strong className="uppercase text-xs tracking-wider block mb-3">通关条件</Text>
                   <Space direction="vertical" size="middle">
                     <div className="flex items-start gap-3">
                       <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                       <span className="text-slate-700">准确、坚定地传达 C 类绩效结果，不回避问题。</span>
                     </div>
                     <div className="flex items-start gap-3">
                       <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                       <span className="text-slate-700">引导员工从情绪对抗转为理性接受，并<b>达成改进共识</b>。</span>
                     </div>
                   </Space>
                </div>
             </div>

             <div className="bg-slate-50 rounded-xl p-5 md:p-6 border border-slate-100 relative">
                <Badge.Ribbon text="CHALLENGE" color="gold">
                  <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2 pt-2">
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
                </Badge.Ribbon>
             </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center pb-8 animate-slideUp delay-200 flex-shrink-0 mt-auto">
          <Button 
            type="primary" 
            size="large" 
            onClick={onNext}
            className="h-14 px-8 text-lg rounded-full shadow-lg hover:scale-105 transition-transform"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
          >
            接受挑战 · 设定画像
          </Button>
        </div>
        
        <Text type="secondary" className="text-center text-xs pb-4">
           支持麦克风语音输入 • 请在安静环境下使用
        </Text>
      </div>
    </div>
  );
};