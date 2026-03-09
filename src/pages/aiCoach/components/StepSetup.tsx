import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Briefcase, BrainCircuit, FileCode, Check, Bookmark, Sparkles, UserPlus, User as UserIcon } from 'lucide-react';
import { Persona, BigFive } from '../types';
import { PERSONALITY_PRESETS, PersonalityPreset, TEMPLATES } from '../constants';
import { generateSystemInstruction } from '../utils/geminiService';
import { saveCustomPersona, getCustomPersonas, deleteCustomPersona } from '../utils/storage';
import { Button, Card as AntdCard, Tabs, Form, Input, Select, Radio, Tag, Modal, Avatar, Row, Col, Typography, message, Empty, Space } from 'antd';
import { PlayCircleOutlined, DeleteOutlined, ArrowLeftOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const Card = AntdCard as any;

interface Props {
  onStart: (persona: Persona) => void;
  onBack: () => void;
}

export const StepSetup: React.FC<Props> = ({ onStart, onBack }) => {

  const [activeTab, setActiveTab] = useState<string>('template');
  const [viewMode, setViewMode] = useState<'form' | 'preview'>('form');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [myPersonas, setMyPersonas] = useState<Persona[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('pleaser'); // Default selection
  const [form] = Form.useForm();
  
  // Initial state for create form
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
    bigFive: PERSONALITY_PRESETS.find(p => p.id === 'pleaser')!.bigFive
  });

  useEffect(() => {
    setMyPersonas(getCustomPersonas());
  }, []);

  const handleStartTemplate = (template: Persona) => {
    onStart(template);
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个自定义角色吗？此操作无法撤销。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        deleteCustomPersona(id);
        setMyPersonas(getCustomPersonas());
        message.success('角色已删除');
      }
    });
  };

  const handlePresetSelect = (preset: PersonalityPreset) => {
      setSelectedPresetId(preset.id);
      form.setFieldsValue({ bigFive: preset.bigFive });
  };

  const generatePreview = async () => {
    try {
        await (form as any).validateFields();
        const values = (form as any).getFieldsValue();
        
        // 1. Assign Avatar based on gender
        const randomId = Math.floor(Math.random() * 99);
        const avatarUrl = `https://randomuser.me/api/portraits/${values.gender === 'Male' ? 'men' : 'women'}/${randomId}.jpg`;
        
        // 2. Assign Voice based on gender
        const voiceName = values.gender === 'Male' ? 'Fenrir' : 'Kore';

        const finalPersona: Persona = {
            ...customPersona, 
            ...values,
            // bigFive is already in values
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
    } catch (error) {
        console.error(error);
        message.error('请填写所有必填信息');
    }
  };

  const handleConfirmStart = () => {
    saveCustomPersona(customPersona);
    setMyPersonas(getCustomPersonas());
    message.success('角色已保存并开始');
    onStart(customPersona);
  };

  // Re-designed Card based on screenshot
  const renderPersonaCard = (p: Persona, isCustom: boolean = false) => (
    <div 
        key={p.id || p.name}
        className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden cursor-pointer"
        onClick={() => handleStartTemplate(p)}
    >
        {/* Delete Button for Custom */}
        {isCustom && (
            <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />} 
                className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteCustom(e, p.id!)}
            />
        )}

        {/* Card Body */}
        <div className="p-6 pb-2 flex-1 flex flex-col">
            
            {/* Header: Name Right, Info Left/Below */}
            <div className="flex justify-between items-start mb-4">
                {/* Left Side: Avatar or Tags */}
                 <div className="flex flex-col gap-2 pt-1">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium text-slate-600">
                             <UserIcon className="w-3 h-3" />
                             {p.yearsOfExperience}年工龄
                        </div>
                        {p.personaTag && (
                            <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                                p.personaTag.includes('防御') ? 'bg-orange-50 text-orange-600' :
                                p.personaTag.includes('争辩') ? 'bg-red-50 text-red-600' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                                {p.personaTag}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Name & Title */}
                <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900 mb-1 leading-none">{p.name}</div>
                    <div className="flex items-center justify-end gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${p.gender === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                            {p.gender === 'Male' ? '男' : '女'}
                        </span>
                        <span className="text-sm text-slate-500">{p.jobTitle}</span>
                    </div>
                </div>
            </div>

            {/* Pain Points Box */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 flex-1">
                <div className="text-xs text-slate-400 mb-2 font-medium">核心痛点</div>
                <p className="text-sm text-slate-700 leading-relaxed mb-0 line-clamp-4">
                    {p.businessPainPoints}
                </p>
            </div>
        </div>

        {/* Footer: Start Button */}
        <div className="py-4 border-t border-slate-50 flex items-center justify-center text-slate-800 font-medium group-hover:text-blue-600 transition-colors bg-white">
            <PlayCircleOutlined className="mr-2 text-lg" />
            开始
        </div>
    </div>
  );

  if (viewMode === 'preview') {
    return (
        <div className="h-full flex flex-col max-w-4xl mx-auto p-4 md:p-6 animate-fadeIn pb-safe-bottom">
             <div className="flex items-center justify-between mb-4">
                <Button icon={<ArrowLeftOutlined />} onClick={() => setViewMode('form')}>返回修改</Button>
                <Title level={4} style={{ margin: 0 }}>角色设定预览</Title>
                <div className="w-20"></div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-slate-200" bodyStyle={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0 }}>
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-6">
                     <Avatar size={80} src={customPersona.avatarUrl} shape="square" className="rounded-2xl border-2 border-white shadow-md" />
                     <div>
                        <Title level={3} style={{ marginBottom: 4 }}>
                            {customPersona.name} 
                            <Tag color="purple" className="ml-2 text-sm align-middle">自定义</Tag>
                        </Title>
                        <Text type="secondary">{customPersona.jobTitle} · 工龄 {customPersona.yearsOfExperience} 年</Text>
                     </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-4 z-10">
                        <Tag icon={<FileCode className="w-3 h-3 mr-1" />}>System Prompt</Tag>
                    </div>
                    <TextArea 
                        readOnly 
                        className="w-full h-full resize-none p-6 font-mono text-xs md:text-sm text-slate-600 border-none focus:shadow-none"
                        value={generatedPrompt}
                        style={{ height: '100%' }}
                    />
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <Button 
                        type="primary" 
                        size="large" 
                        block 
                        icon={<Check className="w-4 h-4" />}
                        onClick={handleConfirmStart}
                        className="h-12 text-lg font-bold"
                    >
                        保存并开始演练
                    </Button>
                </div>
            </Card>
        </div>
    );
  }

  const items = [
    {
      key: 'template',
      label: (<span><Sparkles className="w-4 h-4 inline mr-1" /> 推荐案例</span>),
      children: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pb-6">
            {TEMPLATES.map(t => renderPersonaCard(t))}
        </div>
      ),
    },
    {
      key: 'custom',
      label: (<span><Bookmark className="w-4 h-4 inline mr-1" /> 我的角色</span>),
      children: (
        <div className="h-full">
            {myPersonas.length === 0 ? (
                 <Empty description="暂无自定义角色" className="py-20">
                     <Button type="primary" onClick={() => setActiveTab('create')}>去创建一个</Button>
                 </Empty>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pb-6">
                    {myPersonas.map(t => renderPersonaCard(t, true))}
                </div>
            )}
        </div>
      ),
    },
    {
      key: 'create',
      label: (<span><UserPlus className="w-4 h-4 inline mr-1" /> 新建角色</span>),
      children: (
        <div className="max-w-4xl mx-auto pb-10 px-1 md:px-0">
           <Form 
                form={form} 
                layout="vertical" 
                initialValues={customPersona}
                onFinish={generatePreview}
                className="space-y-6"
           >
              <Card title={<><Briefcase className="w-4 h-4 inline mr-2 text-blue-500" />基本信息</>} className="shadow-sm">
                  <Row gutter={16}>
                      <Col xs={12} md={12}>
                          <Form.Item name="name" label="角色姓名" rules={[{ required: true }]}>
                              <Input placeholder="例如：李明" />
                          </Form.Item>
                      </Col>
                      <Col xs={12} md={12}>
                          <Form.Item name="gender" label="性别" rules={[{ required: true }]}>
                              <Radio.Group className="w-full flex">
                                  <Radio.Button value="Male" className="flex-1 text-center text-sm md:text-base"><ManOutlined className="mr-1"/>男</Radio.Button>
                                  <Radio.Button value="Female" className="flex-1 text-center text-sm md:text-base"><WomanOutlined className="mr-1"/>女</Radio.Button>
                              </Radio.Group>
                          </Form.Item>
                      </Col>
                  </Row>
                  <Row gutter={16}>
                      <Col xs={12} md={12}>
                          <Form.Item name="jobTitle" label="职位名称" rules={[{ required: true }]}>
                              <Input placeholder="例如：高级开发" />
                          </Form.Item>
                      </Col>
                      <Col xs={12} md={12}>
                          <Form.Item name="yearsOfExperience" label="工龄 (年)" rules={[{ required: true }]}>
                              <Input type="number" step={0.5} placeholder="例如：3.5" />
                          </Form.Item>
                      </Col>
                  </Row>
                  <Row gutter={16}>
                      <Col xs={12} md={12}>
                          <Form.Item name="lastPerformance" label="上次绩效">
                              <Select options={[
                                  { value: "A", label: "A (优秀)" },
                                  { value: "B+", label: "B+ (良好)" },
                                  { value: "B", label: "B (合格)" },
                                  { value: "C", label: "C (不合格)" }
                              ]} />
                          </Form.Item>
                      </Col>
                      <Col xs={12} md={12}>
                          <Form.Item name="thisPerformance" label="本次绩效">
                              <Select options={[
                                  { value: "C", label: "C (不合格)" },
                                  { value: "D", label: "D (淘汰)" },
                                  { value: "B", label: "B (合格-模拟)" }
                              ]} />
                          </Form.Item>
                      </Col>
                  </Row>
                  
                  <Form.Item name="description" label="工作内容描述" rules={[{ required: true }]}>
                      <TextArea rows={2} placeholder="简述该员工的主要职责..." />
                  </Form.Item>

                  <Form.Item 
                    name="businessPainPoints" 
                    label={<span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-4 h-4" /> 业务痛点 / 绩效问题</span>} 
                    rules={[{ required: true }]}
                  >
                      <TextArea rows={3} placeholder="请详细描述具体的绩效问题..." className="bg-amber-50 border-amber-200" />
                  </Form.Item>
              </Card>

              <Card title={<><BrainCircuit className="w-4 h-4 inline mr-2 text-purple-600" />性格特征预设</>} className="shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PERSONALITY_PRESETS.map((preset) => (
                          <div 
                             key={preset.id}
                             onClick={() => handlePresetSelect(preset)}
                             className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md relative overflow-hidden ${
                                 selectedPresetId === preset.id 
                                 ? 'border-purple-500 bg-purple-50' 
                                 : 'border-slate-100 hover:border-purple-200 bg-white'
                             }`}
                          >
                              {selectedPresetId === preset.id && (
                                  <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                                      已选择
                                  </div>
                              )}
                              <div className={`font-bold mb-1 ${selectedPresetId === preset.id ? 'text-purple-700' : 'text-slate-800'}`}>
                                  {preset.name}
                              </div>
                              <div className="text-xs text-slate-500 leading-relaxed">
                                  {preset.description}
                              </div>
                          </div>
                      ))}
                  </div>
                  
                  {/* Hidden form item to track value for submission */}
                  <Form.Item name="bigFive" hidden rules={[{ required: true }]}>
                      <Input />
                  </Form.Item>
              </Card>

              <Button type="primary" htmlType="submit" size="large" block icon={<FileCode className="w-4 h-4" />} className="h-12 text-lg">
                  预览角色设定
              </Button>
           </Form>
        </div>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto p-4 md:p-6 animate-fadeIn pb-safe-bottom overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 md:mb-4 flex-shrink-0">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>返回首页</Button>
        <div className="text-center">
            <Title level={3} style={{ marginBottom: 0 }} className="text-lg md:text-2xl">设定挑战对象</Title>
        </div>
        <div className="w-24"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
         <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={items} 
            centered 
            size="large"
            tabBarStyle={{ backgroundColor: '#fff', margin: 0, padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}
            className="flex-1 flex flex-col overflow-hidden [&_.ant-tabs-content]:flex-1 [&_.ant-tabs-content]:overflow-y-auto [&_.ant-tabs-content]:p-4 md:[&_.ant-tabs-content]:p-6 [&_.ant-tabs-tabpane]:h-full"
         />
      </div>
    </div>
  );
};