import {Socket} from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import {verifyToken} from '../../utils/jwt'
import {ClientToServer,InterServer,ServerToClient,SocketData} from '../types'

type TypedSocket = Socket<ClientToServer,ServerToClient,InterServer,SocketData>;

export const socketAuthMiddleware = (
    socket: TypedSocket,
    next: (err?:ExtendedError)=> void 

)=>{
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if(!token){
            return next(new Error('Authentication error: No token provided'))
        }
        const decoded = verifyToken(token)

        socket.data.userId = decoded.userId
        socket.data.username = decoded.username
        
        next()
    } catch (error) {
        next(new Error('Authorization error: Invalid token'))
    }
}