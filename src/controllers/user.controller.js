import { asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudniary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
// custom asyncHanlder that is a higher order function that accepts a function, so that we don't need to do promise for every function
const generateAccessAndRefreshTokens = async(userId) =>{
  try {
    
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    console.log(user);

    user.refreshToken = refreshToken // sending to database 
    // when saving moongose models also kicks in for example in the model.js we have made password as required true, so we use validateBeforeSave: false         
    await user.save({validateBeforeSave: false}) 
    
    return {accessToken, refreshToken}; // sending the reference

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and acces token")
  }
}


const registerUser = asyncHandler( async (req,res) => {
    
    // extracting from frontend 
    const {fullName, email, username , password} = req.body
    // console.log("request body",req.body);
    // validating 
    if([
      fullName, email, username, password
    ].some((field) => field?.trim() === "")){
      throw new ApiError(400, "All fields are required")
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
    throw new ApiError(400, "Invalid Email ID");
    }

    
    // user exists already or not 
    const existedUser = await User.findOne({
      $or:[{ username },{ email }] // checking for both email and username 
    })
    if(existedUser){
      throw new ApiError(409, "User with email or username already exist")
    }

    // console.log(" Request files " ,req.files);
    // check for images , files acces from multer 
    const avatarLocalPath = req.files?.avatar[0]?.path; //optional chaining
    // const coverImageLocalPath = req.files?.coverImage[0]?.path?? null;  this was returning undefined so had to make a classic check 
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
      throw new ApiError(400, "avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
      throw new ApiError(400, "avatar image is required");
    }

    // entry on data base
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "", // not compulsory, a corner case 
      email, 
      password,
      username: username.toLowerCase()
    })
    // checking if user is entered in db 
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken" // removing  the password & refresh token field from response body
    ); 

    if(!createdUser){
      throw new ApiError(500, "Something went wrong while registering user")
    }
    return res.status(201).json(
      new ApiResponse(200, createdUser , "User Registered Successfully ")
    )

})

const loginUser = asyncHandler(async (req, res) => {
  // req body => data 
  // username or email 
  // find the user 
  // password check 
  // access and refresh token 
  // send cokkie
  
  const {email, username, password} = req.body;
  console.log(email);
  if(!(username || email)) {
    throw new ApiError(400, "Username or password is required ")
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if(!user){
    throw new ApiError(400, "User does not exist")
  }

  // checking password
  // note the user we are taking here is the instance from local

  const isPasswordValid =  await user.isPasswordCorrect(password);

  if(!isPasswordValid){
    throw new ApiError(401, "Invalid User Credentials")
  }

  // If everything is ok then generate tokens and cookie and send them to client side

  const {accessToken, refreshToken} =  await generateAccessAndRefreshTokens(user._id)// passing id

  const LoggedInUser = await User.findById(user._id).select('-password -refreshToken')

  // sending cookies
  const options = {
    httpOnly: true, // by default anyone can modify cookies from thr frontend, so by stating  this option it will only be modifiable from the server 
    secure: true,
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options) // key value pairs 
  .cookie("refreshToken", refreshToken ,options)
  .json(
    new ApiResponse(
      200,
      {
        user: LoggedInUser, accessToken, refreshToken
      },
      "User logged in Successfully"
    )
  )
})

const logoutUser = asyncHandler(async(req, res) => {
  // clear out from  cookiess 
  // 
  await User.findByIdAndUpdate( // finds the user and make some changes
    req.user._id,
    {
      $set:{ // set is mongodb operator 
        refreshToken: undefined
      },
     
    }, 
    {
      new: true
    }   
  )
  const options = {
    httpOnly: true, 
    secure: true,
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User Logged Out"))
})

//in case of access token expiry, the refresh token is sent from the frontend and the refresh token in ht edb is comapred, if it matches , a new access token is created  

const refreshAccessToken = asyncHandler(async(req,res) => {
  const incomingRefreshToken =  await req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError (401, 'Unauthorized request')
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET
    )
  
    // taking access
    const user = await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"Invalid refresh token")
    }
  
    if(user?.refreshToken !== incomingRefreshToken){
      throw new ApiError(401, "Refresh token is expired or used")
    }
  
    const options= {
      httpOnly:true,
      secure: true,
    }
  
    const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken, newrefreshToken},
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError( 401, error?.message || "Invalid refresh Token");
  }


})

const changeCurrentPassword = asyncHandler(async (req,res) => {
  const {oldPassword, newPassword} = req.body

  // if(!(newPassword === confirmPassword)){
  //   throw new ApiError(400,'New password and Confirm Password do not match')
  // }

  const user = User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false});

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
  
})

const getCurrentUser = asyncHandler (async (req,res) => {
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "Current user fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async (req,res) => {
  const {fullName, email} = req.body

  if(fullName && email){ // doubt
    throw new ApiError(400, "All fields are required ")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName : fullName,
        email: email
      }
    },
    {new: true}
    ).select("-password ")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully "))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file missing")
  }
  
  //TODO delete old image 
  
  const avatar =  await uploadOnCloudinary(avatarLocalPath); // uploading in cloudnairy 
  if(!avatar.url){
    throw new ApiError(400, "Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id, 
    {
      $set: {
        avatar : avatar.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user, "Avatar updated successfully ")
  )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"Cover Image is missing!")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading coverIMage in cloudinary")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url,
      }
    },
    {new : true},
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "Cover Image updated successfully ")
  )
})
export {
  registerUser,
  loginUser,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  refreshAccessToken,
  updateAccountDetails,
  updateUserCoverImage,
  updateUserAvatar,
} 