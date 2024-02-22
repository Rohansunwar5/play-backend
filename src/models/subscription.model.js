import mongoose , {Schema} from "mongoose";

const subscriptionSchema = new Schema({
  subscriber : {
    type : Schema.Types.ObjectId, // one who is subscribing 
    ref: "User"
  },
  channel: {
    type: Schema.Types.ObjectId, // subscriber who is subscribing to user's Channel
    ref: "User"
  }

},{timestamps: true})


export const Subscription = mongoose.model("Subscription", subscriptionSchema);