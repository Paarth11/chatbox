import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Register: React.FC = ()=>{
    const [username,setUsername] = useState('')
    const [email,setEmail] = useState('')
    const [password,setPassword]  = useState('')
    const [error,setError] = useState('')
    const [isLoading,setIsLoading] = useState(false)
    const {register} = useAuth()
    const navigate = useNavigate()

    const handleSumit = async(e:React.FormEvent) =>{
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            await register(username,email,password)
            navigate('/chat')
        } catch (error:any) {
            setError(error.response?.data?.error || 'Registration failed')    
        }finally{
            setIsLoading(false)
        }
    }
    return(
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
                <h2 className="text 3xl font-bold text-white mb-6 text-center">Register</h2>
                {error&&(
                    <div className="bg-red-500 text-white p-3 rounded mb-4"> 
                        {error}
                    </div>
                )}
                <form onSubmit={handleSumit}className="space-y-4">
                    <div>
                        <label className="block text-gray-300 mb-2">UserName</label>
                        <input
                        type="text"
                        value={username}
                        onChange={(e)=>setUsername(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        />    
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2">Email</label>
                        <input
                        type="email"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2">Password</label>
                        <input
                        type="password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded foucs:outline-none foucs:ring-2 focus:ring-blue-500"
                        required
                        minLength={6}
                        />
                    </div>
                    <button
                    type="submit"
                    disabled = {isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                    >
                        {isLoading?'Registering':'Register'}
                    </button>
                </form>
                <p className="text-gray-400 text-center mt-4">
                    Already Have an Account?{''}
                    <button
                    onClick={()=>navigate('/login')}
                    className="text-blue-400 hover:text-blue-300"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    )
}

export default Register;