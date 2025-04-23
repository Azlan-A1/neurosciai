// First, create types for our chat system
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  isStarred?: boolean;
} 