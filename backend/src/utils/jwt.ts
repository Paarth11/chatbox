import jwt from 'jsonwebtoken'
import type { StringValue } from 'ms'
import dotevn from 'dotenv'

dotevn.config()

const JWT_SECRET: string = process.env.JWT_SECRET as string
const JWT_EXPIRES_IN: number | StringValue =
  (process.env.JWT_EXPIRES_IN as StringValue) ?? '7d'

export interface JwtPayLoad {
  userId: string
  username: string
  email: string
}

export const generateToken = (payload: JwtPayLoad): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

export const verifyToken = (token: string): JwtPayLoad => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayLoad 
  } catch {
    throw new Error('Invalid or expired token')
  }
}

