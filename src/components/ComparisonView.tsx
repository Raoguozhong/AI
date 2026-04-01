import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'prismjs/themes/prism.css';
import { motion } from 'framer-motion';
import { streamChat } from '../lib/chat';
import { ModelType } from '../types';

interface ComparisonViewProps {
  prompt: string;
  modelA: ModelType;
  modelB: ModelType;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ prompt, modelA, modelB }) => {
  const [responseA, setResponseA] = useState('');
  const [responseB, setResponseB] = useState('');
  const [loadingA, setLoadingA] = useState(true);
  const [loadingB, setLoadingB] = useState(true);
  const [errorA, setErrorA] = useState<string | null>(null);
  const [errorB, setErrorB] = useState<string | null>(null);

  useEffect(() => {
    // 重置状态
    setResponseA('');
    setResponseB('');
    setLoadingA(true);
    setLoadingB(true);
    setErrorA(null);
    setErrorB(null);

    // 并行发起两个流式请求
    const fetchA = async () => {
      try {
        await streamChat({
          model: modelA,
          messages: [{ role: 'user', content: prompt }],
          onChunk: (chunk) => {
            setResponseA(prev => prev + chunk);
          },
          onError: (error) => {
            setErrorA(error.message);
            setLoadingA(false);
          },
          onComplete: () => {
            setLoadingA(false);
          },
        });
      } catch (error) {
        setErrorA((error as Error).message);
        setLoadingA(false);
      }
    };

    const fetchB = async () => {
      try {
        await streamChat({
          model: modelB,
          messages: [{ role: 'user', content: prompt }],
          onChunk: (chunk) => {
            setResponseB(prev => prev + chunk);
          },
          onError: (error) => {
            setErrorB(error.message);
            setLoadingB(false);
          },
          onComplete: () => {
            setLoadingB(false);
          },
        });
      } catch (error) {
        setErrorB((error as Error).message);
        setLoadingB(false);
      }
    };

    fetchA();
    fetchB();
  }, [prompt, modelA, modelB]);

  const getModelDisplayName = (model: ModelType) => {
    switch (model) {
      case 'openai':
        return 'OpenAI (GPT-3.5)';
      case 'claude':
        return 'Claude (Claude 3)';
      case 'gemini':
        return 'Gemini (Gemini 1.0)';
      default:
        return model;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 w-full h-full">
      {/* 左侧：模型 A */}
      <div className="border-r p-4 flex flex-col">
        <div className="text-sm text-gray-600 mb-3 font-medium">
          {getModelDisplayName(modelA)}
        </div>
        {loadingA && (
          <div className="flex space-x-1 mb-4">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        {errorA && (
          <div className="text-red-500 text-sm mb-4">
            错误: {errorA}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeHighlight]}
          >
            {responseA || (loadingA ? '' : '_无响应_')}
          </ReactMarkdown>
        </div>
      </div>
      
      {/* 右侧：模型 B */}
      <div className="p-4 flex flex-col">
        <div className="text-sm text-gray-600 mb-3 font-medium">
          {getModelDisplayName(modelB)}
        </div>
        {loadingB && (
          <div className="flex space-x-1 mb-4">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        {errorB && (
          <div className="text-red-500 text-sm mb-4">
            错误: {errorB}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            rehypePlugins={[rehypeHighlight]}
          >
            {responseB || (loadingB ? '' : '_无响应_')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
