'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRooms, getAllUsers, createRoom, RoomResponse, User } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MessageSquare, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SidebarProps {
  selectedRoom: RoomResponse | null;
  onSelectRoom: (room: RoomResponse) => void;
  currentUser: User;
}

export function Sidebar({ selectedRoom, onSelectRoom, currentUser }: SidebarProps) {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: getRooms,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getAllUsers,
    enabled: isNewChatOpen,
  });

  const createRoomMutation = useMutation({
    mutationFn: async (otherUserId: string) => {
        const otherUser = users?.find(u => u.id === otherUserId);
        const name = otherUser ? otherUser.username : "New Chat";
        return createRoom(name, [currentUser.id, otherUserId]);
    },
    onSuccess: (data) => {
      setIsNewChatOpen(false);
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      // We need to construct a temporary RoomResponse or fetch it to select it immediately
      // For simplicity, we can just let the query invalidation handle the list update
      // and maybe try to find it in the new list, but since backend returns just Room,
      // we might need to fetch the room details or just rely on the user clicking it.
      // However, to keep it smooth, let's try to find if we can construct it.
      // But we need the users list for the room.
      // Let's just refetch rooms and then find it? Or simplistic approach:
       // Ideally createRoom should return complete info or we fetch it.
       // For now, let's just close the dialog. The user will see it in the list.
    },
  });

  const getRoomName = (room: RoomResponse) => {
    // If it's a direct message (2 participants), show the other person's name
    if (room.users.length === 2 && currentUser) {
        const otherUser = room.users.find(u => u.id !== currentUser.id);
        return otherUser ? otherUser.username : room.room.name;
    }
    return room.room.name;
  }

  // if (isLoadingRooms) {
  //   return (
  //     <div className="w-80 h-full border-r bg-muted/10 p-4">
  //       <div className="h-8 w-1/2 bg-muted animate-pulse rounded mb-4" />
  //       <div className="space-y-2">
  //         {[1, 2, 3].map((i) => (
  //           <div key={i} className="h-16 bg-muted animate-pulse rounded" />
  //         ))}
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="w-80 h-full border-r bg-background flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chats
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Logged in as {currentUser?.username}</p>
        </div>
        <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" title="New Chat">
                    <Plus className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Chat</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] pr-4">
                    {isLoadingUsers ? (
                         <div className="text-center p-4">Loading users...</div>
                    ) : (
                        <div className="space-y-2">
                            {users?.filter(u => u.id !== currentUser.id).map((user) => (
                                <Button
                                    key={user.id}
                                    variant="ghost"
                                    className="w-full justify-start py-3 h-auto border-b text-left"
                                    onClick={() => createRoomMutation.mutate(user.id)}
                                    disabled={createRoomMutation.isPending}
                                >
                                    <Avatar className="w-8 h-8 mr-3">
                                        <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{user.username}</div>
                                        <div className="text-xs text-muted-foreground">{user.phone}</div>
                                    </div>
                                </Button>
                            ))}
                            {!users?.filter(u => u.id !== currentUser.id).length && (
                                <div className="text-center text-muted-foreground p-4">No other users found.</div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {rooms?.map((item) => {
             const roomName = getRoomName(item);
             return (
            <Button
              key={item.room.id}
              variant={selectedRoom?.room.id === item.room.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-auto py-3 px-4",
                selectedRoom?.room.id === item.room.id && "bg-secondary"
              )}
              onClick={() => onSelectRoom(item)}
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar>
                  <AvatarFallback className='bg-primary/10 text-primary'>
                    {roomName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="font-medium truncate">{roomName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {item.room.last_message || "No messages yet"}
                  </div>
                </div>
              </div>
            </Button>
            );
        })}
            {!rooms?.length && (
                <div className="p-4 flex flex-col items-center justify-center h-full text-center space-y-4 pt-10">
                    <div className="bg-muted rounded-full p-4">
                         <MessageSquare className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium">No conversations yet</p>
                        <p className="text-sm text-muted-foreground mb-4">Start a chat with someone!</p>
                        <Button onClick={() => setIsNewChatOpen(true)}>
                            Start New Chat
                        </Button>
                    </div>
                </div>
            )}
        </div>
      </ScrollArea>
    </div>
  );
}
