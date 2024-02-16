import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username : {
      type: String,
      required: true,
      unique: true,
      lowercase: true, 
      trim: true,
      index: true, // helps in serching in the database
    },
    email : {
      type: String,
      required: true,
      unique: true,
      lowercase: true, 
      trim: true, 
    },
    fullName : {
      type: String,
      required: true, 
      trim: true,
      index: true,
    },
    avatar : {
      type: String, // clodniary url
      required: true,
    },
    coverImage: {
      type:String // cloudniary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    password: { 
      type: String, 
      required: [true, "Password is required"]
    }, 
    refreshToken: {
      type: String,
    }
  }
, {timestamps : true})

// using mongoose pre hook for encryption
// in the pre, as a call back we are not using arrow function as it will have problem holding on the current context, meaning this, we need acces i.e why we use normal function 
userSchema.pre("save", async function (next) {
  // we are using next to pass the flag 
  // encrypt only when we are sending the password field  =>  in case of updation or creation
  if(!this.isModified("password")) return next(); // checking 
  this.password = await bcrypt.hash(this.password, 10) 
  next() 
})

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password) // returns true or false comparing the hashed password and password passed as parameter 
}

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    { //payload
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCRESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCRESS_TOKEN_EXPIRY
    }
  ) // generates token
}
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { //payload
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  ) // generates token
}

export const User = mongoose.model("User", userSchema)