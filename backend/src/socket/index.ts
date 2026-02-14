import { Server as HttpServer } from 'http'; 
import { Server } from 'socket.io'; 
import { corsOrigins } from '../config/cors';
import { ClientToServer, ServerToClient, InterServer, SocketData } from './types';
import { registerRoomHandlers } from './handlers/roomHandlers';
import {socketAuthMiddleware} from './middleware/authMiddleware'
import { registerDirectMessageHandlers } from './handlers/directMessageHandlers';

 export const activeUsers = new Map<string,string>(); 

export const initializeSocket = (server: HttpServer) => {  
    const io = new Server<ClientToServer, ServerToClient, InterServer, SocketData>(server, {
        cors: {
            origin: corsOrigins,
            credentials: true  
        }
    });

    io.use(socketAuthMiddleware) 

    io.on('connection', (socket) => { 
        console.log('user connected', socket.id);
        if(socket.data.userId){
            activeUsers.set(socket.data.userId,socket.id)
        }
        registerRoomHandlers(io,socket) 
        registerDirectMessageHandlers(io,socket)

        socket.emit('notification',`Welcome ${socket.data.username}`)

        socket.broadcast.emit('user online',{  
            userId: socket.data.userId,
            username: socket.data.username
        })

        socket.on('disconnect',()=>{
            console.log('user disconnected',socket.id,'username',socket.data.username)
            if(socket.data.userId){
                activeUsers.delete(socket.data.userId)
            }
            socket.broadcast.emit('user offline',{
                userId: socket.data.userId,
                username: socket.data.username
            })
        })

    });

    return io;  
};