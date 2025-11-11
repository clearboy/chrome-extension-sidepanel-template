import React, { useState, useRef, useEffect } from 'react';
import '@pages/panel/Panel.css';
import { difyApi, ChatMessage } from '@src/services/difyApi';
import logo from '@src/assets/img/logo.svg';

export default function Panel(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 调用 Dify API
      const response = await difyApi.sendMessage(userMessage.content);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.answer,
        timestamp: Date.now(),
      };

      // 添加 AI 回复
      setMessages(prev => [...prev, assistantMessage]);

      // 检查是否包含品类推荐
      if (difyApi.hasCategories(response.answer)) {
        const codes = difyApi.extractCategoryCodes(response.answer);
        console.log('提取到的品类编码:', codes);
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `抱歉,发送消息时出现错误: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 清空对话
  const handleClearChat = () => {
    setMessages([]);
    difyApi.resetConversation();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo" className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Ariba AI 助手</h1>
            <p className="text-xs text-gray-500">品类查询助手</p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          title="清空对话"
        >
          清空
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <img src={logo} alt="Logo" className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">欢迎使用 Ariba AI 助手</h2>
            <p className="text-gray-500 text-sm max-w-md">
              我可以帮你查询采购品类。请描述你要采购的物品,我会为你推荐合适的品类编码。
            </p>
            <div className="mt-6 space-y-2 text-left w-full max-w-md">
              <p className="text-sm text-gray-600 font-medium">试试这些问题:</p>
              <button
                onClick={() => setInputValue('我要采购办公桌椅')}
                className="w-full text-left px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-gray-700"
              >
                💼 我要采购办公桌椅
              </button>
              <button
                onClick={() => setInputValue('注塑的塑料粒子')}
                className="w-full text-left px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-gray-700"
              >
                ⚗️ 注塑的塑料粒子
              </button>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">AI 正在思考...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-end space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="描述你要采购的物品..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-800"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !inputValue.trim() || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isLoading ? '发送中...' : '发送'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          按 Enter 发送, Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}
