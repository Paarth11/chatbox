import {Request,Response,NextFunction} from 'express'
import {JwtPayLoad,verifyToken} from '../../utils/jwt'

export interface AuthRequest extends Request{ 
    user?: JwtPayLoad
}

export const authenticate = (req: AuthRequest,res:Response,next:NextFunction)=>{
    try{
        const authHeader  = req.headers.authorization;
        if(!authHeader||!authHeader.startsWith('Bearer')){
            return res.status(401).json({error:'No token provided'})
        }
        const token = authHeader.substring(7);  
        const decoded = verifyToken(token)  

        req.user = decoded;
        
        next();  
    }
    catch(error){
        return res.status(401).json({error:'invalid or expired token'});
    }
}

