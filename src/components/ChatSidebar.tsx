import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Conversation } from '../types';

interface ChatSidebarProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onOpenSettings,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.div 
      className="bg-gray-50 border-r border-gray-200 flex flex-col"
      initial={{ width: 256 }}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-2xl font-semibold text-gray-900">予解</h1>
            <p className="text-sm text-gray-500 mt-1">本地优先的AI聊天应用</p>
          </motion.div>
        )}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            title="设置"
          >
            ⚙️
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            title={isCollapsed ? '展开' : '收起'}
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <motion.button
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
          onClick={onCreateConversation}
          className="m-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          新会话
        </motion.button>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
              selectedConversationId === conversation.id
                ? 'bg-indigo-50'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
            {!isCollapsed && (
              <>
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-gray-900 truncate">
                    {conversation.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conversation.id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {conversation.model}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(conversation.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
            {isCollapsed && (
              <div className="flex justify-center">
                <span className="text-gray-500">💬</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
