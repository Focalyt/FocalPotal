
    const { Schema, model } = require("mongoose");
    const { ObjectId } = Schema.Types;


    const candidatedoc = new Schema({
        _candidate: { type: ObjectId, ref: 'Candidate' },
        Photograph: { type: String }, 
        AadharCardFront: { type: String }, 
        AadharCardBack: { type: String }, 
        ResidenceCertificate: { type: String },
        CasteCertificate: { type: String},
        RationCard: { type: String },
        '10thMarksheet': { type: String}, 
        '12thMarksheet': { type: String },
        DiplomaMarksheet: { type: String },
        BachelorDegreeMarkSheets: { type: String },
        DegreePassingCertificate: { type: String },
        PassportNationalityCertificate: { type: String },
        MigrationCertificateTransferCertificate: { type: String },
        GapCertificate: { type: String },
        Signature:{type:String},
        ProfessionalExperienceCertificate: { type: String },
            AdditionalDocuments: { type: [String] },
    }, { timestamps: true });
    

module.exports =model("CandidateDoc",candidatedoc) ;
