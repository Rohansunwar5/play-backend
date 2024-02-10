const asyncHandler = (requestHandler) => {
  (req, res, next) => {
    Promise
    .resolve(requestHandler(req,res,next))
    .catch((err) => next(err))
  }
}


export {asyncHandler};

// const asyncHandler = () => {}  different ways 
// const asyncHandler = (func) => () => {} 
// const asyncHandler = (func) => async() => {} 


// this is a wrapper fucntion
// const asyncHandler = (fun) => async(req,res,next,err) => {
//   try {
//     await fun(req,res,next)
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message
//     })
//   }
// }