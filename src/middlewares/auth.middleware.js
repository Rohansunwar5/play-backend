// verify weather user is present or not 

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler (async (req, _, next) => {
  try {
    let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer", "")// authorization for mobile 
  
    if(!token){
      throw new ApiError(401, "Unauthorized request")
    }
  
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const  user = await User.findById(decodedToken?._id).select("-password -refreshToken")
      // from user.model
    if(!user) {
      // TODO discuss about frontend 
      throw new ApiError(401, "Invalid Access Token")
    }
  
    req.user = user;
    next() // adding to the req header and sending to the next 
  } catch (error) {
    throw new ApiError (401, error?.message || "Invalid access")
  }
})