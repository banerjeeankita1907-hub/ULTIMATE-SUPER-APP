import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Messaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/messages`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(`${API}/messages/${userId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await axios.post(`${API}/messages`, {
        receiver_id: selectedUser.id,
        content: newMessage
      });
      setNewMessage('');
      fetchMessages(selectedUser.id);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const selectConversation = (userData) => {
    setSelectedUser(userData);
    fetchMessages(userData.id);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl fade-in" data-testid="messaging">
      <h1 className="text-4xl font-bold mb-8">💬 Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations List */}
        <div className="glass-effect p-6 overflow-y-auto" data-testid="conversations-list">
          <h2 className="text-xl font-bold mb-4">Conversations</h2>
          <div className="space-y-3">
            {conversations.map((conv, index) => (
              <div
                key={conv.user.id}
                data-testid={`conversation-${index}`}
                onClick={() => selectConversation(conv.user)}
                className={`p-4 rounded-lg cursor-pointer transition ${
                  selectedUser?.id === conv.user.id
                    ? 'bg-purple-500/30 border border-purple-500'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    {conv.user.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{conv.user.username}</p>
                    <p className="text-sm text-gray-400 truncate">
                      {conv.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {conversations.length === 0 && (
              <p className="text-gray-400 text-center py-8" data-testid="no-conversations">
                No conversations yet
              </p>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="md:col-span-2 glass-effect flex flex-col" data-testid="messages-area">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-700" data-testid="chat-header">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                    {selectedUser.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg" data-testid="selected-user-name">{selectedUser.username}</p>
                    <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto" data-testid="messages-container">
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div
                      key={msg.id}
                      data-testid={`message-${index}`}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-lg ${
                          msg.sender_id === user.id
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : 'bg-gray-700'
                        }`}
                      >
                        <p className="text-white">{msg.content}</p>
                        <p className="text-xs text-gray-300 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-6 border-t border-gray-700" data-testid="message-input-area">
                <form onSubmit={sendMessage} className="flex gap-3">
                  <input
                    data-testid="message-input"
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white"
                  />
                  <button
                    data-testid="send-message-button"
                    type="submit"
                    className="px-6 py-3 rounded-lg btn-gradient font-semibold"
                  >
                    Send 🚀
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center" data-testid="no-chat-selected">
              <p className="text-gray-400 text-lg">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messaging;
