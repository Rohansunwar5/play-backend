import { asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudniary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

// custom asyncHanlder that is a higher order function that accepts a function, so that we don't need to do promise for every function
// get user details from frontend 
// validation - not empty 
// check if user already exists : username , email 
// check for images, check for avatar 
// upload them to cloudnairy, avatar 
// create user object - create entry in db 
// remove password and refresh token field from response 
// check for user creation 
// return res 
const registerUser = asyncHandler( async (req,res) => {
    
    // getting details from frontend 
    const {fullName, email, username , password} = req.body
    console.log("email: ", email);
    // validating 
    if([
      fullName, email, username, password
    ].some((field) => field?.trim() === "")){
      throw new ApiError(400, "All fields are required")
    }
    if(!email.includes("@")  && !email.endsWith(".com")) {
      throw  new ApiError(400, "Invalid Email ID")
    }
    // user exists already or not 
    const existedUser = User.findOne({
      $or:[{ username },{ email }] // checking for both email and username 
    })
    if(existedUser){
      throw new ApiError(409, "User with email or username already exist")
    }
    // check for images , files acces from multer 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // console.log(req.body);

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
    const createdUser = await User.findById(user.__id).select(
      "-password -refreshToken" // removing  the password & refresh token field from response body
    ); 

    if(!createdUser){
      throw new ApiError(500, "Something went wrong while registering user")
    }
    return res.status(201).json(
      new ApiResponse(200, createdUser , "User Registered Successfully ")
    )

})

export {
  registerUser,
} 