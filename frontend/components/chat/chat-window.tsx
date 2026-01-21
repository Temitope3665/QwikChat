'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Menu, Phone } from 'lucide-react';
import { getConversations, User, API_URL, RoomResponse } from '@/lib/api';

interface ChatWindowProps {
  room: RoomResponse;
  currentUser: User;
  onMobileMenuOpen?: () => void;
}

export function ChatWindow({ room, currentUser, onMobileMenuOpen }: ChatWindowProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const roomId = room.room.id;

    const otherUser = room.users.find(u => u.id !== currentUser.id);
    const chatName = otherUser ? otherUser.username : room.room.name;
    const chatPhone = otherUser ? otherUser.phone : null;

  const { data: initialMessages } = useQuery({
    queryKey: ['messages', roomId],
    queryFn: () => getConversations(roomId),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      scrollToBottom();
    }
  }, [initialMessages]);

  useEffect(() => {
    const wsUrl = `${API_URL.replace('http', 'ws')}/ws`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Connected to WS');
      ws.current?.send(JSON.stringify({
        chat_type: 'CONNECT',
        value: [],
        room_id: 'main',
        user_id: currentUser.id,
        id: 0
      }));
      
      // Join the room
        ws.current?.send(JSON.stringify({
             chat_type: 'JOIN',
             value: [roomId],
             room_id: roomId,
             user_id: currentUser.id,
             id: 0
        }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
         if (data.chat_type === 'TEXT' && data.room_id === roomId) {
            setMessages((prev) => [...prev, {
                id: Date.now().toString(),
                content: data.value[0],
                user_id: data.user_id,
                created_at: new Date().toISOString(),
            }]);
            scrollToBottom();
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [roomId, currentUser.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if(scrollContainer) {
                 scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, 100);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !ws.current) return;

    const payload = {
      chat_type: 'TEXT',
      value: [message],
      room_id: roomId,
      user_id: currentUser.id,
      id: 0
    };

    ws.current.send(JSON.stringify(payload));
    setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        content: message,
        user_id: currentUser.id,
        created_at: new Date().toISOString(),
    }]);
    setMessage('');
    scrollToBottom();
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      <div className="p-4 border-b flex items-center gap-4">
        {onMobileMenuOpen && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={onMobileMenuOpen}>
                <Menu className="w-5 h-5" />
            </Button>
        )}
        <div className="flex items-center gap-3">
             <Avatar>
                <AvatarFallback>{chatName ? chatName.substring(0, 2).toUpperCase() : '?'}</AvatarFallback>
             </Avatar>
            <div>
                 <h2 className="font-semibold">{chatName}</h2>
                 {chatPhone && (
                     <div className="flex items-center gap-1 text-xs text-muted-foreground">
                         <Phone className="w-3 h-3" />
                         {chatPhone}
                     </div>
                 )}
            </div>
        </div>
      </div>
      
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.user_id === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                   <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{chatName ? chatName.substring(0, 2).toUpperCase() : 'U'}</AvatarFallback>
                   </Avatar>
                )}
                <div
                  className={`rounded-lg px-4 py-2 max-w-[70%] text-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
