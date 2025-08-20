import bcrypt from "bcryptjs";
import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: "user" | "driver";
  online: boolean;
  socketId?: string;
  profileImage: string;
  isVerified: boolean;
  vehicleType?: "car" | "motorbike" | "bicycle";
  licenseNumber?: string;
  nationalId?: string;
  location?: { coordinates: [Number] };
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber:{type: String, required:[true, "phoneNumber is Req"]},
    password: { type: String, required: true, minlength: 6, select: false },
    online: { type: Boolean, required: [true, "online is Req"] },
    socketId: { type: String,default:null },
    role: { type: String, enum: ["user", "driver"], default: "user" },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    vehicleType: { type: String, enum: ["car", "motorbike", "bicycle"] },
    licenseNumber: { type: String },
    nationalId: { type: String },
    location: {
  type: {
    type: String,
    enum: ["Point"],
    default: "Point",
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
},

  },
  { timestamps: true }
);
userSchema.index({ location: "2dsphere" });
userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.distance = async function (coordinates: {
  type: string;
  coordinates: [number, number];
}): Promise<String> {
  const [lon1, lat1] = this.location.coordinates;
  const [lon2, lat2] = coordinates.coordinates;

  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return distance.toString();
};
const User = model<IUser>("User", userSchema);

export default User;
