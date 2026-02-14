import {Router,Request,Response} from 'express'
import {User} from '../models/User'
import {generateToken} from '../utils/jwt'
import {AuthRequest,authenticate} from '../socket/middleware/auth'

const router = Router()

router.post('/register',async(req:Request,res:Response)=>{
    try{
        const {username,email,password} = req.body;

        if(!username||!email||!password){
            return res.status(400).json({error:'All fields are requied'})
        }
        if(password.length <6){
            return res.status(400).json({error:'Password must be atleast 6 characters'})
        }
        const existingUser = await User.findOne({$or:[{email:email},{username:username}]})
        if(existingUser){
            return res.status(400).json({error:'User already exists'})
        }
        const user = new User({username,email,password})
        await user.save()
        
        const token = generateToken({
            userId: user._id.toString(),
            username: user.username,
            email: user.email
        })

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user:{
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    }   
    catch(error:any){
        res.status(500).json({error:error.message})
    }
})

router.post('/login',async(req:Request,res:Response)=>{
    try{
        const {email,password} = req.body
        if(!email||!password){
            return res.status(400).json({error:"Invalid credentials"})
        }
        const user = await User.findOne({email})
        if(!user){
            return res.status(401).json({error:"user does not exist"})
        }
        const isMatch = await user.comparePassword(password)
        if(!isMatch){
            return res.status(401).json({error:"incorrect password"})
        }
        const token = generateToken({
            userId: user._id.toString(),
            username: user.username,
            email: user.email
        })
        res.json({
            message: 'login successful',
            token,
            user:{
                id: user._id , 
                username : user.username,
                email : user.email
            }
        })
    }
    catch(error:any){
        res.status(500).json({error:error.message})
    }
})

router.get('/me',authenticate,async(req:AuthRequest,res:Response)=>{
    try{
        const user = await User.findById(req.user?.userId).select('-password')
        if(!user){
            return res.status(404).json({error:'User not found'})
        }
        res.json({user})
    }
    catch(error:any){
        res.status(500).json({error:error.message})
    }
})

export default router; 