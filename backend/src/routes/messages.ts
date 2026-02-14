import {Router,Response } from 'express';
import { authenticate,AuthRequest } from '../socket/middleware/auth';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';


const router = Router()
router.use(authenticate) 

router.get('/conversations', async (req: AuthRequest, res: Response) => {
    try {  
        const userId = req.user?.userId;
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const conversations = await Conversation.find({
            participants: userId
        })
        .sort({ lastMessageTime: -1 })
        .lean();

        const conversationList = conversations.map(conv => {
            const otherUser = conv.participantUsernames?.find(u => u !== req.user?.username);
            const unreadCount = conv.unreadCount instanceof Map  
                ? (conv.unreadCount.get(userId) || 0)   
                : ((conv.unreadCount as any)?.[userId] || 0);                                                     
                
            
            return {
                with: otherUser || 'Unknown',
                lastMessage: conv.lastMessage || '',
                lastMessageTime: conv.lastMessageTime,
                unreadCount: unreadCount
            };
        });

        res.json({ conversations: conversationList });
    } catch (error: any) {
        console.error('Error in /conversations:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});


router.get('/conversation/:username',async(req:AuthRequest,res:Response)=>{
    try {
        const {username} = req.params
        const limit = parseInt(req.query.limit as string) || 50 

        const recipient = await User.findOne({username})
        if(!recipient){
            return res.status(500).json({error:'user not found'})
        }
        const messages = await Message.find({
            messageType: 'direct',
            $or: [
                {sender: req.user?.userId,recipient: recipient._id}, 
                {sender: recipient._id,recipient:req.user?.userId} 
            ]
        })
        .sort({timestamp:-1})
        .limit(limit)
        .lean()
         res.json({
            with: username,
            messages: messages.reverse()  
        });
    } catch (error:any) {
        res.status(500).json({error:error.message})
    }

})

router.get('/room/:roomName',async(req:AuthRequest,res:Response)=>{
    try {
        const {roomName} = req.params;
        const limit = parseInt(req.query.limit as string) || 50;

        const message = await Message.find({
            room: roomName,
            messageType: 'room'
        })
        .sort({timestamp:-1})
        .limit(limit)
        .lean()
        
        res.json({
            room: roomName,
            messages: message.reverse() 
        })
    } catch (error:any) {
        res.status(500).json({error:error.message})
    }

})

router.get('/unread',async(req:AuthRequest,res:Response)=>{
    try {
        const unreadCount = await Message.countDocuments({ 
            recipient: req.user?.userId, 
            read: false
        })
        res.json({unreadCount})

    } catch (error:any) {
        res.status(400).json({error:error.message})
    }
})

router.put('/read/:username', async (req: AuthRequest, res: Response) => { 
    try {
        const { username } = req.params;

        const sender = await User.findOne({ username });

        if (!sender) {
            return res.status(404).json({ error: 'User not found' });
        }

        await Message.updateMany(
            {
                sender: sender._id, 
                recipient: req.user?.userId, 
                read: false 
            },
            {read:true} 
        );


        const conversation = await Conversation.findOne({ 
            participants: { $all: [req.user?.userId, sender._id] }
        });

        if (conversation) {
            conversation.unreadCount.set(req.user?.userId || '', 0); 
            await conversation.save(); 
        }

        res.json({ message: 'Messages marked as read' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/users/search', async (req: AuthRequest, res: Response) => { 
    try {
        const { q } = req.query;
        
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Search query required' });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } }, 
                { email: { $regex: q, $options: 'i' } }
            ],
            _id: { $ne: req.user?.userId } 
        })
        .select('username email')   
        .limit(10) 
        .lean();

        res.json({ users });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;