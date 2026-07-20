import api from './api';

export interface Message { role: 'user' | 'assistant'; content: string; timestamp: string; nasaImages?: {url:string;title:string}[]; }
export interface Chat { _id: string; title: string; messages: Message[]; createdAt: string; updatedAt: string; isPinned: boolean; }

export const chatService = {
  getChats: () => api.get<{chats: Chat[]}>('/chats').then(r => r.data.chats),
  createChat: (title?: string) => api.post<{chat: Chat}>('/chats', { title }).then(r => r.data.chat),
  getChat: (id: string) => api.get<{chat: Chat}>(`/chats/${id}`).then(r => r.data.chat),
  updateChat: (id: string, data: {title?: string; isPinned?: boolean}) => api.patch<{chat: Chat}>(`/chats/${id}`, data).then(r => r.data.chat),
  deleteChat: (id: string) => api.delete(`/chats/${id}`).then(r => r.data),
  sendMessage: (id: string, content: string) => api.post<{message: Message; spaceKeyword: string | null}>(`/chats/${id}/messages`, { content }).then(r => r.data),
};
