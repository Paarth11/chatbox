import { Server, Socket } from 'socket.io';
import { ClientToServer, ServerToClient, InterServer, SocketData, DirectMessageData, GetConversationData, TypingData } from '../types';
import { Message } from '../../models/Message';
import { Conversation } from '../../models/Conversation';
import { User } from '../../models/User';
import { activeUsers } from '../index';

type TypedSocket = Socket<ClientToServer, ServerToClient, InterServer, SocketData>;
type TypedServer = Server<ClientToServer, ServerToClient, InterServer, SocketData>;

export const registerDirectMessageHandlers = (io: TypedServer, socket: TypedSocket) => {

    const username = socket.data.username || 'Anonymous';
    const userId = socket.data.userId;


    socket.on('direct message', async (data: DirectMessageData) => { 
        try {
            const { recipientUsername, message } = data; 
            
            const recipient = await User.findOne({ username: recipientUsername });
            if (!recipient) {
                socket.emit('notification', 'User not found');
                return;
            }
                                                                                        
            const newMessage = new Message({
                sender: userId,
                senderUsername: username,
                recipient: recipient._id,
                recipientUsername: recipientUsername,
                message: message,
                messageType: 'direct',
                timestamp: new Date(),
                read: false
            });

            await newMessage.save();

            let conversation = await Conversation.findOne({
                participants: { $all: [userId, recipient._id] } 
            });

            if (!conversation) {
                conversation = new Conversation({
                    participants: [userId, recipient._id],
                    participantUsernames: [username, recipientUsername],
                    lastMessage: message,
                    lastMessageTime: new Date()
                });
            } else {
                conversation.lastMessage = message; 
                conversation.lastMessageTime = new Date(); 
                
                const currentCount = conversation.unreadCount.get(recipient._id.toString()) || 0;
                conversation.unreadCount.set(recipient._id.toString(), currentCount + 1);
            }

            await conversation.save();

            const messageData = { 
                from: username,
                fromUserId: userId!,
                message: message,
                timestamp: newMessage.timestamp
            };

            const recipientSocketId = activeUsers.get(recipient._id.toString());
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('direct message', messageData); 
            }

            
            
        } catch (error) {
            console.error('Error sending direct message:', error);
            socket.emit('notification', 'Failed to send message');
        }
    });

    socket.on('get conversation', async (data: GetConversationData) => { 
        try {
            const recipientUsername = data.recipientUsername
            const limit = data.limit ?? 50; 

            const recipient = await User.findOne({ username: recipientUsername });
            if (!recipient) {
                socket.emit('notification', 'User not found');
                return;
            }

            const messages = await Message.find({
                messageType: 'direct',
                $or: [
                    { sender: userId, recipient: recipient._id },  
                    { sender: recipient._id, recipient: userId }  
                ]
            })
            .sort({ timestamp: -1 }) 
            .limit(limit) 
            .lean();

            await Message.updateMany(
                {
                    sender: recipient._id, 
                    recipient: userId, 
                    read: false 
                },
                { read: true } 
            );

            const conversation = await Conversation.findOne({
                participants: { $all: [userId, recipient._id] }
            });

            if (conversation) {
                conversation.unreadCount.set(userId!, 0);  
                await conversation.save();
            }

            socket.emit('conversation history', { 
                with: recipientUsername,
                messages: messages.reverse()
            });

        } catch (error) {
            console.error('Error fetching conversation:', error);
            socket.emit('notification', 'Failed to fetch conversation');
        }
    });

    
    socket.on('get conversations', async () => { 
        try {
            const conversations = await Conversation.find({ 
                participants: userId
            })
            .sort({ lastMessageTime: -1 })
            .lean();

            const conversationList = conversations.map(conv => ({
                with: conv.participantUsernames.find(u => u !== username),  
                lastMessage: conv.lastMessage,
                lastMessageTime: conv.lastMessageTime,
                unreadCount:
                    conv.unreadCount instanceof Map
                        ? (conv.unreadCount.get(userId!) || 0)
                        : ((conv.unreadCount as Record<string, number> | undefined)?.[userId!] || 0)
            }));

            socket.emit('conversations list', conversationList); 

        } catch (error) {
            console.error('Error fetching conversations:', error);
            socket.emit('notification', 'Failed to fetch conversations');
        }
    });


    socket.on('typing', async (data: TypingData) => {
        try {
            const { recipientUsername } = data;
            
            const recipient = await User.findOne({ username: recipientUsername });
            if (recipient) {
                const recipientSocketId = activeUsers.get(recipient._id.toString());
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('user typing', {
                        from: username
                    });
                }
            }
        } catch (error) {
            console.error('Error handling typing indicator:', error);
        }
    });

    socket.on('stop typing', async (data: TypingData) => {
        try {
            const { recipientUsername } = data;
            
            const recipient = await User.findOne({ username: recipientUsername });
            if (recipient) {
                const recipientSocketId = activeUsers.get(recipient._id.toString());
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('user stop typing', {
                        from: username
                    });
                }
            }
        } catch (error) {
            console.error('Error handling stop typing indicator:', error);
        }
    });
};
