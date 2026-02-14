import mongoose,{Document,Schema} from 'mongoose'

export interface Iconversation extends Document{ 
    participants: mongoose.Types.ObjectId[]
    participantUsernames: string[]
    lastMessage: string
    lastMessageTime: Date
    unreadCount: Map<string,number>
}

const conversationSchema = new Schema<Iconversation>({
    participants:[{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    participantUsernames:[{
        type: String,
    }],
    lastMessage:{
        type: String,   
        default: ''
    },
    lastMessageTime:{
        type: Date,
        default: Date.now
    },
    unreadCount:{
        type: Map,
        of: Number,
        default : new Map()
    }
    },
    {
        timestamps: true
    }
)

conversationSchema.index({participants:1})

export const Conversation = mongoose.model<Iconversation>('Conversation',conversationSchema);

