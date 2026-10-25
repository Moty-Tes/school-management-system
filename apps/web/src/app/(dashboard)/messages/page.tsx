'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';

export default function MessagesPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load contacts on mount
  useEffect(() => {
    api.get('/api/v1/messages/contacts')
      .then((data: any) => {
        setContacts(data);
        if (data.length > 0) setSelectedContact(data[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load messages when contact changes
  useEffect(() => {
    if (!selectedContact) return;
    
    async function loadMessages() {
      const data = await api.get(`/api/v1/messages/${selectedContact.id}`);
      setMessages(data);
      // Mark as read
      await api.patch(`/api/v1/messages/${selectedContact.id}/read`);
    }
    
    loadMessages();
    // Simple polling for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedContact]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const content = newMessage;
    setNewMessage('');
    
    // Optimistic UI update
    const tempMsg = { id: 'temp', content, senderId: 'me', createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const realMsg = await api.post('/api/v1/messages', { receiverId: selectedContact.id, content });
      setMessages(prev => [...prev.filter(m => m.id !== 'temp'), realMsg]);
    } catch {
      alert('Failed to send message');
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading messages...</div>;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex h-[calc(100vh-12rem)]">
      
      {/* LEFT SIDEBAR: Contacts */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="font-bold text-slate-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 ? (
            <p className="p-4 text-sm text-slate-500 text-center">No contacts available.</p>
          ) : (
            contacts.map(contact => (
              <div 
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${selectedContact?.id === contact.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                    {contact.profile?.firstName?.[0]}{contact.profile?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{contact.profile?.firstName} {contact.profile?.lastName}</p>
                    <p className="text-xs text-slate-500">{contact.tenantLinks?.[0]?.roles?.[0]?.role?.name || 'User'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedContact ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white">
              <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-xs">
                {selectedContact.profile?.firstName?.[0]}{selectedContact.profile?.lastName?.[0]}
              </div>
              <p className="font-bold text-slate-900">{selectedContact.profile?.firstName} {selectedContact.profile?.lastName}</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, i) => {
                // Check if I am the sender (we'll use 'me' for the temp optimistic message)
                const isMe = msg.senderId === 'me' || msg.senderId !== selectedContact.id;
                
                return (
                  <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <form onSubmit={handleSend} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors w-10 h-10 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Select a contact to start messaging
          </div>
        )}
      </div>

    </div>
  );
}