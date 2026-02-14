
export interface RoomMessageData {
    room: string;
    message: string;
}
export interface SocketData {
    username?: string;
    userId?: string;
}

export interface DirectMessageData{
    recipientUsername : string
    message: string
}

export interface GetConversationData{
    recipientUsername: string
    limit?: number
}
export interface TypingData{
    recipientUsername: string
}

export interface conversationHistoryData{
    with: string;
    messages: any[]
}

export interface ServerToClient {  
    joined: (message: string) => void;
    notification: (message: string) => void;
    'room message': (data: {
        user: string;
        message: string;
        room: string;
    }) => void;
    'room history':(data:{
        room: string,
        messages: any[]
    }) => void;
    'direct message':(data:{
        from: string,
        fromUserId: string,
        message: string,
        timestamp : Date;
    }) => void; 
    'message sent':(data:{
        to: string,
        message: string,
        timestamp: Date;
    }) => void;
    'conversation history':(data: conversationHistoryData) => void
    'conversations list': (conversations: any[]) => void;
    'user typing': (data: { from: string }) => void;
    'user stop typing': (data: { from: string }) => void;
    'user online': (data: SocketData) => void;
    'user offline': (data: SocketData) => void;
}

export interface ClientToServer {  
    'join room': (roomName: string) => void;
    'room message': (data: RoomMessageData) => void;
    'leave room': (roomName: string) => void;
    'direct message': (data:DirectMessageData) =>void 
    'get conversation': (data:GetConversationData)=> void
    'get conversations': () => void;
     'typing':(data:TypingData) =>void
    'stop typing':(data: TypingData) => void
}

export interface InterServer { 
    ping: () => void;
}

