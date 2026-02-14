import http from 'http'; 
import dotenv from 'dotenv';
import { createApp } from './app';
import { initializeSocket } from './socket';
import {connectDatabase} from './config/database'

dotenv.config();

const app = createApp(); 
const server = http.createServer(app); 
const io = initializeSocket(server); 

const PORT = process.env.PORT;

const startServer  = async()=>{
    try {
        await connectDatabase();
        server.listen(PORT,()=>{
            console.log(`server running on ${PORT}`)
        }) 
    } catch (error) {
         console.error('failed to start server',error)
         process.exit(1)  
    }
}
startServer()

process.on('SIGTERM',()=>{
    console.log('SIGTERM singal recieved:closing htp server') 
    server.close(()=>{
        console.log('HTTP SERVER CLOSED')
    })   
})

export { app, server, io };
