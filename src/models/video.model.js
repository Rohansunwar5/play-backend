import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; // this helps in  paginating the results of an aggregate query.


const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // using cloudnairy url
      required: [true, "Cannot be empty"]
    },
    thumbnail: {
      type: String, // cloudnairy 
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String, // description
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default : true,
    }, 
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }

  }
, {timestamps:true})



videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video", videoSchema)