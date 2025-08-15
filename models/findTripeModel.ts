import { model, Schema } from "mongoose";

interface IFindTripe extends Document {
  _id: String;
  tripe: {
    distance: String;
    time: String;
    pickUpPoint: {
      point: {
        coordinates: [Number];
      };
      address: String;
    };
    dropOff: {
      point: {
        coordinates: [Number];
      };
      address: String;
    };
  };
  price: Number;
}
 const findTripSchema = new Schema<IFindTripe>({
  price: { type: Number, required: true },
  tripe: {
    distance: { type: String, required: [true] },
    time: { type: String, required: [true] },
    pickUpPoint: {
      point: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: [Number],
      },
      address: String,
    },
    dropOff: {
      point: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: [Number],
      },
      address: String,
    },
  },
});

const FindTripe = model<IFindTripe>("FindTripe", findTripSchema);

export default FindTripe;