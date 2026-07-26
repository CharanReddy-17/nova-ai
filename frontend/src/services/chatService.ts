import api from './api';

export interface Message {
  role:        'user' | 'assistant';
  content:     string;
  timestamp:   string;
  imageUrl?:   string;   // set for /imagine results
  isStreaming?: boolean; // set during live streaming
}


export interface Chat {
  _id:      string;
  title:    string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  isPinned:  boolean;
  isPublic:  boolean;
  shareId:   string | null;
}

export interface StreamCallbacks {
  onChunk:  (chunk: string) => void;
  onDone:   (meta: { title: string; isFirstMessage: boolean }) => void;
  onError:  (error: string) => void;
}

export const chatService = {
  getChats: () =>
    api.get<{ chats: Chat[] }>('/chats').then(r => r.data.chats),

  createChat: (title?: string) =>
    api.post<{ chat: Chat }>('/chats', { title }).then(r => r.data.chat),

  getChat: (id: string) =>
    api.get<{ chat: Chat }>(`/chats/${id}`).then(r => r.data.chat),

  updateChat: (id: string, data: { title?: string; isPinned?: boolean }) =>
    api.patch<{ chat: Chat }>(`/chats/${id}`, data).then(r => r.data.chat),

  deleteChat: (id: string) =>
    api.delete(`/chats/${id}`).then(r => r.data),

  generateTitle: (id: string) =>
    api.post<{ title: string }>(`/chats/${id}/generate-title`).then(r => r.data.title),

  shareChat: (id: string) =>
    api.post<{ shareId: string; shareUrl: string; isPublic: boolean }>(`/chats/${id}/share`).then(r => r.data),

  unshareChat: (id: string) =>
    api.delete<{ isPublic: boolean }>(`/chats/${id}/share`).then(r => r.data),

  // Non-streaming fallback
  sendMessage: (id: string, content: string, model?: string, persona?: string) =>
    api.post<{ message: Message }>(`/chats/${id}/messages`, { content, model, persona }).then(r => r.data),

  // ── Streaming ───────────────────────────────────────────────────────────────
  streamMessage: async (id: string, content: string, callbacks: StreamCallbacks, model?: string, persona?: string): Promise<void> => {
    const token   = localStorage.getItem('cosmic_token');
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const response = await fetch(`${baseURL}/api/chats/${id}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content, model, persona }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Stream failed' }));
      callbacks.onError(err.error || 'Streaming failed');
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) { callbacks.onError('No stream reader available'); return; }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith('event:')) continue;

        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.chunk !== undefined) {
              callbacks.onChunk(parsed.chunk);
            } else if (parsed.title !== undefined) {
              callbacks.onDone({ title: parsed.title, isFirstMessage: !!parsed.isFirstMessage });
            } else if (parsed.error) {
              callbacks.onError(parsed.error);
            }
          } catch { /* non-JSON, skip */ }
        }
      }
    }
  },
};
