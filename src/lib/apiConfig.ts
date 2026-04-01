const API_KEYS = {
  openai: 'user_openai_key',
  claude: 'user_claude_key',
  gemini: 'user_gemini_key',
};

export const getApiKey = (model: string) => {
  return localStorage.getItem(API_KEYS[model as keyof typeof API_KEYS] || model) || '';
};

export const setApiKey = (model: string, key: string) => {
  localStorage.setItem(API_KEYS[model as keyof typeof API_KEYS] || model, key);
};

export const getAllApiKeys = () => {
  return {
    openai: localStorage.getItem(API_KEYS.openai) || '',
    claude: localStorage.getItem(API_KEYS.claude) || '',
    gemini: localStorage.getItem(API_KEYS.gemini) || '',
  };
};

export const setAllApiKeys = (keys: { openai: string; claude: string; gemini: string }) => {
  Object.entries(keys).forEach(([model, key]) => {
    setApiKey(model, key);
  });
};
