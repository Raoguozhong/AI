'use client';

import React, { useState, useEffect } from 'react';
import { ChatSidebar } from '../src/components/ChatSidebar';
import { ChatArea } from '../src/components/ChatArea';
import { useDatabase } from '../src/hooks/useDatabase';
import { streamAIResponse } from '../src/lib/api';
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

    // 模拟AI响应（实际项目中应该调用真实的API）
    setTimeout(() => {
      const aiResponse = "这是一个模拟的AI回复。在实际项目中，这里会调用真实的API获取AI的响应。";
      
      addMessage({
        conversationId: selectedConversationId,
        role: 'assistant',
        content: aiResponse,
      }).then(aiMessage => {
        setMessages(prev => [...prev, aiMessage]);
        setLoading(false);
      });
    }, 1000);

    // 实际API调用示例（需要配置API密钥）
    /*
    const apiKey = 'YOUR_API_KEY'; // 实际项目中应该从环境变量或用户输入获取
    
    let aiContent = '';
    await streamAIResponse({
      model: currentModel as any,
      prompt: content,
      apiKey,
      onChunk: (chunk) => {
        aiContent += chunk;
        // 可以在这里实现实时更新UI
      },
      onError: (error) => {
        console.error('API error:', error);
        setLoading(false);
      },
      onComplete: async () => {
        await addMessage({
          conversationId: selectedConversationId,
          role: 'assistant',
          content: aiContent,
        }).then(aiMessage => {
          setMessages(prev => [...prev, aiMessage]);
          setLoading(false);
        });
      },
    });
    */
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      
      {selectedConversationId ? (
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          loading={loading}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">选择或创建一个会话</h2>
            <p className="text-gray-500">开始与AI进行对话</p>
          </div>
        </div>
      )}
    </div>
  );
}