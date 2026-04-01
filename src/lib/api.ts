import { ModelType } from '../types';

export interface StreamOptions {
  model: ModelType;
  prompt: string;
  apiKey: string;
  onChunk: (chunk: string) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

export const streamAIResponse = async (options: StreamOptions) => {
  const { model, prompt, apiKey, onChunk, onError, onComplete } = options;

  try {
    let url: string;
    let headers: HeadersInit;
    let body: any;

    switch (model) {
      case 'openai':
        url = 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        body = {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        };
        break;

      case 'claude':
        url = 'https://api.anthropic.com/v1/messages';
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        };
        body = {
          model: 'claude-3-opus-20240229',
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        };
        break;

      case 'gemini':
        url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:streamGenerateContent?key=${apiKey}`;
        headers = {
          'Content-Type': 'application/json',
        };
        body = {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        };
        break;

      default:
        throw new Error('Unsupported model');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 处理不同模型的流式响应格式
      if (model === 'openai') {
        // OpenAI 的流式格式
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const chunk = JSON.parse(data);
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing OpenAI chunk:', e);
            }
          }
        }
      } else if (model === 'claude') {
        // Claude 的流式格式
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const chunk = JSON.parse(data);
              const content = chunk.delta?.text;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing Claude chunk:', e);
            }
          }
        }
      } else if (model === 'gemini') {
        // Gemini 的流式格式
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const chunk = JSON.parse(line);
            const content = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            console.error('Error parsing Gemini chunk:', e);
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    onError(error as Error);
  }
};
