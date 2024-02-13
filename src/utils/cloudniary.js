import {v2 as cloudinary} from 'cloudinary';
import fs from "fs" // fs is file system inside node js          

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUDNAME, 
  api_key: process.env.CLOUDINARY_APIKEY, 
  api_secret: process.env.CLOUDINARY_API_KEY, 
});

// take the file upload in local server and upload later to cloudinary and unlink the file 
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath){
      return null
    }

    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
    // file has been uploaded successfully 
    console.log("file is uploaded on cloudinary", response.url);
    return response
  } catch (error) {
    // unlinking the locally saved temp file as the operation got failed 
    fs.unlinkSync(localFilePath)
    return null;
  }
}