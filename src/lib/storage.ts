// Create a storage utility
import { Chat } from '@/types/chat';

export const storage = {
  saveChats(chats: Chat[]) {
    localStorage.setItem('chats', JSON.stringify(chats));
  },

  loadChats(): Chat[] {
    const chats = localStorage.getItem('chats');
    if (!chats) return [];
    
    return JSON.parse(chats, (key, value) => {
      if (key === 'createdAt' || key === 'updatedAt' || key === 'timestamp') {
        return new Date(value);
      }
      return value;
    });
  }
}; 