import bcrypt from "bcryptjs";
import { Schema, model, Document } from "mongoose";

interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "captain";
  online: boolean;
  socketId?: String;
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
    password: { type: String, required: true, minlength: 6, select: false },
    online: { type: Boolean, required: [true, "online is Req"] },
    socketId: { type: String },
    role: { type: String, enum: ["user", "captain"], default: "user" },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    vehicleType: { type: String, enum: ["car", "motorbike", "bicycle"] },
    licenseNumber: { type: String },
    nationalId: { type: String },
    location: {
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: [Number],
      },
    },
  },
  { timestamps: true }
);

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.distance = async function (coordinates: {
  type: string;
  coordinates: [number, number];
}): Promise<number> {
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

  return distance;
};
const User = model<IUser>("User", userSchema);

export default User;
