import React,{createContext,useContext,useEffect,useState} from "react";
import type { ReactNode } from "react";
import {io} from 'socket.io-client'
import type {Socket} from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean
}

const SocketContext = createContext<SocketContextType|undefined>(undefined);

export const SocketProvider: React.FC<{children:ReactNode}> = ({children}) =>{
    const [socket,setSocket] = useState<Socket|null>(null);
    const [isConnected,setIsConnected] = useState(false);
    const {token} = useAuth()

    useEffect(()=>{
        if(token){
            const newSocket = io('http://localhost:5000',{ 
                auth:{token}
            })

            newSocket.on('connect',()=>{
                console.log('Connected to Server')
                setIsConnected(true)
            })

            newSocket.on('disconnect',()=>{
                console.log('disconnected from server')
                setIsConnected(false)
            })

            setSocket(newSocket)

            return()=>{
                newSocket.close() 
            }
        }
        else{
            if(socket){ 
                socket.close();
                setSocket(null)
                setIsConnected(false);
            }
        }
    },[token])

    return(
        <SocketContext.Provider value={{socket,isConnected}}>
            {children}
        </SocketContext.Provider>
    )
}

export const useSocket = ()=>{
    const context = useContext(SocketContext);
    if(!context){
        throw new Error('useSocket must be use within Socket Provider')
    }
    return context;
}