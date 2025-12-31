import React, { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, Calendar, FileText } from 'lucide-react';
import { SavedSession } from '../types';
import { getSavedSessions, deleteSession } from '../services/storage';
import { Button, List, Typography, Popconfirm, Tag, Empty } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Props {
  onBack: () => void;
  onViewSession: (session: SavedSession) => void;
}

export const StepHistory: React.FC<Props> = ({ onBack, onViewSession }) => {
  const [sessions, setSessions] = useState<SavedSession[]>([]);

  useEffect(() => {
    setSessions(getSavedSessions());
  }, []);

  const handleDelete = (id: string) => {
      deleteSession(id);
      setSessions(getSavedSessions());
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <Button type="text" icon={<LeftOutlined />} onClick={onBack}>返回</Button>
        <Title level={3} style={{ margin: 0 }}>历史模拟记录</Title>
        <div className="w-16"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex-1 flex flex-col">
        {sessions.length === 0 ? (
           <Empty description="暂无历史记录" className="my-auto" />
        ) : (
          <div className="overflow-y-auto h-full p-4">
              <List
                itemLayout="horizontal"
                dataSource={sessions}
                renderItem={(session: SavedSession) => (
                    <List.Item
                        className="hover:bg-slate-50 transition-colors rounded-xl p-4 cursor-pointer border-b border-slate-100 last:border-0"
                        onClick={() => onViewSession(session)}
                        actions={[
                            <div onClick={e => e.stopPropagation()}>
                                <Popconfirm
                                    title="删除记录"
                                    description="确定要删除这条模拟记录吗？"
                                    onConfirm={() => handleDelete(session.id)}
                                    okText="删除"
                                    cancelText="取消"
                                    okType="danger"
                                >
                                    <Button type="text" danger icon={<Trash2 className="w-4 h-4" />} />
                                </Popconfirm>
                            </div>
                        ]}
                    >
                        <List.Item.Meta
                            avatar={
                                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <FileText className="w-6 h-6" />
                                </div>
                            }
                            title={
                                <div className="flex items-center gap-2">
                                    <Text strong className="text-lg">{session.persona.name}</Text>
                                    <Tag>{session.persona.jobTitle}</Tag>
                                </div>
                            }
                            description={
                                <div className="flex items-center gap-2 mt-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    <Text type="secondary" className="text-xs">
                                        {dayjs(session.date).format('YYYY年MM月DD日 HH:mm')}
                                    </Text>
                                    {session.persona.personaTag && <Tag bordered={false} className="ml-2 text-xs">{session.persona.personaTag}</Tag>}
                                </div>
                            }
                        />
                        <div className="hidden md:flex items-center text-slate-300">
                             <RightOutlined />
                        </div>
                    </List.Item>
                )}
              />
          </div>
        )}
      </div>
    </div>
  );
};