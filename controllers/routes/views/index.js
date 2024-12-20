const express = require('express');
const { resolve } = require('path');
const {
  Candidate,
  CandidateProject,
  CandidateReference,
  CandidateCareer,
  CandidateQualification,
  Qualification,
  Company
} = require('../../models');

const router = express.Router();

const viewsPath = resolve(__dirname, '..', '..', '..', 'public', 'views');

router.get('/:companyId?/:candidateId', async (req, res) => {
  try {
   const isCompany=await Company.findOne({_concernPerson:req.params.companyId})
   let isMasked = await Company.findOne({_concernPerson:req.params.companyId, unmasked: {$in: [req.params.candidateId]}}).select("_id");
    const populate = [
      {
         path: "techSkills.id",
         select: "name",
      },
      {
         path: "nonTechSkills.id",
         select: "name",
      },
      {
         path: "experiences.Industry_Name",
         select: "name",
      },
      {
         path: "experiences.SubIndustry_Name",
         select: "name",
      },
      ,
      {
         path: "experiences.Company_State",
         select: "name",
      },
      {
         path: "experiences.Company_City",
         select: "name",
      },
      {
         path: "qualifications.Qualification",
         select: "name",
      },
      {
         path: "qualifications.subQualification",
         select: "name",
      },
      {
         path: "qualifications.University",
         select: "name",
      },
      {
         path: "qualifications.University",
         select: "name"
      },
   ];
    const select = 'name email mobile address careerObjective interests';
    const data = await Candidate.findById(req.params.candidateId).populate(populate)//.select(select);
    if (!data) throw req.ykError('Candidate not exist!');
    const enrollmentFormPath = resolve(viewsPath, 'candidateForm.ejs');
    if(!isMasked&&isCompany){
      data.mobile=0
      data["email"]="XXXXXXXXXX"
    }
    const candidateData = data || {};
    const query = { status: true, _candidate: candidateData._id };
    const candidateCareer = await CandidateCareer.find(query);
    const candidateQual = await CandidateQualification.find(query);
    const candidateProject = await CandidateProject.find(query);
    const candidateReference = await CandidateReference.find(query);
    const qualification = await Qualification.find({status: true}).sort({basic:-1})
    return res.render(enrollmentFormPath, {
      isMasked,
      candidateData,
      candidateCareer,
      candidateQual,
      candidateProject,
      candidateReference,
      qualification
    });
  } catch (err) {
   console.log(err)
    req.flash('error', err.message || 'Something went wrong!');
    return res.redirect('back');
  }
});


module.exports = router;
