import React from 'react';
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
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">予解</h1>
            <p className="text-sm text-gray-500 mt-1">本地优先的AI聊天应用</p>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            ⚙️
          </button>
        </div>
      </div>
      
      <button
        onClick={onCreateConversation}
        className="m-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
      >
        新会话
      </button>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
              selectedConversationId === conversation.id
                ? 'bg-indigo-50'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => onSelectConversation(conversation.id)}
          >
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
          </div>
        ))}
      </div>
    </div>
  );
};
