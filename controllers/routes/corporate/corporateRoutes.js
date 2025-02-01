const express = require("express");
const moment = require("moment");
const { permittedCrossDomainPolicies } = require("helmet");
const Razorpay = require('razorpay');
const { ykError, baseUrl } = require("../../../config");
const fs = require('fs')
const ObjectId = require("mongodb").ObjectId;
const mongoose = require('mongoose');
const { candidateCashbackEventName, cashbackRequestStatus, cashbackEventType } = require('../../db/constant')
const { CompanyValidators } = require('../../../helpers/validators')
const {
  User,
  Skill,
  Company,
  Candidate,
  Qualification,
  State,
  City,
  Industry,
  SubIndustry,
  Vacancy,
  Vouchers,
  VoucherUses,
  JobCategory,
  SubQualification,
  HiringStatus,
  coinsOffers,
  PaymentDetails,
  CoinsAlgo,
  Consumption,
  CashBackLogic,
  CandidateCashBack,
  AppliedJobs,
  Notification
} = require("../../models");
const { candidateHiringStatusCashBack, checkCandidateCashBack } = require('../services/cashback')
const candidateServices = require('../services/candidate')
const users = require("../../models/users");
const templates = require("../../models/templates")
const AWS = require("aws-sdk");
const { crypto, randomBytes } = require("crypto");
const { promisify } = require("util");
const {
  accessKeyId,
  secretAccessKey,
  bucketName,
  region,
  msg91ShortlistedTemplate,
  msg91Rejected,
  msg91Hired,
  msg91InterviewScheduled,
  msg91OnHoldTemplate,
  env
} = require("../../../config");

const router = express.Router();
const uuid = require("uuid/v1");
const puppeteer = require("puppeteer");
const path = require("path");
const { authenti, isCompany, getDistanceFromLatLonInKm, sendSms, isCandidate } = require("../../../helpers");
const candidate = require("../../models/candidate");
const { urlencoded } = require("body-parser");
const skills = require("../../models/skills");
const { validateHeaderValue } = require("http");
const { sendNotification } = require('../services/notification')

AWS.config.update({
  accessKeyId: accessKeyId, // id
  secretAccessKey: secretAccessKey, // secret password
  region: region,
});


const apiKey = process.env.MIPIE_RAZORPAY_KEY
const razorSecretKey = process.env.MIPIE_RAZORPAY_SECRET

router.route('/')
.get(async (req,res) => {
  let user = req.session.user
  if(user && user.role === 1){
    res.redirect("/company/dashboard");
  }
  else{
    res.redirect("/company/login");
  }
})

router.route("/dashboard").get(isCompany, async (req, res) => {
  try {
    const company = await Company.findOne({
      _concernPerson: req.session.user._id,
    }).select('_id availableCredit unmasked name creditLeft');
  
    const vacancyCount = await Vacancy.find({
      _company: company._id,
      status: true,
    }).countDocuments();
  
    let ongoingCandidates = await HiringStatus.find({ 
      company: company._id, 
      status: { $nin: ['shortlisted', 'Shortlisted', 'rejected'] }, 
      isDeleted: false 
    }).populate({ 
      path: 'candidate', 
      select: 'name highestQualification isExperienced totalExperience ' 
    }).limit(5);
  
    let shortlistedCandidates = await HiringStatus.find({ 
      company: company._id, 
      isDeleted: false 
    }).countDocuments();
  
    let jobs = await Vacancy.find({ _company: company._id, status: true }).select('_id');
  
    let populate = [
      {
        path: '_job',
        select: 'title'
      },
      {
        path: '_candidate',
        select: 'name totalExperience highestQualification qualifications',
        populate:{
          path: 'highestQualification',
          select: 'name',
          model:'Qualification'
        }
      }
    ];  

    
    let appliedCandidates = await AppliedJobs.find({ _company: company._id })
      .populate(populate)
      .sort({ createdAt: -1 })
      .limit(5);
    let qualifications = await Qualification.find({ status: true,isDeleted:false }).select('_id name');
    const menu = "dashboard";
    res.render(`${req.vPath}/app/corporate/dashboard`, {
      company,
      menu,
      vacancyCount,
      ongoingCandidates,
      shortlistedCandidates,
      appliedCandidates,
      qualifications
    });
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});


router
  .route("/myProfile")  
  .get(isCompany, async (req, res) => {
    const menu = "myProfile";
    let user = await users.findOne({
      mobile: req.session.user.mobile,
      role: "1",
    });
    const company = await Company.findOne({ _concernPerson: user._id });
    const state = await State.find({
      countryId: "101",
      status: { $ne: false },
    });
    let hasState = false;
    let st = {};
    if (company.stateId && company.stateId.length > 3) {
      hasState = true;
      st = await State.findOne({ _id: company.stateId });
    } else {
      hasState = false;
    }

    const city = hasState
      ? await City.find({ stateId: st.stateId, status: { $ne: false } })
      : [];
    const industry = await Industry.find({ status: true });
    const subIndustry = await SubIndustry.find({ status: true });
    res.render(`${req.vPath}/app/corporate/myProfile`, {
      menu,
      user,
      state,
      company,
      industry,
      subIndustry,
      city,
    });
  })
  .post(isCompany, async (req, res) => {
    // const { email, mobile } = req.body.personalInfo;
    const company = await Company.findOne({
      _concernPerson: req.session.user._id,
    });
    if (company.isProfileCompleted == false) {
      let notificationData = {
        title: 'Profile Completion',
        message: `Congratulations! Your profile is complete.`,
        _company: company._id,
        source: 'System'
      }
      await sendNotification(notificationData)
    }
    if (!company) throw req.ykError("Company doesn't exist!");
    const userUpdatedFields = {};
    if (req.body.concernedPerson) {
      Object.keys(req.body.concernedPerson).forEach((key) => {
        if (req.body.concernedPerson[key] !== "") {
          userUpdatedFields[key] = req.body.concernedPerson[key];
        }
      });
    }

    const userUpdate = await User.findOneAndUpdate(
      { mobile: req.session.user.mobile, role: "1" },
      userUpdatedFields
    );

    if (!userUpdate) throw req.ykError("User not updated!");

    const updatedFields = {};
    if (req.body.executiveinfo && req.body.executiveinfo.length > 0) {
      updatedFields["companyExecutives"] = req.body.executiveinfo;
    }

    // let galary = req.body.companyInfo[mediaGallery]

    if (req.body.companyInfo) {
      Object.keys(req.body.companyInfo).forEach((key) => {
        if (req.body.companyInfo[key] !== "") {
          updatedFields[key] = req.body.companyInfo[key];
        }
      });
    }

    if (updatedFields["mediaGallery"]) {
      updatedFields["mediaGallery"] = company.mediaGallery.concat(
        updatedFields["mediaGallery"].split(",")
      );
    }

    const industryValue = await Industry.findOne({
      _id: updatedFields.industry,
    });
    const subIndustryValue = await SubIndustry.findOne({
      _id: updatedFields.subindustry,
    });
    delete updatedFields.industry;
    delete updatedFields.subindustry;

    if (industryValue) {
      updatedFields["_industry"] = industryValue._id;
    }

    if (subIndustryValue) {
      updatedFields["_subIndustry"] = subIndustryValue._id;
    }

    const companyUpdate = await Company.findOneAndUpdate(
      { _concernPerson: req.session.user._id },
      updatedFields,
      { new: true }
    ).populate({ path: '_concernPerson' });


    if (companyUpdate != null && companyUpdate.name != null && companyUpdate._industry != null &&
      companyUpdate._subIndustry != null && companyUpdate.stateId != null && companyUpdate.cityId != null
      && companyUpdate._concernPerson.name != null && companyUpdate._concernPerson.mobile != null &&
      companyUpdate._concernPerson.email != null && companyUpdate._concernPerson.designation != null &&
      companyUpdate._concernPerson.whatsapp != null) {

      await Company.findOneAndUpdate({ _id: companyUpdate._id }, { $set: { isProfileCompleted: true } })

    }

    if (!companyUpdate) throw req.ykError("Candidate not updated!");
    req.flash("success", "Company updated successfully!");
    res.send({ status: 200, message: "Profile Updated Successfully" });
  });

router.get("/search-candidates", isCompany, async (req, res) => {
  const menu = "search-candidates";
  res.render(`${req.vPath}/app/corporate/searchCandidates`, { menu });
});
router.get("/list-candidates", isCompany, async (req, res) => {
  let data = req.query;
  const menu = "list-candidates";
  const qualification = await Qualification.find({ status: true }).sort({ basic: -1 })
  const company = await Company.findOne({
    _concernPerson: req.session.user._id,
  });
  let companyLat = Number(company.latitude);
  let companyLong = Number(company.longitude)
  const filterFields = {
    status: true,
    isProfileCompleted: true,
    isDeleted: false,
    visibility: true
  };
  if (!company) throw req.ykError("Company doesn't exist!");
  let shortlistedCandidates = [];
  let shortlisted = await HiringStatus.find({ company: company._id, isDeleted: false }).select('_id candidate')
  shortlisted.forEach((i) => {
    shortlistedCandidates.push(new mongoose.Types.ObjectId(i.candidate));
  });
  filterFields._id = { $nin: shortlistedCandidates };

  if (data.stateId) {
    filterFields["locationPreferences"] = { $elemMatch: { state: new mongoose.Types.ObjectId(data.stateId) } }
  }
  if (data.cityId) {
    filterFields["locationPreferences"] = { $elemMatch: { city: new mongoose.Types.ObjectId(data.cityId) } }
  }
  if (data.highestqualification) {
    filterFields["highestQualification"] = data.highestqualification;
  }
  if (data.experience) {
    data.experience == "0"
      ? (filterFields["$or"] = [
        { isExperienced: false },
        { totalExperience: { $gte: Number(data.experience) } },
      ])
      : (filterFields["totalExperience"] = { $gte: Number(data.experience) });
  }
  if (data.subQualification) {
    filterFields["qualifications"] = { $elemMatch: { subQualification: new mongoose.Types.ObjectId(data.subQualification) } }
  }
  if (data.gender) {
    filterFields["sex"] = data.gender;
  }
  if (data.techSkills) {
    filterFields["techSkills"] = { $elemMatch: { id: new mongoose.Types.ObjectId(data.techSkills) } }
  }
  if (data.nonTechSkills) {
    filterFields["nonTechSkills"] = { $elemMatch: { id: new mongoose.Types.ObjectId(data.nonTechSkills) } }
  }
  let sorting = []
  if (data.jdLocation) {
    let loc = data.jdLocation.split(',')
    companyLong = Number(loc[0])
    companyLat = Number(loc[1])
  }else{
    sorting = [
      { $sort: { appliedJobs: -1} }
    ]
  }
  const perPage = 20;
  const p = parseInt(req.query.page);
  const page = p || 1;
  const count = await Candidate.find({...filterFields, location: { $exists: true }}).countDocuments();
  let agg = candidateServices.companyCandidateList(sorting, perPage, page, filterFields, [companyLong, companyLat], company._id)
  let candidates = await Candidate.aggregate(agg)
  const totalPages = Math.ceil(count / perPage);
  const pageCount = candidates.length
  const state = await State.find({ countryId: "101" });
  let cityByState;
  let city;
  if (data.stateId) {
    cityByState = state.findIndex((x) => x._id == req.query.stateId);
    city = await City.find({
      stateId: state[cityByState].stateId,
      status: { $ne: false },
    });
  }
  let subQualification = await SubQualification.find({ status: true })
  let skills = await Skill.find({ status: true })
  let today = moment().startOf('day').toDate()
  const jobs = await Vacancy.find({ _company: company._id, status: true, validity: {$gte: today} });
  const coinsRequired = await CoinsAlgo.findOne().select("SMS shortlist")
  let vacancies = await Vacancy.find({ _company: company._id, location: {$exists: true}, status: true, validity: {$gte: today} }).select('location title')
  let template = await templates.find({ status: true }).select("name templateId categories message")

  res.render(`${req.vPath}/app/corporate/listCandidates`, {
    menu,
    candidates,
    state,
    qualification,
    city,
    data,
    totalPages,
    page,
    subQualification,
    skills,
    company,
    jobs,
    count,
    template,
    coinsRequired,
    pageCount,
    jdLocation: vacancies
  });
});

router.post("/promote", isCompany, async (req, res) => {
  try {
    let consume = {};
    if (req.body) {
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== "") {
          consume[key] = req.body[key];
        }
      })
    }
    const company = await Company.findOne({
      _concernPerson: req.session.user._id,
    }).select();
    consume._company = company._id;
    const consumeTemplate = await Consumption.create(consume)
    if (!consumeTemplate) {
      console.log("not created")
    }
    else {
      return res.send({ status: 200, consumeTemplate });
    }
  } catch (e) {
    res.status(500).send({ status: false, msg: e.message });
  }
})
router.get("/candidate/shortlisted", isCompany, async (req, res) => {
  try {
    const menu = "shortlisted-candidates";
    let user = req.companyUser;
    let filterType = req.query.filterType;
    let data = req.query;
    let company = await Company.findOne({ _concernPerson: user });
    let filter = {
      company: company._id,
      status: { "$regex": `${filterType || ''}`, "$options": "i" },
      isDeleted: false
    }
    const perPage = 20;
    const p = parseInt(req.query.page);
    const page = p || 1;

    let numberCheck = isNaN(data?.name)
    let candidateFilter = {}
    let name = ''

    var format = `/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;`;
    data?.name?.split('').some(char => {
      if (!format.includes(char))
        name += char
    })

    if (name && numberCheck) {
      candidateFilter["$or"] = [
        { "candidate.0.name": { "$regex": name, "$options": "i" } },
      ]
    }
    if (data.name && !numberCheck) {
      candidateFilter["$or"] = [
        { "candidate.0.name": { "$regex": name, "$options": "i" } },
        { "candidate.0.mobile": Number(name) },
        { "candidate.0.whatsapp": Number(name) }
      ]
    }

    let countCandidates = await HiringStatus.aggregate([
      { '$match': filter },
      {
        '$lookup': {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { '$match': candidateFilter },
      {
        '$lookup': {
          from: 'subqualifications',
          localField: 'candidate.0.qualifications.0.subQualification',
          foreignField: '_id',
          as: 'subQual'
        }
      },
      {
        '$lookup': {
          from: 'vacancies',
          localField: 'candidate.0.appliedJobs',
          foreignField: '_id',
          as: 'appliedJobs'
        }
      },
      {
        '$project': {
          'appliedJobs': {
            '$filter': {
              input: "$appliedJobs",
              as: "item",
              cond: { $eq: ["$$item._company", company._id] }
            }
          },
          'candidate': 1,
          'status': 1,
          'subQual': 1,
          'createdAt': 1
        }
      },
      {
        '$facet': {
          metadata: [{ '$count': "total" }],
          data: [{ $skip: perPage * page - perPage }, { $limit: perPage }]
        }
      }
    ])

    let count = countCandidates[0].metadata[0]?.total
    if (!count) {
      count = 0
    }
    const totalPages = Math.ceil(count / perPage);

    const qualification = await Qualification.find({ status: true }).sort({ basic: -1 }).select('_id name')
    res.render(`${req.vPath}/app/corporate/shortlistedCandidates`, {
      menu,
      candidates: countCandidates[0].data,
      qualification,
      countCandidates,
      filterType,
      totalPages,
      page,
      data
    });
  } catch (err) {
    console.log("================>err  ", err);
  }
});

router
  .route("/register")
  .get(async (req, res) => {
    res.render(`${req.vPath}/app/corporate/register`);
  })
  .post(async (req, res) => {
    try {
      const { value , error } = await CompanyValidators.register(req.body)
      if (error) {
				console.log('====== register error ', error, value)
				return res.send({ status: "failure", error: "Something went wrong!" });
			}
      const { firstName, lastName, email, phoneNumber, companyName } = value;
     
      let checkEmail = await users.findOne({
        email: email,
        isDeleted: false,
        role: "1",
      });
      let checkNumber = await users.findOne({
        mobile: phoneNumber,
        isDeleted: false,
        role: "1",
      });
      if (checkNumber || checkEmail) {
        return res.send({
          status: "failure",
          error: "Number and Email already exists!",
        });
      }

      const name = firstName + " " + lastName;
      if (!checkEmail && !checkNumber) {
        const user = await User.create({
          name,
          email,
          mobile: phoneNumber,
          role: 1,
        });
        if (!user) {
          return res.send({
            status: "failure",
            error: "Company user not created!",
          });
        }
        let coins = await CoinsAlgo.findOne()
        let company = await Company.create({
          _concernPerson: user._id,
          name: companyName,
          availableCredit: coins?.companyCoins,
          creditLeft: coins?.companyCoins
        });
        if (!company) {
          return res.send({ status: "failure", error: "Company not created!" });
        }
        let notificationData = {
          title: 'Signup',
          message: `Complete your profile.`,
          _company: company._id,
          source: 'System'
        }
        await sendNotification(notificationData)
        return res.send({
          status: "success",
          message: "Company registered successfully",
        });
      }
    } catch (err) {
      req.flash("error", err.message || "Something went wrong!");
      return res.send({ status: "failure", error: "Something went wrong!" });
    }
  });
router.get("/login", async (req, res) => {
  let user = req.session.user 
  if(user && user.role == 1){
    res.redirect("/company/dashboard");
  }
  res.render(`${req.vPath}/app/corporate/login`);
});
router.get("/get-all-candidates", [isCompany], async (req, res) => {
  const candidates = await CandidateRegister.find({});
  const candidateArray = [];
  for (let i = 0; i < candidates.length; i++) {
    if (
      candidates[i].candidate_Qualification.length !== 0 &&
      candidates[i].candidate_Experiences.length !== 0
    ) {
      candidateArray.push({
        Id: candidates[i]._id,
        qualification: candidates[i].candidate_Qualification[0].Qualificaton,
        subQualification:
          candidates[i].candidate_Qualification[0].subQualification,
        Experience: candidates[i].candidate_Experiences[0].Experience,
      });
    }
  }
  res.send({ status: 200, candidates: JSON.stringify(candidateArray) });
});
router.get(
  "/get-candidate-details",
  [isCompany, authenti],
  async (req, res) => {
    const { userId } = req.query;
    const candidates = await Candidate.findOne({ _id: userId });
    const concernedPersonId = req.user._id;
    const companyDetails = await Company.findOne({ _concernPerson: concernedPersonId, status: true, isDeleted: false });
    if (!companyDetails) {
      return res.status(404).send({ status: false, msg: 'Company not found!' })
    }
    let coins = await CoinsAlgo.findOne({})
    if (!companyDetails.creditLeft || companyDetails.creditLeft < coins.shortlist) {
      return res
        .status(400)
        .send({ status: false, msg: "Please Subscribe to Unmask More!" });
    }
    else if (companyDetails.unmasked && companyDetails.unmasked.includes(userId)) {
      return res.send({ status: false, msg: 'Already Unmasked!' })
    }
    else {
      let jobCoins = await CoinsAlgo.findOne()
      let shortlist = await Company.findOneAndUpdate(
        { _concernPerson: concernedPersonId },
        { $addToSet: { unmasked: userId }, $inc: { creditLeft: - jobCoins.shortlist } },
        { upsert: true, new: true }
      );
      if (!shortlist) {
        return res
          .status(400)
          .send({ status: false, msg: "Unmasking Failed!" });
      } else {
        await HiringStatus.create({ candidate: userId, company: companyDetails._id, status: 'shortlisted' })
        await checkCandidateCashBack(candidates)
        await candidateHiringStatusCashBack(candidates, candidateCashbackEventName.shortlisted)
        let phone = '91' + candidates.mobile.toString();
        let num = parseInt(phone)
        let body = {
          flow_id: msg91ShortlistedTemplate,
          recipients: [
            {
              mobiles: num,
              candidatename: candidates.name,
              companyname: companyDetails.name
            }
          ]

        }
        const data = sendSms(body);
        let notificationData = {
          title: 'Shortlisting',
          message: `Congratulations! ${companyDetails.name} has shortlisted your profile.__बधाई हो! आपको ${companyDetails.name} कंपनी ने शॉर्टलिस्ट किया है`,
          _candidate: userId,
          source: 'System'
        }
        await sendNotification(notificationData)
      }
    }
    let dataNew = {
      title: 'Candidate Status Update',
      message: `You have shortlisted ${candidates.name}`,
      _company: companyDetails._id,
      source: 'System'
    }
    await sendNotification(dataNew)
    res.status(200).send({
      name: candidates.name,
      email: candidates.email,
      mobile: candidates.mobile
    });
  }
);
router.get("/candidate/:candidateId", [isCompany], async (req, res) => {
  let menu
  let { src } = req.query
  if (src == 'onGoing') { menu = "ongoing-candidates"; }
  else if (src == 'shortlisted') { menu = "shortlisted-candidates"; }
  else { menu = "list-candidates"; }
  const user = req.companyUser;
  let company = await Company.findOne({ _concernPerson: user }).select('companyExecutives _id unmasked availableCredit creditLeft');

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
    { path: "locationPreferences.state", select: ["name"] },
    { path: "locationPreferences.city", select: ["name"] },
    { path: "state", select: ["name", "stateId"] },
    { path: "city", select: ["name"] },
    {
      path: "appliedJobs",
      match: { '_company': company._id },
      select: "_id",
    }
  ];

  const candidateId = req.params.candidateId;

  const candidate = await Candidate.findOne({
    _id: candidateId,
  }).populate(populate);


  let hiringStatus = await HiringStatus.findOne({ candidate: candidateId, company: company._id, isDeleted: false }, 'status createdAt updatedAt comment job eventDate concernedPerson')
    .populate({ path: 'job', select: 'title' })

  if (!hiringStatus) {
    candidate.mobile = "0";
    candidate.email = "XXXXXXXXXX";
    masked = true;
  } else {
    masked = false;
  }

  const qualification = await Qualification.find({ status: true }).sort({ basic: -1 })
  const jobs = await Vacancy.find({ _company: company._id, status: true })
  let coins = await CoinsAlgo.findOne({})
  res.render(`${req.vPath}/app/corporate/candidateProfile`, {
    candidate,
    menu,
    masked,
    jobs,
    hiringStatus,
    qualification,
    company,
    coins
  });
});

router.post("/removeimage", isCompany, async (req, res) => {
  const company = await Company.findOne({
    _concernPerson: req.session.user._id,
  });
  if (!company) throw req.ykError("Company doesn't exist!");

  let gallery = company.mediaGallery.filter((i) => i !== req.body.key);
  const companyUpdate = await Company.findOneAndUpdate(
    { _concernPerson: req.session.user._id },
    { mediaGallery: gallery }
  );
  if (!companyUpdate) throw req.ykError("Candidate not updated!");
  req.flash("success", "Company updated successfully!");
  res.send({ status: 200, message: "Profile Updated Successfully" });
});

router.post("/removevideo", isCompany, async (req, res) => {
  const company = await Company.findOne({
    _concernPerson: req.session.user._id,
  });
  if (!company) throw req.ykError("Company doesn't exist!");

  const companyUpdate = await Company.findOneAndUpdate(
    { _concernPerson: req.session.user._id },
    { mediaGalaryVideo: '' }
  );
  if (!companyUpdate) throw req.ykError("Candidate not updated!");
  req.flash("success", "Company updated successfully!");
  res.send({ status: 200, message: "Profile Updated Successfully" });
});

router.post("/removelogo", isCompany, async (req, res) => {
  const company = await Company.findOne({
    _concernPerson: req.session.user._id,
  });
  if (!company) throw req.ykError("Company doesn't exist!");

  const companyUpdate = await Company.findOneAndUpdate(
    { _concernPerson: req.session.user._id },
    { logo: "" }
  );
  if (!companyUpdate) throw req.ykError("Candidate not updated!");
  req.flash("success", "Company updated successfully!");
  res.send({ status: 200, message: "Profile Updated Successfully" });
});
router.post("/removeVideoJd/:_id", isCompany, async (req, res) => {
  const vacancy = await Vacancy.findOne({
    _id: req.params._id,
  });
  if (!vacancy) throw req.ykError("Vacancy doesn't exist!");

  const vacancyUpdate = await Vacancy.findOneAndUpdate(
    { _id: req.params._id },
    { jobVideo: "" }
  );
  if (!vacancyUpdate) throw req.ykError("Vacancy not updated!");
  req.flash("success", "Vacancy updated successfully!");
  res.send({ status: 200, message: "Vacancy Updated Successfully" });
});
router.get("/list/jobs", isCompany, async (req, res) => {
  try {
    const menu = "jobList";
    const userId = req.session.user._id;
    const user = await User.findOne({ _id: userId })
    const company = await Company.findOne({ _concernPerson: userId, status: true })
    let shortlistedCandCount;
    let canAdd = false;
    let perPage = 20;
    let p = parseInt(req.query.page);
    let page = p || 1;
    let count;
    let jd;
    let totalPages;
    if (!company) {
      res.render(`${req.vPath}/app/corporate/all-jd`, { menu, jd, totalPages, page, shortlistedCandCount, canAdd, company, isExist: false });
    }
    shortlistedCandCount = await HiringStatus.aggregate([
      {
        $match: {
          job: { $ne: null },
          isDeleted: false
        }
      },
      {
        $group:
        {
          _id: { job: '$job' },
          count: { $sum: 1 }
        }
      }
    ])
    populate = [
      {
        path: "_qualification",
        select: "name",
      },
    ];
    canAdd = false
    if (company.name && user.email && user.mobile && company.cityId && company.stateId && user.whatsapp
      && user.designation && user.name && company._industry ) {
      canAdd = true
    }

    count = await Vacancy.find({ _company: company, validity: { $gte: moment().utcOffset('+05:30') } }).countDocuments()
    jd = await Vacancy.find({ _company: company }).select("title experience _qualification createdAt status validity")
      .populate(populate)
      .sort({ createdAt: -1 })
      .skip(perPage * page - perPage)
      .limit(perPage)

    if (!jd) {
      return res.send({ status: false, message: "No job description yet" });
    }
    totalPages = Math.ceil(count / perPage);
    res.render(`${req.vPath}/app/corporate/all-jd`, { menu, jd, totalPages, page, shortlistedCandCount, canAdd, company, isExist: true });
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, message: err })
  }
});

router.get("/getcities", async (req, res) => {
  const { stateId } = req.query;
  const cities = await City.find({ stateId: stateId });
  res.send({ cities });
});
router.get("/getcitiesbyId", async (req, res) => {
  const { stateId } = req.query;
  const state = await State.findOne({ _id: stateId, status: { $ne: false } });
  const cityValues = await City.find({ stateId: state.stateId, status: { $ne: false } });
  res.status(200).send({ cityValues });
});

router.get("/getTemplateByCategory", async (req, res) => {
  const { value } = req.query;
  const template = await templates.find({ categories: value })
  return res.status(200).send({ template });

})
router.get("/checkCompany", async (req, res) => {
  const { userMail } = req.query;
  let user = await users.findOne({ email: userMail });
  const company = await Company.findOne({ _concernPerson: user._id });
  res.send({ status: 200, companyName: company.name, userName: user.name });
});
router.get("/jobs/:id", isCompany, async (req, res) => {
  let menu = "view-jd";
  const populate = [
    {
      path: "_industry",
      select: "name",
    },
    {
      path: "_jobCategory",
      select: "name",
    },
    {
      path: "_qualification",
      select: "name",
    },
    {
      path: "_subQualification",
      select: "name",
    },
    {
      path: "state",
      select: "name",
    },
    {
      path: "city",
      select: "name",
    },
    {
      path: "_techSkills",
      select: "name",
    },
    {
      path: "_nonTechSkills",
      select: "name",
    },
  ];
  const jd = await Vacancy.findOne({
    _id: req.params.id,
  }).populate(populate);
 console.log(jd)
  const populateForCandidate = [
    {
      path: '_candidate',
      select: 'name highestQualification qualifications sex isExperienced totalExperience _id mobile whatsapp',
      populate: {
        path: 'qualifications.0.Qualification', select: 'name'
      }
    }
  ]
  let appliedCandidates = await AppliedJobs.find({ _job: req.params.id }).populate(populateForCandidate)
  let qualifications = await Qualification.find({ status: true }).select('_id name');
  res.render(`${req.vPath}/app/corporate/view-jd`, { menu, jd, appliedCandidates, qualifications });
});
async function getUploadedURL() {
  let regionName = region;
  let bucket = bucketName;
  let accessKey = accessKeyId;
  let secretKey = secretAccessKey;
  const s = new AWS.S3({
    regionName,
    accessKey,
    secretKey,
    signatureVersion: "v4",
  });
  const rawBytes = await randomBytes(16);
  const imageName = rawBytes.toString("hex");
  const params = {
    Bucket: bucket,
    Key: imageName,
    Expires: 60,
  };
  const uploadURL = await s.getSignedUrlPromise("putObject", params);
  return uploadURL;
}
router.get("/upload-on-s3", isCompany, async (req, res) => {
  const { type, ext, email } = req.query;
  const user = await users.findOne({ email: email });
  let regionName = region;
  let bucket = bucketName;
  let accessKey = accessKeyId;
  let secretKey = secretAccessKey;
  const s3 = new AWS.S3({
    regionName,
    accessKey,
    secretKey,
    signatureVersion: "v4",
  });
  // const rawBytes=await randomBytes(16);
  // const imageName=rawBytes.toString('hex');
  // const params=({
  //     Bucket:bucket,
  //     Key:imageName,
  //     Expires:60
  // })
  // const uploadURL=await s.getSignedUrlPromise('putObject',params);
  // return uploadURL;
  const key = `uploads/${user._id}/${uuid()}.${ext}`;
  const params = {
    Bucket: bucket,
    ContentType: type,
    Key: key,
  };
  return s3.getSignedUrl("putObject", params, (err, url) => {
    if (err) throw err;
    if (!url) throw req.ykError();
    return res.status(200).send({ status: true, data: { url, key } });
  });
});

router.get('/editJobs/:id', isCompany, async (req, res) => {
  try {
    let company = await Company.findOne({ _concernPerson: req.companyUser }).select('name creditLeft availableCredit')
    let menu = "edit-jd"
    const state = await State.find({ countryId: "101", status: { $ne: false }, });
    const industry = await Industry.find({ status: true });
    const coinsRequired = await CoinsAlgo.findOne().select("contactcoins")
    const jobCategory = await JobCategory.find({ status: true });
    const qualification = await Qualification.find({ status: true });
    const techskills = await Skill.find({ type: 'technical', status: true });
    const nontechskills = await Skill.find({ type: 'non technical', status: true });
    const subQualification = await SubQualification.find({ status: true });
    const jd = await Vacancy.findOne({ _id: req.params.id, status: true });
    console.log('=====================> JD is ', jd)
    let hasState = false;
    let st = {};
    if (jd?.state) {
      hasState = true;
      st = await State.findOne({ _id: jd?.state });
    } else {
      hasState = false;
    }
    const city = hasState
      ? await City.find({ stateId: st.stateId })
      : [];
    res.render(`${req.vPath}/app/corporate/editJob`, {
      menu,
      jd,
      industry,
      qualification,
      subQualification,
      jobCategory,
      state,
      techskills,
      nontechskills,
      city,
      hasState,
      company,
      coinsRequired,
    })
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err })
  }
})
router.post('/editJobs/:jobId', isCompany, async (req, res) => {
  try {
    const coinsRequired = await CoinsAlgo.findOne().select("contactcoins");
    const updatedJob = {}
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== '') {
          updatedJob[key] = req.body[key];
        }
      });
      if (req.body.latitude && req.body.longitude) {
        updatedJob['loc'] = {
          type: 'Point',
          coordinates: [req.body.longitude, req.body.latitude]
        }
      }
    }
    const company = await Company.findOne({ _concernPerson: req.session.user._id })
    updatedJob._company = company._id
    const industryValue = await Industry.findOne({
      _id: updatedJob.industry
    })
    const job = await Vacancy.findOne({ _id: req.params.jobId })
    if (!job) {
      return res.status(400).send({ status: 'false', message: "Job not found" })
    }
    if(job?.isedited){
      updatedJob['isedited'] = true
    }
    if (req.body.isContact == true) {
      updatedJob['nameof'] = req.body.nameof;
      console.log("here>>>>>>>>>> inside is conastct")
      updatedJob['phoneNumberof'] = req.body.phoneNumberof;
      updatedJob['whatsappNumberof'] = req.body.whatsappNumberof;
      updatedJob['emailof'] = req.body.emailof;
    } else {
      updatedJob['nameof'] = "";
      updatedJob['phoneNumberof'] = "";
      updatedJob['whatsappNumberof'] = "";
      updatedJob['emailof'] = "";
    }
    if (updatedJob["isEdit"] == "true") {
      updatedJob[ "_subQualification"] = []
    }
    if (industryValue) {
      updatedJob['_industry'] = industryValue._id
    }
   
    const coins = +(coinsRequired.contactcoins)
    if (updatedJob.isContact == true && updatedJob.isedited == true && job?.isedited == false) {
      let jobDetails = await Company.findOneAndUpdate(
        { _concernPerson: req.session.user._id },
        {
          $inc: { creditLeft: -coins },
        },
        { new: true, upsert: true }
      );
      
    }
    
    const jd = await Vacancy.findOneAndUpdate({ _id: req.params.jobId }, updatedJob);
    if (!jd) {
      return res.send({ status: 'false', error: 'job updation failed' });
    } else {
      return res.send({ status: true, message: "job updated" })
    }
  } catch (e) {
    console.log("errr", e)
    res.status(500).send({ status: false, msg: e.message })
  }
});


router
  .get("/addjobs/:id?", isCompany, async (req, res) => {
    try {
      const { id } = req.params;
      let vacancy, city;
      if (id) {
        vacancy = await Vacancy.findOne({ _id: id, status: true });
      }
      if (vacancy) {
        let st = {};
        if (vacancy?.state) {
          st = await State.findOne({ _id: vacancy?.state, status: { $ne: false } });
        }
        city = await City.find({ stateId: st.stateId, status: { $ne: false } })
      }
      let company = await Company.findOne({ _concernPerson: req.companyUser }).select('name creditLeft availableCredit')
      const menu = "addjobs";
      const coinsRequired = await CoinsAlgo.findOne().select("contactcoins")
      const industry = await Industry.find({ status: true });
      const jobCategory = await JobCategory.find({ status: true });
      const qualification = await Qualification.find({ status: true });
      const subQualification = await SubQualification.find({ status: true });
      const state = await State.find({ countryId: "101" });
      const techskills = await Skill.find({ type: "technical", status: true });
      const nontechskills = await Skill.find({ type: "non technical", status: true });
      res.render(`${req.vPath}/app/corporate/add-jd`, {
        menu,
        industry,
        jobCategory,
        qualification,
        state,
        techskills,
        nontechskills,
        subQualification,
        vacancy,
        city,
        company,
        coinsRequired,
      });
    } catch (err) {
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("/company/list/jobs");
    }
  })
  .post("/addjd", async (req, res) => {
    try {
      const coinsRequired = await CoinsAlgo.findOne().select("contactcoins")
      const jobDetails = {};
      const company = await Company.findOne({
        _concernPerson: req.session.user._id,
        status: true
      });
      if (!company) {
        req.flash('error', 'Your company is deactivated')
        return res.redirect("/company/list/jobs");
      }
      console.log(req.body,"+++++>")
      if (req.body) {
        Object.keys(req.body).forEach((key) => {
          if (req.body[key] !== "") {
            jobDetails[key] = req.body[key];
          }
        });
        if (req.body.latitude && req.body.longitude) {
          jobDetails['location'] = {
            type: 'Point',
            coordinates: [req.body.longitude, req.body.latitude]
          }
        }
      }
      const companyId = await Company.findOne({
        _concernPerson: req.session.user._id,
        status: true
      });

      jobDetails._company = companyId._id;
      if (jobDetails['isEdit'] == "true") {
        jobDetails['_subQualification'] = []
      }
      if (jobDetails.isContact == true) {
        jobDetails['nameof'] = req.body.nameof;
        jobDetails['phoneNumberof'] = req.body.phoneNumberof;
        jobDetails['whatsappNumberof'] = req.body.whatsappNumberof;
        jobDetails['emailof'] = req.body.emailof;
        jobDetails['isedited'] = true
      } else {
        jobDetails['nameof'] = "";
        jobDetails['phoneNumberof'] = "";
        jobDetails['whatsappNumberof'] = "";
        jobDetails['emailof'] = "";
      }
      const jd = await Vacancy.create(jobDetails);
      
      const coins = +(coinsRequired.contactcoins)
      if (jobDetails.isContact === true || jobDetails.isContact === "true") {
        if(company.creditLeft>=coins){
          let jobDetails = await Company.findOneAndUpdate(
            { _concernPerson: req.session.user._id },
            {
              $inc: { creditLeft: -coins },
            },
            { new: true, upsert: true }
          );
        }
      }
      let data = {
        title: 'Job Posted',
        message: `You have posted job for ${jd.title}.`,
        _company: companyId._id
        , source: 'System'
      }
      await sendNotification(data)
      if (!jd) {
        return res.send({ status: "false", error: "job description failed" });
      } else {
        return res.send({ status: true, message: "job added" })
      }
    } catch (e) {
      console.log(e)
      res.status(500).send({ status: false, msg: e.message });
    }
  });

router.post("/candidate/statusUpdate", [isCompany, authenti], async (req, res) => {
  const user = req.companyUser;
  const { candidate, status, job, comment, eventDate, concernedPerson } = req.body;
  if (!candidate || !status) {
    return res
      .status(400)
      .send({ status: false, msg: "Status has to be selected !" });
  }
  const company = await Company.findOne({ _concernPerson: user, status: true, isDeleted: false });
  if (!company) {
    return res.status(400).send({ status: false, msg: "No such Company Found!" })
  }
  let hiringDetails = {
    candidate,
    company: company._id,
    status,
    isDeleted: false
  }
  if (status == 'rejected') {
    hiringDetails['isRejected'] = true
  }
  if (job) {
    hiringDetails["job"] = job
  }
  if (comment) {
    hiringDetails["comment"] = comment
  }
  if (eventDate) {
    hiringDetails['eventDate'] = eventDate
  }
  if (concernedPerson) {
    hiringDetails['concernedPerson'] = concernedPerson
  }
  const candidateDetails = await Candidate.findOne({ _id: candidate, isDeleted: false, status: true }).select("name mobile")
  if (!candidateDetails) {
    return res.status(404).send({ status: false, message: "Candidate doesn't exist" })
  }
  const candidateStatus = await HiringStatus.findOneAndUpdate({ company: company._id, candidate, isDeleted: false }, hiringDetails, { upsert: true })
  if (candidateStatus && status == 'interviewed') {
    let data = {
      title: 'Interview Scheduling',
      message: `Congratulations! ${company.name} has shortlisted your profile for the interview.`,
      _candidate: candidate
      , source: 'System'
    }
    await sendNotification(data)
  }
  if (!candidateStatus) {
    return res.status(400).send({ status: false, message: "Can't Update Candidate Hiring Status" })
  }
  if (status == 'hired') {
    await checkCandidateCashBack(candidateDetails)
    await candidateHiringStatusCashBack(candidateDetails, candidateCashbackEventName.hired)
  }
  let phone = '91' + candidateDetails.mobile.toString();
  let num = parseInt(phone)
  let body = {
    recipients: [
      {
        mobiles: num,
        candidatename: candidateDetails.name,
        companyname: company.name
      }
    ]
  }
  if (status == 'shortlisted') {
    body["flow_id"] = msg91ShortlistedTemplate
  }
  else if (status == 'rejected') {
    body["flow_id"] = msg91Rejected
  }
  else if (status == 'hired') {
    body["flow_id"] = msg91Hired
  }
  else if (status == 'on hold') {
    body["flow_id"] = msg91OnHoldTemplate
  }
  const data = sendSms(body);
  let dataNew = {
    title: 'Candidate Status Update',
    message: `You have ${status} for ${candidateDetails.name}`,
    _company: company._id,
    source: 'System'
  }
  await sendNotification(dataNew)
  return res.status(200).send({ status: true, msg: data.type });
});

router.route("/createResume/:id").get(isCompany, authenti, async (req, res) => {
  try {

    let url = `${req.protocol}://${req.get("host")}/candidateForm/${req.session.user._id}/${req.params.id}`

    const candidate = await Candidate.findById(req.params.id);

    if (!candidate || !candidate._id) throw req.ykError("No candidate found!");

    let params = {};
    if (process.env.NODE_ENV !== "development") {
      params = {
        executablePath: "/usr/bin/chromium-browser",
      };
    }
    const logo = fs.readFileSync(path.join(__dirname, '../../../public/images/elements/mipie-footer.png'), { encoding: 'base64' });
    const browser = await puppeteer.launch(params);
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    const data = await page.pdf({
      path: path.join(__dirname, `../../../public/documents/output${req.params.id}.pdf`),
      format: 'A4',
      displayHeaderFooter: true,
      preferCSSPageSize: true,
      headerTemplate: `
     <div style="display:flex;width:90%;font-size: 10px;padding: 5px 0;margin:auto;">
       <div style="width:25%;text-align:right"></div>
     </div>`,
      footerTemplate: `<footer style="margin: auto; width: 100%; border-top:1px solid #666;">
     <a href = "${baseUrl}">
     <img width="70%" height="auto" style="float: right; padding-right: 20px; padding-left: 36px; width: 25%" src="data:image/png;base64,${logo}" alt="Pivohub" />
     </a>
     </footer>`,
      margin: {
        top: '30px',
        bottom: '50px',
        right: '30px',
        left: '30px',
      },
    });
    await browser.close();

    if (!data) {
      throw req.ykError("Unable to create pdf1");
    }

    req.flash("success", "Create pdf successfully!");

    res.send({
      status: 200,
      uploadData: `${req.protocol}://${req.get("host")}/documents/output${req.params.id
        }.pdf`,
    });
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: false, err });
  }
});

router.route("/changeStatus").patch(isCompany, async (req, res) => {
  try {
    const updata = { $set: { status: req.body.status } };

    const data = await Vacancy.findByIdAndUpdate(req.body.id, updata);

    if (!data) {
      return res.status(500).send({
        status: false,
        message: "Can't update status of this job post",
      });
    }

    return res.status(200).send({ status: true, data: data });
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.status(500).send({ status: false, message: err.message });
  }
});

router.get('/getCreditCount', [isCompany, authenti], async (req, res) => {
  let user = req.companyUser
  let company = await Company.findOne({ _concernPerson: user, status: true, isDeleted: false })
  if (!company) {
    return res.status(400).send({ status: false, msg: "Company not found!" })
  }
  res.status(200).send({ status: true, credit: company.creditLeft })
})

router.get('/onGoingHiring', [isCompany], async (req, res) => {
  try {
    let menu = 'ongoing-candidates'
    let { status } = req.query
    let data = req.query
    let filter = {
      '$and': [{ status: { $nin: ['shortlisted', 'Shortlisted', 'rejected'] } }]
    }
    if (status) {
      filter['status'] = status,
        filter['isDeleted'] = false
    }
    let user = req.companyUser
    let company = await Company.findOne({ _concernPerson: user, status: true, isDeleted: false })
    if (!company) {
      throw req.ykError("Company is disabled!");
    }
    filter['company'] = company._id

    let numberCheck = isNaN(data?.name)
    let candidateFilter = {}
    let candName = ''

    var format = `/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;`;
    data?.name?.split('').some(char => {
      if (!format.includes(char))
        candName += char
    })

    if (candName && numberCheck) {
      candidateFilter["$or"] = [
        { "candidate.0.name": { "$regex": candName, "$options": "i" } },
      ]
    }
    if (candName && !numberCheck) {
      candidateFilter["$or"] = [
        { "candidate.0.name": { "$regex": candName, "$options": "i" } },
        { "candidate.0.mobile": Number(candName) },
        { "candidate.0.whatsapp": Number(candName) }
      ]
    }
    let ongoingCandidates = await HiringStatus.aggregate([
      { '$match': filter },
      {
        '$lookup': {
          from: 'candidates',
          localField: 'candidate',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { '$match': candidateFilter },
      {
        '$lookup': {
          from: 'subqualifications',
          localField: 'candidate.0.qualifications.0.subQualification',
          foreignField: '_id',
          as: 'subQual'
        }
      },
      {
        '$lookup': {
          from: 'vacancies',
          localField: 'candidate.0.appliedJobs',
          foreignField: '_id',
          as: 'appliedJobs'
        }
      },
      {
        '$project': {
          'appliedJobs': {
            '$filter': {
              input: "$appliedJobs",
              as: "item",
              cond: { $eq: ["$$item._company", company._id] }
            }
          },
          'candidate': 1,
          'status': 1
        }
      }
    ])

    let qualifications = await Qualification.find({ status: true }).select('_id name')
    res.render(`${req.vPath}/app/corporate/onGoingHiring`, {
      menu,
      ongoingCandidates,
      qualifications,
      status,
      data
    });
  }
  catch (err) {
    console.log(err)
    req.flash("error", err.message || "Something went wrong!");
    res.render(`${req.vPath}/app/corporate/onGoingHiring`, {
      menu: 'ongoing-candidates',
      ongoingCandidates: [],
      qualifications: [],
      status: '',
      error: err.message
    });
  }

})

router.get('/getCoinOffers', [isCompany, authenti], async (req, res) => {
  let offers = await coinsOffers.find({ forCandidate: false, status: true, isDeleted: false, activeTill: { $gte: moment().startOf('day') } }).select('displayOffer payAmount').sort({ payAmount: -1 }).limit(3)
  res.status(200).send(offers)
})

router.post('/payment', [isCompany, authenti], async (req, res) => {
  let { offerId, amount } = req.body
  console.log(offerId, "company's offerId for the coins")

  let company = await Company.findOne({ _concernPerson: req.companyUser, status: true, isDeleted: false }).populate({ path: '_concernPerson', select: 'mobile' }).select('name _concernPerson email')
  let instance = new Razorpay({
    key_id: apiKey,
    key_secret: razorSecretKey
  })
  let options = {
    amount: amount * 100,
    currency: "INR",
    notes: { 'company': `${company._id}`, 'offer': `${offerId}`, 'name': `${company.name}`, 'mobile': `${req.session.user.mobile}` }
  };
  console.log(options.notes, 'notes to be saved in the razorpay details')
  console.log(options, 'options to be saved in the razorpay details')

  instance.orders.create(options, async function (err, order) {
    if (err) {
      console.log('Error>>>>>>>>>>>>>>>>', err)
      return res.send({ status: false, message: err.description })
    }
    console.log(order, '<<<<<<<<<<<<<<<< order details')
    res.send({ order: order, company: company })
  });
})

router.post('/paymentStatus', [isCompany, authenti], async (req, res) => {
  let { paymentId, _company, _offer, orderId, amount, code } = req.body
  console.log(_offer, '<<<<<<<< offerId in the payment status')

  let offerDetails = await coinsOffers.findOne({ _id: _offer })
  console.log(offerDetails, '<<<<<<<<<<<<<<<<< offerDetails')

  let addPayment = {
    paymentId,
    orderId,
    amount,
    coins: offerDetails.getCoins,
    _company,
    _offer
  }
  let alreadyAllocated = await PaymentDetails.findOne({ paymentId, _company })
  if(alreadyAllocated){
    return res.status(400).send({ status: false, msg: 'Already Allocated!' })
  }
  console.log('coins allocation start', addPayment)
  let instance = new Razorpay({
    key_id: apiKey,
    key_secret: razorSecretKey
  })
  instance.payments.fetch(paymentId, { "expand[]": "offers" }).then(
    async (data) => {
      await PaymentDetails.create({ ...addPayment, paymentStatus: data.status })
      if (data.status == 'captured') {
        await Company.findOneAndUpdate({ _id: _company },
          { $inc: { availableCredit: offerDetails.getCoins, creditLeft: offerDetails.getCoins } })
        await coinsOffers.findOneAndUpdate({ _id: _offer }, { $inc: { availedCount: 1 } })
        const voucher = await Vouchers.findOne({ code, status: true, isDeleted: false, activeTill: { $gte: moment().utcOffset('+05:30') }, activationDate: { $lte: moment().utcOffset('+05:30') } })
        if (voucher) {
          const voucherUse = await VoucherUses.create({
            _company: _company,
            _voucher: voucher._id
          })
          let updateVoucher = await Vouchers.findOneAndUpdate({ _id: voucher._id, status: true, isDeleted: false }, { $inc: { availedCount: 1 } }, { new: true })
        }
        res.send({ status: true, msg: 'Success' })
      } else {
        res.send({ status: false, msg: 'Failed' })
      }
    })
})

router.get('/Coins', [isCompany], async (req, res) => {
  let company = await Company.findOne({ _concernPerson: req.companyUser, status: true, isDeleted: false }).select('_id')
  let populate = {
    path: '_offer',
    select: 'displayOffer'
  }
  let latestTransactions = await PaymentDetails.find({ _company: company._id }).populate(populate).sort({ createdAt: -1 })
  let coinOffers = await coinsOffers.find({ forCandidate: false, isDeleted: false, status: true, activeTill: { $gte: moment().startOf('day') } })
  res.render(`${req.vPath}/app/corporate/miPieCoins`, {
    menu: 'miPieCoins', latestTransactions, coinOffers
  })
})

router.post("/candidate/bulkStatusUpdate", [isCompany, authenti], async (req, res) => {
  const user = req.companyUser;
  let smsCount;
  if (env.toLowerCase() != 'production') {
    smsCount = 2
  }
  const { status, job, comment, concernedPerson, candidateIds, count } = req.body;

  if (!status) {
    return res.status(400).send({ status: false, message: "Status has to be selected" });
  }
  const company = await Company.findOne({ _concernPerson: user, status: true, isDeleted: false });
  if (!company) {
    return res.status(400).send({ status: false, message: "No such Company Found!" })
  }

  let hiringDetails = {
    company: company._id,
    status,
  }
  if (status == 'rejected') {
    hiringDetails['isRejected'] = true
  }
  if (job) {
    hiringDetails["job"] = job
  }
  if (comment) {
    hiringDetails["comment"] = comment
  }
  if (concernedPerson) {
    hiringDetails['concernedPerson'] = concernedPerson
  }

  let obj, newData = [];
  candidateIds.forEach((i) => {
    obj = { ...hiringDetails }
    obj["candidate"] = i
    newData.push(obj)
  })

  let coins = await CoinsAlgo.findOne({})
  if (!company.creditLeft || company.creditLeft < coins.shortlist * count) {
    return res
      .send({ status: false, message: "Insufficent Coins!" });
  }
  else {
    let shortlist = await Company.findOneAndUpdate(
      { _concernPerson: user },
      { $addToSet: { unmasked: candidateIds }, $inc: { creditLeft: - coins.shortlist * count } },
      { upsert: true, new: true }
    );
    if (!shortlist) {
      return res
        .status(400)
        .send({ status: false, message: "Unmasking Failed!" });
    } else {
      const result = await HiringStatus.insertMany(newData)
      if (!result) {
        return res.status(400).send({ status: false, message: "Can't Update status" })
      }
      const candidates = await Candidate.find({ _id: { $in: candidateIds } }).select('mobile name').limit(smsCount)

      let recipients = []
      candidates.forEach((i) => {
        let data = {}
        let phone = '91' + i.mobile.toString();
        let num = parseInt(phone)
        data["mobiles"] = num
        data["candidatename"] = i.name
        data["companyname"] = company.name

        recipients.push(data)
      })
      let body = { recipients }

      if (status == 'shortlisted') {
        body["flow_id"] = msg91ShortlistedTemplate
      }
      else if (status == 'rejected') {
        body["flow_id"] = msg91Rejected
      }
      else if (status == 'hired') {
        body["flow_id"] = msg91Hired
      }
      else if (status == 'on hold') {
        body["flow_id"] = msg91OnHoldTemplate
      }
      const data = sendSms(body);
      return res.status(200).send({ status: true, message: data.type });
    }
  }
});
router.put("/checkvoucher", [isCompany, authenti], async (req, res) => {
  try {
    let { code, amount, offerId } = req.body
    const voucher = await Vouchers.findOne({ code, status: true, isDeleted: false, forCandidates: false, activeTill: { $gte: moment().utcOffset('+05:30') }, activationDate: { $lte: moment().utcOffset('+05:30') } });
    if (voucher) {
      const type = voucher.voucherType;
      const company = await Company.findOne({ _concernPerson: req.session.user._id, status: true, isDeleted: false })
      const voucherUse = await VoucherUses.findOne({ _voucher: voucher._id, _company: company._id, status: true, isDeleted: false })
      if (voucherUse || !company) {
        return res.send({ status: false, message: `Voucher does not exist!` })
      }
      if (type == 'Percentage') {
        const value = voucher.value;
        const moneyDeducted = (amount * value) / 100;
        amount = amount - moneyDeducted
      } else {
        const value = voucher.value;
        amount = amount - value
      }
      if (amount > 0) {
        return res.send({ status: true, message: `Code successfully applied`, amount })
      }
      if (amount == 0) {
        let offerDetails = await coinsOffers.findOne({ _id: offerId });
        let companyUpdate = await Company.findByIdAndUpdate(
          { _id: company._id },
          {
            $inc: {
              availableCredit: offerDetails.getCoins,
              creditLeft: offerDetails.getCoins,
            },
          }
        );
        await PaymentDetails.create({
          paymentId: new ObjectId(),
          orderId: new ObjectId(),
          amount,
          coins: offerDetails.getCoins,
          _company: company._id,
          _offer: offerId,
          comments: "free offer availed",
          paymentStatus: 'captured',
        });
        await coinsOffers.findOneAndUpdate(
          { _id: offerId },
          { $inc: { availedCount: 1 } }
        );
        if (voucher._id) {
          const voucherUsed = await VoucherUses.create({ _company: company._id, _voucher: voucher._id })
          if (!voucherUsed) {
            return res.send({ status: false, message: "Unable to apply Voucher" })
          }
          let updateVoucher = await Vouchers.findOneAndUpdate({ _id: voucher._id, status: true, isDeleted: false }, { $inc: { availedCount: 1 } }, { new: true })
          res.status(200).send({ status: true, message: 'Voucher Applied', amount })
        }
      }
    } else {
      return res.send({ status: false, message: `Voucher does not exist!` })
    }
  } catch (err) {
    console.log("error", err);
    return res.send({ status: false, message: err.message })
  }
})
router.get('/nearbyCandidates', [isCompany], async (req, res) => {
  try {
    let qualification = await Qualification.find({ status: true }).sort({
      basic: -1,
    });
    let subQualification = await SubQualification.find({ status: true })
    let skills = await Skill.find({ status: true })
    let state = await State.find({ countryId: "101", status: { $ne: false } });
    let company = await Company.findOne({ _concernPerson: req.companyUser }).select('_id')
    let today = moment().startOf('day').toDate()
    let vacancies = await Vacancy.find({ _company: company._id, location: {$exists: true}, status: true, validity: {$gte: today} }).select('location title')
    res.render(`${req.vPath}/app/corporate/nearbyCandidates`, {
      menu: "nearbyCandidates", skills, state, subQualification, qualification, jdLocation: vacancies
    });
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
})

router.get(
  "/getNearbyCandidatesForMap",
  [isCompany],
  async (req, res) => {
    const user = req.companyUser;
    const company = await Company.findOne({ _concernPerson: user });
    if (!company.latitude || !company.longitude) {
      req.flash("error", "Add Your Current Location!");
      return res.send({ candidates: [], nearest: {}, status: false })
    }
    let lat = Number(company.latitude);
    let long = Number(company.longitude);
    const { highestQualification, subQualification, experience, gender, state, city, techSkills, nonTechSkills, jdLocation } = req.query
    let filter = {}
    if (highestQualification) {
      filter['highestQualification'] = highestQualification
    }
    if (state) {
      filter["locationPreferences"] = { $elemMatch: { state: new mongoose.Types.ObjectId(state) } }
    }
    if (city) {
      filter["locationPreferences"] = { $elemMatch: { city: new mongoose.Types.ObjectId(city) } }
    }
    if (experience) {
      filter['totalExperience'] = { $gte: Number(experience) }
    }
    if (gender) {
      filter['sex'] = gender
    }
    if (techSkills) {
      filter["techSkills"] = { $elemMatch: { id: new mongoose.Types.ObjectId(techSkills) } }
    }
    if (nonTechSkills) {
      filter["nonTechSkills"] = { $elemMatch: { id: new mongoose.Types.ObjectId(nonTechSkills) } }
    }
    if (subQualification) {
      filter["qualifications"] = { $elemMatch: { subQualification: new mongoose.Types.ObjectId(subQualification) } }
    }
    if(jdLocation) {
      let loc = jdLocation.split(',')
      long = Number(loc[0])
      lat = Number(loc[1])
    }
    const candidates = await Candidate.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [long, lat] },
          distanceField: "distance",
          maxDistance: Infinity,
          query: { location: { $exists: true } },
        },
      },
      { $match: filter },
      {
        $lookup: {
          from: 'qualifications',
          localField: 'highestQualification',
          foreignField: '_id',
          as: 'highestQualification'
        }
      }

    ])
    let nearest = candidates[0]
    if (candidates.length < 1) {
      nearest = {
        location: {
          coordinates: [long, lat]
        }
      }
    }
    res.send({ candidates, nearest });
  }
)
router.route('/notifications').get([isCompany], async (req, res) => {
  try {
    const menu = 'Notifications'
    const company = await Company.findOne({
      _concernPerson: req.session.user._id,
    })
    if (!company) {
      req.flash("error", "Company doesn't exists!");
      return res.status(404).send({ status: false, message: "Company doesn't exists!" })
    }
    const notificationsms = await Notification.find({ _company: company._id });
    const notificationsUpdate = await Notification.updateMany({ _company: company._id, isRead: false }, { $set: { isRead: true } })
    return res.render(`${req.vPath}/app/corporate/Notifications`, { menu, notificationsms })
  }
  catch (err) {
    console.log("err", err)
    return res.status(500).send({ status: false, message: err.message })
  }
})

router.get('/notificationCount', [isCompany, authenti], async (req, res) => {
  try {
    const company = await Company.findOne({
      _concernPerson: req.session.user._id,
    })
    if (!company) {
      return res.status(404).send({ status: false, message: "Company doesn't exists!" })
    }
    const notifications = await Notification.find({ _company: company._id, isRead: false }).countDocuments();

    res.send({ status: true, count: notifications })
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message })
  }
})

router.get('/interested-candidates', isCompany, async(req , res)=>{
  try{
    const company = await Company.findOne({
      _concernPerson: req.session.user._id,
    }).select("_id name companyExecutives")

    let menu ='interested-candidates'
    let populate = [
      {
        path: '_job',
        select: 'title displayCompanyName'
      },
      {
        path: '_candidate',
        select: 'name totalExperience highestQualification qualifications',
        populate:[
          {
          path: 'highestQualification',
          select: 'name',
          model:'Qualification'
          },
          {
            path:'city',
            select:'name'
          },
          {
            path:'state',
            select:'name'
          }]
      }
    ];  

    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 20;

    let count = await AppliedJobs.countDocuments({_company:company._id})
    const totalPages = Math.ceil(count / perPage); 
    let appliedCandidates = await AppliedJobs.find({ _company: company._id })
      .populate(populate)
      .skip(perPage * page - perPage)
      .limit(perPage)
      .sort({ createdAt: -1 })

    return res.render(`${req.vPath}/app/corporate/interestedCandidates.ejs`,{
      menu,
      appliedCandidates,
      company,
      totalPages,
      page
    })
  }
  catch(err){
    console.log(err)
    req.flash(err.message)
    return res.redirect("back")
  }
})

// router.post("/candidate/rejectedCand", [isCompany, authenti], async (req, res) => {
//   const user = req.companyUser;
//   const { candidate, status, job, comment, eventDate, concernedPerson } = req.body;
//   if (!candidate || !status) {
//     return res
//       .status(400)
//       .send({ status: false, msg: "Status has to be selected !" });
//   }
//   const company = await Company.findOne({ _concernPerson: user, status: true, isDeleted: false });
//   if (!company) {
//     return res.status(400).send({ status: false, msg: "No such Company Found!" })
//   }
//   let hiringDetails = {
//     candidate,
//     company: company._id,
//     status,
//     isDeleted: false,
//     isRejected : true
//   }
//   if (job) {
//     hiringDetails["job"] = job
//   }
//   if (comment) {
//     hiringDetails["comment"] = comment
//   }
//   if (eventDate) {
//     hiringDetails['eventDate'] = eventDate
//   }
//   if (concernedPerson) {
//     hiringDetails['concernedPerson'] = concernedPerson
//   }
//   const candidateDetails = await Candidate.findOne({ _id: candidate, isDeleted: false, status: true }).select("name mobile")
//   if (!candidateDetails) {
//     return res.status(404).send({ status: false, message: "Candidate doesn't exist" })
//   }
//   const candidateStatus = await HiringStatus.create(hiringDetails)
  
//   if (!candidateStatus) {
//     return res.status(400).send({ status: false, message: "Can't Update Candidate Hiring Status" })
//   }

//   let phone = '91' + candidateDetails.mobile.toString();
//   let num = parseInt(phone)
//   let body = {
//     recipients: [
//       {
//         mobiles: num,
//         candidatename: candidateDetails.name,
//         companyname: company.name
//       }
//     ]
//   }
//   if (status == 'rejected') {
//     body["flow_id"] = msg91Rejected
//   }

//   const data = sendSms(body);
//   let dataNew = {
//     title: 'Candidate Status Update',
//     message: `You have ${status} for ${candidateDetails.name}`,
//     _company: company._id,
//     source: 'System'
//   }
//   await sendNotification(dataNew)
//   return res.status(200).send({ status: true, msg: data.type });
// });


module.exports = router;
