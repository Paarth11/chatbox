import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

interface Message {
  _id?: string;
  message: string;
  senderUsername: string;
  timestamp: Date;
  from?: string;
  user?: string;
}

interface Conversation {
  with: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

const ChatPage: React.FC = () => {
  const { user, logout, token } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState<'dms' | 'rooms'>('dms');     
  const [conversations, setConversations] = useState<Conversation[]>([]);  // conversation object 
  const [messages, setMessages] = useState<Message[]>([]);  // message object
  const [messageInput, setMessageInput] = useState(''); //  keeps the current text the user is typing in the message input box.
  const [currentChat, setCurrentChat] = useState<{ type: 'dm' | 'room'; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [roomName, setRoomName] = useState('');
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);  // HTMLDIVElement is the type defination for div
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // return type Whatever setTimeout returns because in browser setTimeout returns function but in nodejs it returns object
                                                                               // lose the ID of the previous timer, making it impossible to stop it - use of REF

  const scrollToBottom = () => {  // scroll to the bottom when new messages arrive ie if you are at top and new message arrives scrool bottom automatically
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
//find that invisible bookmark (messagesEndRef) and move the scrollbar until that element is visible on the screen."
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // messages is the trigger ie when messages chanage the function is triggered

  useEffect(() => { // rerenders u  pon change in socket data or currentChat            
    if (!socket) return;

    // Listen for direct messages
    socket.on('direct message', (data: any) => {
      if (currentChat?.type === 'dm' && currentChat.name === data.from) {
        setMessages(prev=>[...prev,{
          message: data.message,
          senderUsername: data.from,
          timestamp: data.timestamp
        }]);
      }
      loadConversations(); // refreshing the sidebar updating last message / new user etc..
    });

    // Listen for room messages
    socket.on('room message', (data: any) => {
      if (currentChat?.type === 'room' && currentChat.name === data.room) {
        setMessages(prev => [...prev, {
          message: data.message,
          senderUsername: data.user,
          timestamp: data.timestamp
        }]);
      }
    });

    // Listen for conversation history
    socket.on('conversation history', (data: any) => {  // prev is not used in conv/room history because they are treated as full snapshot rater than single new message
      setMessages(data.messages.map((msg: any) => ({
        message: msg.message,
        senderUsername: msg.senderUsername,
        timestamp: msg.timestamp
      })));
    });

   socket.on('room history', (data: any) => {
      const history = Array.isArray(data?.messages) // if more than one message = data.messages , one msg = data.message , no message = empty 
        ? data.messages
        : Array.isArray(data?.message)
          ? data.message
          : [];

      setMessages(history.map((msg: any) => ({
        message: msg.message,
        senderUsername: msg.senderUsername,
        timestamp: msg.timestamp
      })));
    });

    // Typing indicators
    socket.on('user typing', (data: any) => {
      setTypingUser(data.from);
    });

    socket.on('user stop typing', () => {
      setTypingUser(null);
    });

    socket.on('notification', (message: string) => {
      console.log('Notification:', message);
    });

    return () => {
      socket.off('direct message');
      socket.off('room message');
      socket.off('conversation history');
      socket.off('room history');
      socket.off('user typing');
      socket.off('user stop typing');
      socket.off('notification');
    };
  }, [socket, currentChat]);

  const loadConversations = async () => { // It fetches the list of chat conversations for the logged-in user and stores them in React state.
    try {
      const response = await axios.get('/api/messages/conversations', { //identify user and return only their conversations
        headers: { Authorization: `Bearer ${token}` } // response is a full data object not just data
      });
//full HTTP response object {   data: {...},status: 200, statusText: "OK",headers: {...},     // response headerss,config: {...},      // axios request config,request: {...}
      setConversations(response.data.conversations || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      // Don't show error if it's just empty conversations
      if (error.response?.status !== 404) {
        console.error('Failed to load conversations');
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'dms') {
      loadConversations();  //rerender/load sidebar if dm is recieved or changed
    }
  }, [activeTab]);

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]); // if less than 2 clear the result bar
      return;
    }

    try {
      const response = await axios.get(`/api/messages/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const openDirectMessage = (username: string) => { // argument is the username of the sender
    setCurrentChat({ type: 'dm', name: username });
    setMessages([]);
    setSearchQuery('');
    setSearchResults([]);
    
    if (socket) {
      socket.emit('get conversation', { recipientUsername: username, limit: 50 }); // send to server
    }
  };

  const joinRoom = (room: string) => { // the argument is the room name typed by the user 
    setCurrentChat({ type: 'room', name: room });
    setMessages([]); // reset the previous ui so that current ui can load 
    
    if (socket) {
      socket.emit('join room', room); // sent to the server 
    }
  };

  const sendMessage = () => {
    // validating input, emitting the message to the server, optimistically updating the UI, and resetting typing state.
    if (!messageInput.trim() || !currentChat || !socket) return;

    if (currentChat.type === 'dm') {
      socket.emit('direct message', {
        recipientUsername: currentChat.name,
        message: messageInput
      });
      
      setMessages(prev => [...prev, {
        message: messageInput,
        senderUsername: user?.username || 'You',
        timestamp: new Date()
      }]);
    } else {
      socket.emit('room message', {  // emit is basically send a message
        room: currentChat.name,
        message: messageInput
      });
    }

    setMessageInput('');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (currentChat?.type === 'dm') {
  socket.emit('stop typing', { recipientUsername: currentChat.name });
// Stops any pending typing timeout.
// Notifies the other user that you stopped typing (for DM only)
}
  };

  const handleTyping = () => { // onChange in the return type handles the timeout
    if (currentChat?.type === 'dm' && socket) {
      socket.emit('typing', { recipientUsername: currentChat.name });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop typing', { recipientUsername: currentChat.name });
      }, 1000);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* User info */}
        <div className="p-4 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold">{user?.username}</h3>
              <p className="text-xs text-gray-400">
                {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </p>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'dms'
                ? 'bg-gray-700 text-white' // if selected this color else:
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Direct Messages
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-3 text-sm font-medium ${
              activeTab === 'rooms'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Rooms
          </button>
        </div>

        {/* Content */}
        {activeTab === 'dms' ? (
          <div className="flex-1 overflow-y-auto"> 
          {/*  overflow allows vertical scrooling when contenet is too long */}
            <div className="p-3">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
      
            </div>

            {searchResults.length > 0 ? ( // search result output
              <div className="px-3">
                <p className="text-xs text-gray-400 mb-2">Search Results:</p>
                {searchResults.map(user => (
                  <div
                    key={user._id}
                    onClick={() => openDirectMessage(user.username)}
                    className="p-3 hover:bg-gray-700 rounded cursor-pointer mb-1"
                  >
                    <p className="text-white font-medium">{user.username}</p>
                  </div>  
                ))}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map(conv => (  // the list of people the user has chat history with
                <div
                  key={conv.with}
                  onClick={() => openDirectMessage(conv.with)}
                  className={`p-3 hover:bg-gray-700 cursor-pointer ${
                    currentChat?.name === conv.with ? 'bg-gray-700' : '' // selected chat color
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="text-white font-medium">{conv.with}</p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                  {/* truncate is used so that text remains in a single line */}
                  {/* conversation tab with last message */}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-400">
                <p>No conversations yet</p>    
                {/* if dm tab empty this message is shown */}
                <p className="text-xs mt-2">Search for users to start chatting</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3"> {/*this is for room chat entry which user can join by typing the room chat*/}
            <input
              type="text"
              placeholder="Room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && joinRoom(roomName)}
              // Is the key that was just pressed the Enter key if yes then joinRoom
              className="w-full px-3 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <button
              onClick={() => joinRoom(roomName)} // this is a manual trigger same as pressing the ENTER key
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Join Room
            </button>
          </div>
        )}
      </div>
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <h2 className="text-xl text-white font-bold">
            {currentChat
              ? currentChat.type === 'dm'
                ? currentChat.name
                : `# ${currentChat.name}`
              : 'Select a conversation'}

              {/* if current chat does not exist "display select a conversation",if it existis and is a dm then just write currentChat.name if not a dm it is a room so write # WITH THE name */}
          </h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3"> 
          {/* overflow-y-auto scrollbar appears only when needeed*/}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.senderUsername === user?.username ? 'justify-end' : 'justify-start' // if I send a message it goes to right if I recieve it goes to the left 
                // message sent by current user true so goes to the right 
                // message sent by another use false so goes to the left
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderUsername === user?.username    
                  // USER HAS BLUE AND WHTIE TEXT BOX AND SENDER HAS DARK GRAY AND WHITE TEXTBOX
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                {msg.senderUsername !== user?.username && ( 
                  // If message is from someone else → render username If it’s yours → don’t render anything
                  <p className="text-xs text-blue-300 mb-1">{msg.senderUsername}</p>
                )}
                <p>{msg.message}</p> 
                {/* MESSAGE BODY */}
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} /> 
        {/* DIV REF VALUE */}
        </div>

        {/* Typing Indicator */}
        {typingUser && (
          <div className="px-4 py-2 text-sm text-gray-400 italic">
            {typingUser} is typing...
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              disabled={!currentChat}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!currentChat || !messageInput.trim()} 
              // button is not clickable if no chat selected or input is empty
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
    
  );
};

export default ChatPage;

