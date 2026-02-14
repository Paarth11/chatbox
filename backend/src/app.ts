import express, { Application } from 'express';
import cors from 'cors'
import authRoutes from './routes/auth'
import messageRoute from './routes/messages'
import { corsOrigins } from './config/cors';
import path from 'path';

export const createApp = (): Application => { 
    const app: Application = express(); 

       app.use(cors({
        origin: corsOrigins,
        credentials: true
       }))
           app.use(express.json()); 
           app.use(express.urlencoded({extended: true})) 
           app.use(express.static(path.join(__dirname,'../public'))) 

           app.use('/api/auth',authRoutes)  
           app.use('/api/messages',messageRoute) 

           app.get('/health',(req,res)=>{
            res.json({status:"ok",message: "server is running"})
           })
    return app;
};
