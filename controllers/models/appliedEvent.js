const { Schema, model } = require("mongoose");

const { ObjectId } = Schema.Types;

const appliedEventSchema = new Schema(
  {
    _candidate: {
      type: ObjectId,
      ref: "CandidateProfile",
      description: "Reference to the Candidate who applied for the event",
    },
    _event: {
      type: ObjectId,
      ref: "Event",
      description: "Reference to the specific event applied for",
    },
    registeredBy:{
      type: ObjectId,
      ref: "User",
      description: "Reference to the specific event applied for"
    },    
  
  },
  {
    timestamps: true, // Automatically adds `createdAt` and `updatedAt` fields
  }
);

// Attach descriptions for `timestamps`
appliedEventSchema.paths.createdAt.options.description = "Timestamp when the document was created";
appliedEventSchema.paths.updatedAt.options.description = "Timestamp when the document was last updated";

// Export the model
module.exports = model("AppliedEvent", appliedEventSchema);

