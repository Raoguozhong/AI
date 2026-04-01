'use client';

import React, { useState, useEffect } from 'react';
import { ChatSidebar } from '../src/components/ChatSidebar';
import { ChatArea } from '../src/components/ChatArea';
import { SettingsModal } from '../src/components/SettingsModal';
import { ComparisonView } from '../src/components/ComparisonView';
import { useDatabase } from '../src/hooks/useDatabase';
import { streamChat } from '../src/lib/chat';
import { getApiKey } from '../src/lib/apiConfig';
import { Message, ModelType } from '../src/types';

export default function Home() {
  const { 
    conversations, 
    loading: conversationsLoading, 
    createConversation, 
    updateConversation, 
    deleteConversation, 
    getMessages, 
    addMessage 
  } = useDatabase();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<ModelType>('openai');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [comparisonModelA, setComparisonModelA] = useState<ModelType>('openai');
  const [comparisonModelB, setComparisonModelB] = useState<ModelType>('claude');
  const [comparisonPrompt, setComparisonPrompt] = useState('');

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  const loadMessages = async (conversationId: string) => {
    const loadedMessages = await getMessages(conversationId);
    setMessages(loadedMessages);
  };

  const handleCreateConversation = async () => {
    const newConversation = await createConversation(currentModel);
    setSelectedConversationId(newConversation.id);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (selectedConversationId === id) {
      setSelectedConversationId(null);
      setMessages([]);
    }
  };

  const handleModelChange = (model: string) => {
    setCurrentModel(model);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;

    // 添加用户消息
    const userMessage = await addMessage({
      conversationId: selectedConversationId,
      role: 'user',
      content,
    });
    setMessages(prev => [...prev, userMessage]);

    // 更新会话标题（如果是第一条消息）
    if (messages.length === 0) {
      await updateConversation(selectedConversationId, {
        title: content.substring(0, 20) + (content.length > 20 ? '...' : ''),
      });
    }

    setLoading(true);

    let aiContent = '';
    await streamChat({
      model: currentModel,
      messages: [
        { role: 'user', content }
      ],
      onChunk: (chunk) => {
        aiContent += chunk;
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.id) {
            const updatedMessages = [...prev];
            updatedMessages[updatedMessages.length - 1] = {
              ...lastMessage,
              content: aiContent,
            };
            return updatedMessages;
          } else {
            return [...prev, {
              id: '',
              conversationId: selectedConversationId,
              role: 'assistant',
              content: aiContent,
              createdAt: Date.now(),
            }];
          }
        });
      },
      onError: (error) => {
        console.error('API error:', error);
        if (aiContent) {
          addMessage({
            conversationId: selectedConversationId,
            role: 'assistant',
            content: aiContent || `API 调用失败: ${error.message}`,
          }).then(aiMessage => {
            setMessages(prev => {
              const filtered = prev.filter(m => m.id);
              return [...filtered, aiMessage];
            });
            setLoading(false);
          });
        } else {
          addMessage({
            conversationId: selectedConversationId,
            role: 'assistant',
            content: `API 调用失败: ${error.message}`,
          }).then(aiMessage => {
            setMessages(prev => [...prev, aiMessage]);
            setLoading(false);
          });
        }
      },
      onComplete: async () => {
        await addMessage({
          conversationId: selectedConversationId,
          role: 'assistant',
          content: aiContent,
        }).then(aiMessage => {
          setMessages(prev => {
            const filtered = prev.filter(m => m.id);
            return [...filtered, aiMessage];
          });
          setLoading(false);
        });
      },
    });
  };

  const handleComparisonSubmit = (prompt: string) => {
    setComparisonPrompt(prompt);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setSettingsModalOpen(true)}
      />
      
      <div className="flex-1 flex flex-col">
        {/* 模式切换按钮 */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            {isComparisonMode ? '多模型对比' : selectedConversationId ? '聊天' : '选择或创建一个会话'}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsComparisonMode(!isComparisonMode)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md text-sm transition-colors"
            >
              {isComparisonMode ? '切换到普通聊天' : '切换到多模型对比'}
            </button>
          </div>
        </div>
        
        {isComparisonMode ? (
          /* 多模型对比视图 */
          <div className="flex-1 flex flex-col p-6">
            <div className="mb-6">
              <div className="flex space-x-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">模型 A</label>
                  <select
                    value={comparisonModelA}
                    onChange={(e) => setComparisonModelA(e.target.value as ModelType)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="openai">OpenAI (GPT-3.5)</option>
                    <option value="claude">Claude (Claude 3)</option>
                    <option value="gemini">Gemini (Gemini 1.0)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">模型 B</label>
                  <select
                    value={comparisonModelB}
                    onChange={(e) => setComparisonModelB(e.target.value as ModelType)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="openai">OpenAI (GPT-3.5)</option>
                    <option value="claude">Claude (Claude 3)</option>
                    <option value="gemini">Gemini (Gemini 1.0)</option>
                  </select>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const prompt = formData.get('prompt') as string;
                  handleComparisonSubmit(prompt);
                }}
                className="flex"
              >
                <input
                  type="text"
                  name="prompt"
                  placeholder="输入要比较的提示..."
                  className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-r-lg hover:bg-indigo-700 transition-colors"
                >
                  比较
                </button>
              </form>
            </div>
            
            {comparisonPrompt && (
              <div className="flex-1 border rounded-lg overflow-hidden">
                <ComparisonView
                  prompt={comparisonPrompt}
                  modelA={comparisonModelA}
                  modelB={comparisonModelB}
                />
              </div>
            )}
          </div>
        ) : selectedConversationId ? (
          /* 普通聊天视图 */
          <ChatArea
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
            currentModel={currentModel}
            onModelChange={handleModelChange}
          />
        ) : (
          /* 空状态视图 */
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">选择或创建一个会话</h2>
              <p className="text-gray-500">开始与AI进行对话</p>
            </div>
          </div>
        )}
      </div>
      
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}