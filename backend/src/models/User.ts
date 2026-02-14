import mongoose ,{Document,Schema} from 'mongoose'
import bcrypt from 'bcrypt'

export interface IUser extends Document{
    username: string 
    email: string
    password: string
    createdAt: Date
    comparePassword(candidatePassword:string):Promise<boolean>
}

const userSchema = new Schema<IUser>({
    username:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 3
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    } ,
    password:{
        type: String,
        required: true,
        minlength: 3
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return 
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword:string): Promise<boolean>{
    return bcrypt.compare(candidatePassword,this.password);
}

export const User = mongoose.model<IUser>('User',userSchema)