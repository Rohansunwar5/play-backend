import multer from "multer";

const storage = multer.diskStorage({
  destination: function ( req, file, cb){
    cb(null, './public/temp')
  },
  filename: function (req, file , cb){
    
    cb(null,file.originalname);
  }
})

// this storage can be used in the controllers with path and callback function  to handle errors or success of uploading process

export const upload = multer ({ 
  storage,
})