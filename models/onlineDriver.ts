import { Schema, Document, Model, model, Double } from "mongoose";

interface IOnlineDriver extends Document {
  userId: string;
  vehicleType: "car" | "motorbike" | "bicycle";
  location: {
    type: "Point";
    coordinates: number[];
  };
  socketId: string;
  heading: number;
}
const onlineDriverSchema = new Schema<IOnlineDriver>(
  {
    userId: { type: String, required: true },
    vehicleType: {
      type: String,
      enum: ["car", "motorbike", "bicycle"],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    socketId: { type: String, required: true },
    heading: { type: Number, required: true },
  },
  { timestamps: true }
);

onlineDriverSchema.index({ location: "2dsphere" });

const OnlineDriver = model<IOnlineDriver>("OnlineDriver", onlineDriverSchema);

export default OnlineDriver;
