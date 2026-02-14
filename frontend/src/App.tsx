import React from "react";
import { BrowserRouter,Routes,Route, Navigate } from "react-router-dom";
import { AuthProvider,useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ChatPage from "./pages/ChatPage";

const PrivateRoute: React.FC<{children:React.ReactNode}>= ({children})=>{
  const {token ,isLoading} = useAuth()

  if(isLoading){
    return(
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">
          Loading...
        </div>
      </div>
    )
  }
  return token ? <>{children}</>: <Navigate to={"/login"}/>
}

const PublicRoute : React.FC<{children: React.ReactNode}> = ({children}) =>{
  const {token,isLoading} = useAuth()
  if(isLoading){
    return(
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">
          Loading...
        </div>
      </div>
    )
  }
  return !token? <>{children}</>:<Navigate to = "/chat" />
}

function App(){
  return(
    <AuthProvider>  
      <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route
          path="/login"
          element={
            <PublicRoute>
              <Login/>
            </PublicRoute>
          }
          />

          <Route
          path="/register"
          element={
            <PublicRoute>
              <Register/>
            </PublicRoute>
          }
          />
          
          <Route
          path="/chat"
          element={
            <PrivateRoute>
              <ChatPage/>
            </PrivateRoute>
          }
          />
          <Route path="/" element={<Navigate to = '/chat'/>}/>
        </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App;