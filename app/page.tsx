'use client';

import React, { useState, useEffect } from 'react';
import { ChatSidebar } from '../src/components/ChatSidebar';
import { ChatArea } from '../src/components/ChatArea';
import { SettingsModal } from '../src/components/SettingsModal';
import { useDatabase } from '../src/hooks/useDatabase';
import { streamChat } from '../src/lib/chat';
import { getApiKey } from '../src/lib/apiConfig';
import { Message } from '../src/types';

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
  const [currentModel, setCurrentModel] = useState('openai');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

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
      
      {selectedConversationId ? (
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={loading}
          currentModel={currentModel}
          onModelChange={handleModelChange}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">选择或创建一个会话</h2>
            <p className="text-gray-500">开始与AI进行对话</p>
          </div>
        </div>
      )}
      
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}