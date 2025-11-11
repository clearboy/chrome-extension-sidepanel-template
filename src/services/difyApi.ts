/**
 * Dify API Service
 * 用于调用 Dify AI 智能体进行对话
 */

export interface DifyConfig {
  apiKey: string;
  endpoint: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface DifyResponse {
  answer: string;
  conversation_id: string;
  message_id: string;
}

export interface DifyError {
  error: string;
  message: string;
}

class DifyApiService {
  private config: DifyConfig = {
    apiKey: 'app-RAo1ifef5eWIg8yxnePIUkib',
    endpoint: 'https://dify.xywang.org/v1/chat-messages',
  };

  private conversationId: string | null = null;

  /**
   * 发送消息到 Dify AI
   * @param query 用户问题
   * @param user 用户标识 (可选)
   * @returns AI 回复
   */
  async sendMessage(query: string, user: string = 'chrome-extension-user'): Promise<DifyResponse> {
    try {
      const requestBody: any = {
        inputs: {},
        query: query,
        response_mode: 'blocking',
        user: user,
      };

      // 如果有会话ID,则继续之前的对话
      if (this.conversationId) {
        requestBody.conversation_id = this.conversationId;
      }

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 保存会话ID以便继续对话
      if (data.conversation_id) {
        this.conversationId = data.conversation_id;
      }

      return {
        answer: data.answer,
        conversation_id: data.conversation_id,
        message_id: data.message_id,
      };
    } catch (error) {
      console.error('Dify API Error:', error);
      throw error;
    }
  }

  /**
   * 重置会话,开始新的对话
   */
  resetConversation(): void {
    this.conversationId = null;
  }

  /**
   * 获取当前会话ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * 设置会话ID (用于恢复之前的对话)
   */
  setConversationId(conversationId: string | null): void {
    this.conversationId = conversationId;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<DifyConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 从 AI 回复中提取品类编码
   * 格式: 品类编码：1000-04-09-01
   */
  extractCategoryCodes(answer: string): string[] {
    const regex = /品类编码[：:]\s*([0-9-]+)/g;
    const codes: string[] = [];
    let match;

    while ((match = regex.exec(answer)) !== null) {
      codes.push(match[1].trim());
    }

    return codes;
  }

  /**
   * 检查回复是否包含品类推荐
   */
  hasCategories(answer: string): boolean {
    return answer.includes('🎯 推荐品类') || answer.includes('【首选】');
  }
}

// 导出单例
export const difyApi = new DifyApiService();
