import React,{useContext,createContext,useState,useEffect} from "react";
import type { ReactNode } from "react";
import axios from 'axios'

interface User{
    id: string;
    username: string;
    email: string;   
}

interface AuthContextType{
    user: User | null; 
    token: string | null;
    login: (email: string,password: string)=>Promise<void>;
    register: (username:string,email:string,password:string) =>Promise<void>;
    logout: ()=> void;
    isLoading: boolean;
}   

const AuthContext = createContext<AuthContextType|undefined>(undefined); 

export const AuthProvider: React.FC<{children: ReactNode}>= ({children}) =>{ 
                                                                          

    const [user,setUser] = useState<User|null>(null);
    const [token,setToken] = useState<string|null>(null);
    const [isLoading,setIsLoading] = useState(true);


    useEffect(()=>{
        const storedToken = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')

        if(storedToken&&storedUser){
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
        }
        setIsLoading(false);
    },[]) 

    const login = async(email:string,password:string) =>{
        const response = await axios.post('/api/auth/login',{email,password}) 
        const {token:newToken, user: newUser} = response.data;

        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token',newToken)
        localStorage.setItem('user',JSON.stringify(newUser))
    };

    const register = async(username:string,email:string,password: string)=>{
        const response = await axios.post('/api/auth/register',{username,email,password})
        const{token:newToken,user:newUser} = response.data

        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token',newToken);
        localStorage.setItem('user',JSON.stringify(newUser));
    }

    const logout = ()=>{
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    }

    return(
        <AuthContext.Provider value={{user,token,login,register,logout,isLoading}}>
            {children}   
        </AuthContext.Provider>
    )
}
    export const useAuth = ()=>{
        const context = useContext(AuthContext);
        if(!context){
            throw new Error('useAuth must be used within authProvider')
        }
        return context;
    }