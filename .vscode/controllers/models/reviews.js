const { Schema, model } = require("mongoose");
const { ratings } = require("../db/constant");
const { ObjectId } = Schema.Types;

const reviewSchema = new Schema(
  {
    _user: {
      type: ObjectId,
      ref: "Candidate",
      required: true,
    },
    _job: {
      type: ObjectId,
      ref: "Candidate",
      required: true,
    },
    rating: {
        type: Number,
        enum: ratings
    },
    comment: {
        type: String
    },
    status: {
      type: Boolean,
      default: true,
    },
    earning: Number,
  },
  { timestamps: true }
);

module.exports = model("Review", reviewSchema);
