import { Socket ,Server} from 'socket.io';
import { ClientToServer, ServerToClient, InterServer, SocketData } from '../types';
import { Message } from '../../models/Message';

type TypedSocket = Socket<ClientToServer, ServerToClient, InterServer, SocketData>;
type TypedServer = Server<ClientToServer,ServerToClient,InterServer,SocketData>;

export const registerRoomHandlers = (io:TypedServer,socket: TypedSocket) => {
    const username = socket.data.username || 'Anonyomus'
    const userId = socket.data.userId

    socket.on('join room', async (roomName: string) => { 
        socket.join(roomName);
        socket.emit('joined', `you joined ${roomName}`);  
        socket.to(roomName).emit('notification', `${username} joined the room`);  

         try {
        const message = await Message.find({room:roomName,messageType:'room'})
        .sort({timestamp:-1})
        .limit(50)
        .lean()
        
        socket.emit('room history',{  
            room: roomName,
            messages: message.reverse()
        })
    } catch (error) {
        console.error('Error fetching room history',error)
        
    }
    });

    socket.on('room message', async (data) => { 

        try {
            const newMessage = new Message({
                sender: userId,
                senderUsername: username,
                room : data.room , 
                message: data.message, 
                messageType: 'room' 
            })
            await newMessage.save()

            const messageData = {
                user: username , 
                message : data.message,
                room: data.room,
                timestamp: newMessage.timestamp
            }
            io.to(data.room).emit('room message',messageData)  
        } catch (error) {
            console.error('Error saving room',error)
            socket.emit('notification','failed to send message')
        }
    });

    socket.on('leave room', (roomName: string) => {
        socket.leave(roomName);
        socket.to(roomName).emit('notification', `${username} left the room`);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected', username);
    });
};