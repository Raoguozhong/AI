import { useState, useEffect } from 'react';
import { db } from '../lib/database';
import { Conversation, Message } from '../types';

export const useDatabase = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const allConversations = await db.conversations
        .orderBy('updatedAt')
        .reverse()
        .toArray();
      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (model: string): Promise<Conversation> => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: '新会话',
      model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.conversations.add(newConversation);
    await loadConversations();
    return newConversation;
  };

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    await db.conversations.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    await loadConversations();
  };

  const deleteConversation = async (id: string) => {
    await db.transaction('rw', db.conversations, db.messages, async () => {
      await db.messages.where('conversationId').equals(id).delete();
      await db.conversations.delete(id);
    });
    await loadConversations();
  };

  const getMessages = async (conversationId: string): Promise<Message[]> => {
    return await db.messages
      .where('conversationId')
      .equals(conversationId)
      .orderBy('createdAt')
      .toArray();
  };

  const addMessage = async (message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };

    await db.messages.add(newMessage);
    await db.conversations.update(message.conversationId, {
      updatedAt: Date.now(),
    });
    await loadConversations();
    return newMessage;
  };

  return {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    getMessages,
    addMessage,
  };
};
