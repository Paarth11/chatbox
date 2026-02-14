import mongoose ,{Document,Schema} from 'mongoose'

export interface IMessage extends Document{
    sender : mongoose.Types.ObjectId
    senderUsername : string 
    recipient? : mongoose.Types.ObjectId
    recipientUsername : string 
    room? : string
    message: string 
    messageType: 'room' | 'direct'
    timestamp: Date
    read: boolean
}

const messageSchema = new Schema<IMessage>({
    sender:{
        type:Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderUsername:{
        type: String,
        required: true
    },
    recipient:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    recipientUsername:{
        type: String,
        required: function (this: IMessage) {  
            return this.messageType === 'direct';
        }
    },
    room:{
        type: String,
        required: false
    },
    message:{
        type: String,
        required: true
    },
    messageType:{
        type: String,
        enum:['room','direct'],
        required: true
    },
    timestamp:{
        type: Date,
        required: true,
        default: Date.now
    },
    read:{
        type: Boolean,
        required: true,
        default: false
    }
})

messageSchema.index({sender:1,recipient:1,timestamp:-1})
messageSchema.index({room:1,timestamp:-1})

export const Message = mongoose.model<IMessage>('Message',messageSchema)
