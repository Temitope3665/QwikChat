'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/chat/sidebar';
import { ChatWindow } from '@/components/chat/chat-window';
import { UserAuthForm } from '@/components/auth/user-auth-form';
import { User, RoomResponse } from '@/lib/api';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomResponse | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // In a real app, we would check for persistent session or JWT here
  // For now, we rely on the auth dialog to "log in" the user in memory

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <UserAuthForm 
        open={!user} 
        onSuccess={(userData) => setUser(userData)} 
      />

      {user && (
        <>
           {/* Mobile Sidebar Overlay */}
           {isMobileMenuOpen && (
               <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
           )}
           
          <div className={`fixed inset-y-0 left-0 z-50 w-80 transform transition-transform md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
             <Sidebar
                selectedRoom={selectedRoom}
                onSelectRoom={(room) => {
                    setSelectedRoom(room);
                    setIsMobileMenuOpen(false);
                }}
                currentUser={user}
              />
          </div>

          <main className="flex-1 flex flex-col min-w-0">
            {selectedRoom ? (
              <ChatWindow 
                room={selectedRoom} 
                currentUser={user}
                onMobileMenuOpen={() => setIsMobileMenuOpen(true)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center">
                <div>
                    <h3 className="text-lg font-semibold mb-2">Welcome to QwikChat</h3>
                    <p>Select a room from the sidebar to start chatting.</p>
                </div>
                <button className="md:hidden absolute top-4 left-4" onClick={() => setIsMobileMenuOpen(true)}>
                    Menu
                </button>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
