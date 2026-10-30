'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, X, LogOut } from 'lucide-react';

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
      showSuccessToast('Message sent successfully!');
    } catch (err) {
      showErrorToast('Failed to send message. Please try again.');
      // Revert optimistic update
      setMessages(prev => prev.filter(m => m.id !== 'temp'));
    }
  }

  // --- Toast & Feedback System ---
  function showSuccessToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.querySelector('div')!.className = 'bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/20 transform translate-y-0 transition-transform duration-500 ease-out';
    }, 10);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  function showErrorToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-red-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-red-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116 21H8a2 2 0 01-2-1.858L5 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  return (
    <motion.div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 text-sm mt-1">Communicate with teachers, staff, and parents</p>
        </div>

        <motion.button
          onClick={() => setSelectedContact(contacts[0])}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center gap-2"
          disabled={contacts.length === 0}
        >
          <MessageCircle className="w-4 h-4" /> Start Chatting
        </motion.button>
      </motion.div>

      {loading && (
        <motion.div className="p-8 text-center text-slate-500 animate-bounce">
          Loading messages...
        </motion.div>
      )}

      {/* Main Chat Interface */}
      <motion.div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl flex h-[650px]" style={{ transition: 'all 0.3s ease' }}>
        {/* LEFT SIDEBAR: Contacts with animated entries */}
        <motion.div
          className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50"
          whileHover={{ background: 'var(--hover-bg, #f1f5f9)' }}
        >
          <motion.div
            className="p-4 border-b border-slate-200 bg-white"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
          >
            <h2 className="font-bold text-slate-900">Messages</h2>
          </motion.div>
          <motion.div
            className="flex-1 overflow-y-auto"
            style={{ transition: 'all 0.3s ease' }}
          >
            {contacts.length === 0 ? (
              <motion.p
                className="p-4 text-sm text-slate-500 text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                No contacts available.
              </motion.p>
            ) : contacts.map(contact => (
              <motion.div
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${
                  selectedContact?.id === contact.id
                    ? 'bg-indigo-50 border-l-4 border-l-indigo-600'
                    : 'hover:bg-indigo-50/50 rounded-lg'
                }`}
                whileHover={{ background: 'var(--hover-bg, #e2e8f0)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-200/80 text-indigo-600 flex items-center justify-center font-bold text-sm transition-colors">
                    {contact.profile?.firstName?.[0]}{contact.profile?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{contact.profile?.firstName} {contact.profile?.lastName}</p>
                    <p className="text-xs text-slate-500">{contact.tenantLinks?.[0]?.roles?.[0]?.role?.name || 'User'}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE: Chat Window */}
        <motion.div
          className="flex-1 flex flex-col bg-white"
          whileHover={{ background: 'var(--hover-bg, #f8fafc)' }}
        >
          {selectedContact ? (
            <>
              {/* Header */}
              <motion.div
                className="p-4 border-b border-slate-200 flex items-center gap-3 bg-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.15 }}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-200/80 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  {selectedContact.profile?.firstName?.[0]}{selectedContact.profile?.lastName?.[0]}
                </div>
                <p className="font-bold text-slate-900">{selectedContact.profile?.firstName} {selectedContact.profile?.lastName}</p>
                <motion.button
                  onClick={() => setSelectedContact(null)}
                  className="ml-auto text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </motion.div>

              {/* Messages Area */}
              <motion.div
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
                style={{ transition: 'all 0.3s ease' }}
              >
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === 'me' || msg.senderId !== selectedContact.id;

                  return (
                    <motion.div
                      key={msg.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: i * 0.02 }}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-2xl text-sm transition-all duration-300 ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-sm shadow-indigo-500/20'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        <motion.p className="whitespace-pre-wrap">{msg.content}</motion.p>
                        <p className="text-xs opacity-70 mt-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={messagesEndRef} />
              </motion.div>

              {/* Input Area */}
              <motion.div
                className="p-4 border-t border-slate-200 bg-white"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              >
                <form onSubmit={handleSend} className="flex gap-2">
                  <motion.input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-5 py-3 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <motion.button
                    type="submit"
                    className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition-colors w-11 h-11 flex items-center justify-center"
                    disabled={!newMessage.trim() || !selectedContact}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                  </motion.button>
                </form>
              </motion.div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-slate-400">
              Select a contact to view messages
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}