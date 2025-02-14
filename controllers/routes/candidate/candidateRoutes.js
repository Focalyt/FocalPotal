// const ObjectId = require("mongodb").ObjectId;
const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const express = require("express");
require('dotenv').config()
const axios = require("axios")
const fs = require('fs')
const path = require("path");
const puppeteer = require("puppeteer");
const { ykError, headerAuthKey, extraEdgeAuthToken, extraEdgeUrl, env, fbConversionPixelId,
  fbConversionAccessToken,
  baseUrl } = require("../../../config");
const { updateSpreadSheetValues } = require("../services/googleservice")

const CandidateDoc = require('../../models/candidatedoc');
const bizSdk = require('facebook-nodejs-business-sdk');
const Content = bizSdk.Content;
const CustomData = bizSdk.CustomData;
const DeliveryCategory = bizSdk.DeliveryCategory;
const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const ServerEvent = bizSdk.ServerEvent;
const {
  User,
  CandidateRegister,
  State,
  City,
  Qualification,
  University,
  SubIndustry,
  SubQualification,
  Industry,
  Skill,
  Candidate,
  Vacancy,
  HiringStatus,
  coinsOffers,
  PaymentDetails,
  CoinsAlgo,
  AppliedJobs,
  CandidateCashBack,
  CashBackRequest,
  CashBackLogic,
  KycDocument,
  InterestedCompanies,
  Vouchers,
  VoucherUses,
  Notification,
  Company,
  VideoData,
  Referral,
  Contact,
  LoanEnquiry,
  Review,
  Courses,
  AppliedCourses
} = require("../../models");
const users = require("../../models/users");
const AWS = require("aws-sdk");
const crypto = require("crypto");
const {
  getTotalExperience,
  getTechSkills,
  getNonTechSkills,
  authenti,
  isCandidate,
  getDistanceFromLatLonInKm,
  sendSms,
} = require("../../../helpers");
const router = express.Router();
const {
  accessKeyId,
  secretAccessKey,
  bucketName,
  region,
  authKey,
  msg91WelcomeTemplate,
} = require("../../../config");
const Razorpay = require("razorpay");
const apiKey = process.env.MIPIE_RAZORPAY_KEY;
const razorSecretKey = process.env.MIPIE_RAZORPAY_SECRET;
const moment = require("moment");
const { candidateProfileCashBack, candidateVideoCashBack, candidateApplyCashBack, checkCandidateCashBack, candidateReferalCashBack } = require('../services/cashback')
const { candidateCashbackEventName, cashbackEventType, cashbackRequestStatus, referalStatus, loanEnquiryPurpose, loanEnquiryStatus } = require('../../db/constant');
const cashBackLogic = require("../../models/cashBackLogic");
const { sendNotification } = require('../services/notification');
const kycDocument = require("../../models/kycDocument");
const { CandidateValidators } = require('../../../helpers/validators');


// Facebook API Configuration
const FB_API_VERSION = 'v21.0';
const FB_GRAPH_API = `https://graph.facebook.com/${FB_API_VERSION}/${fbConversionPixelId}/events`;

// Function to hash a value using SHA-256
// const hashValue = (value) => {
//   if (value === undefined || value === null) {
//     console.error("Invalid value passed to hashValue:", value);
//     return null;
//   }

//   try {
//     const stringValue = value.toString().trim().toLowerCase(); // Ensure it's a string
//     return crypto.createHash('sha256').update(stringValue).digest('hex');
//   } catch (error) {
//     console.error("Error hashing value:", error.message);
//     return null;
//   }
// };


class MetaConversionAPI {
  constructor() {
    // Validate Meta Pixel ID
    const pixelId = fbConversionPixelId;
    if (!pixelId) {
      throw new Error('META_PIXEL_ID environment variable is not set');
    }

    // Validate Access Token
    const accessToken = fbConversionAccessToken;
    if (!accessToken) {
      throw new Error('META_ACCESS_TOKEN environment variable is not set');
    }

    this.accessToken = accessToken;
    this.pixelId = pixelId;
    this.apiVersion = 'v21.0';

    // Add validation to ensure baseUrl is properly constructed
    if (!this.pixelId || this.pixelId === 'undefined') {
      throw new Error('Invalid Meta Pixel ID');
    }

    this.metaAPIUrl = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events`;

    // Log configuration (without sensitive data)
    // console.log('Meta Conversion API Configuration:', {
    //   pixelIdExists: !!this.pixelId,
    //   accessTokenExists: !!this.accessToken,
    //   apiVersion: this.apiVersion,
    //   metaAPIUrl: this.metaAPIUrl
    // });
  }

  _hashData(data) {
    if (!data) return null;
    // Convert to string and handle non-string inputs
    const stringData = String(data);
    return crypto.createHash('sha256').update(stringData.toLowerCase().trim()).digest('hex');
  }

  async trackCourseApplication(courseData, userData, metaParams) {
    try {
      console.log(courseData, userData, metaParams);

      // Only add fields that have values
      const user_data = {};

      // Add fields only if they exist and are not empty
      if (userData.email) user_data.em = this._hashData(userData.email);
      if (userData.phone) user_data.ph = this._hashData(userData.phone);
      if (userData.firstName) user_data.fn = this._hashData(userData.firstName);
      if (userData.lastName) user_data.ln = this._hashData(userData.lastName);
      if (userData.city) user_data.ct = this._hashData(userData.city);
      if (userData.state) user_data.st = this._hashData(userData.state);
      if (userData.dob) user_data.db = this._hashData(userData.dob);
      if (userData.gender) user_data.ge = this._hashData(userData.gender);
      if (userData.ipAddress) user_data.client_ip_address = userData.ipAddress;
      if (userData.userAgent) user_data.client_user_agent = userData.userAgent;
      if (userData.phone) user_data.external_id = this._hashData(userData.phone);
      if (metaParams?.fbc) user_data.fbc = metaParams.fbc;
      if (metaParams?.fbp) user_data.fbp = metaParams.fbp;

      // Only create and send event if we have at least some user data
      if (Object.keys(user_data).length > 0) {
        const eventData = {
          data: [{
            event_name: 'Course Apply',
            event_time: Math.floor(Date.now() / 1000),
            action_source: 'website',
            user_data,
            custom_data: {
              ...(courseData.courseName && { content_name: courseData.courseName }),
              content_category: 'Course',
              currency: 'INR'
            },
            ...(courseData.sourceUrl && { event_source_url: courseData.sourceUrl })
          }],
          access_token: this.accessToken
        };

        const response = await axios.post(this.metaAPIUrl, eventData);
        console.log('Course application event tracked successfully', response.data);
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Meta Conversion API Error:', error.response?.data || error.message);
      return null;
    }
  }
}


// Helper function to extract Meta parameters from cookies and URL
const getMetaParameters = (req) => {
  // Extract fbclid from URL
  const fbclid = req.query.fbclid;

  // Get cookies
  const cookies = req.cookies || {};

  // Construct fbc (Facebook Click ID) with proper format
  let fbc = cookies._fbc;
  if (fbclid) {
    // Format should be: fb.1.${timestamp}.${fbclid}
    // The '1' represents the version number
    const timestamp = Date.now();
    fbc = `fb.1.${timestamp}.${fbclid}`;
  }

  // Get fbp (Facebook Browser ID) from cookies
  // fbp format should be: fb.1.${timestamp}.${random}
  let fbp = cookies._fbp;
  if (!fbp) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000000);
    fbp = `fb.1.${timestamp}.${random}`;
  }

  // Get ad specific parameters
  const adId = req.query.ad_id || null;
  const campaignId = req.query.campaign_id || null;
  const adsetId = req.query.adset_id || null;

  return {
    fbc,      // Only included if fbclid exists or _fbc cookie is present
    fbp,      // Always included, generated if not present
    adId,     // Ad ID from URL parameters
    campaignId, // Campaign ID from URL parameters
    adsetId    // Ad Set ID from URL parameters
  };
};




router.post("/course/:courseId/apply", [isCandidate, authenti], async (req, res) => {
  try {
    const { courseId } = req.params;
    const validation = { mobile: req.session.user.mobile };
    let entryUrl;
    if (typeof req.body.entryUrl === 'string') {
      const parsedData = JSON.parse(req.body.entryUrl);
      entryUrl = parsedData.url;
    } else {
      // If it's already an object
      entryUrl = req.body.entryUrl.url;
    }


    console.log("Entry URL:", entryUrl);

    // Create URL object to parse parameters
    const urlObj = new URL(entryUrl);
    const params = urlObj.searchParams;

    // Get fbclid from URL
    const fbclid = params.get('fbclid');
    console.log("fbclid:", fbclid);


    // Generate fbc from fbclid
    let fbc = null;
    if (fbclid) {
      // Facebook click ID format: fb.1.{timestamp}.{fbclid}
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }

    console.log("fbc:", fbc);

    // Get or generate fbp
    let fbp = params.get('fbp');

    if (!fbp) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000000000);
      fbp = `fb.1.${timestamp}.${random}`;
    }

    console.log("fbp:", fbp);



    const metaParams = {
      fbc: fbc,
      fbclid: fbclid || null, // Store original fbclid
      fbp: fbp,
      adId: params.get('ad_id') || null,
      campaignId: params.get('campaign_id') || null,
      adsetId: params.get('adset_id') || null,
      utmSource: params.get('utm_source') || null,
      utmMedium: params.get('utm_medium') || null,
      utmCampaign: params.get('utm_campaign') || null
    };


    // Get Meta parameters
    // const metaParams = getMetaParameters(req);

    // Validate courseId and candidate's mobile number
    const { value, error } = await CandidateValidators.userMobile(validation);
    if (error) {
      return res.status(400).json({ status: false, msg: "Invalid mobile number.", error });
    }

    const candidateMobile = value.mobile;



    // Fetch course and candidate
    const course = await Courses.findById(courseId);
    if (!course) {
      return res.status(404).json({ status: false, msg: "Course not found." });
    }

    const candidate = await Candidate.findOne({ mobile: candidateMobile }).populate([
      { path: 'state', select: "name" },
      { path: 'city', select: "name" }
    ]).lean();

    if (!candidate) {
      return res.status(404).json({ status: false, msg: "Candidate not found." });
    }

    // Check if already applied
    if (candidate.appliedCourses && candidate.appliedCourses.includes(courseId)) {
      return res.status(400).json({ status: false, msg: "Already applied." });
    }

    // If event sent successfully, apply for course
    const apply = await Candidate.findOneAndUpdate(
      { mobile: candidateMobile },
      { $addToSet: { appliedCourses: courseId } },
      { new: true, upsert: true }
    );

    const appliedData = await new AppliedCourses({
      _candidate: candidate._id,
      _course: courseId
    }).save();

    let candidateMob = candidate.mobile;

    // Check if the mobile number already has the country code
    if (!candidateMob.startsWith("91") && candidateMob.length == 10) {
      candidateMob = "91" + candidate.mobile; // Add country code if missing and the length is 10
    }

    console.log(candidateMob);

    // Track conversion event
    const metaApi = new MetaConversionAPI();
    await metaApi.trackCourseApplication(
      {
        courseName: course.name,
        courseId: courseId,
        courseValue: course.registrationCharges,
        sourceUrl: `${process.env.BASE_URL}/coursedetails/${courseId}`
      },
      {
        email: candidate.email,
        phone: candidateMob,
        firstName: candidate.name.split(' ')[0],
        lastName: candidate.name.split(' ').slice(1).join(' '),
        gender: candidate?.sex === 'Male' ? 'm' : candidate?.sex === 'Female' ? 'f' : '',
        dob: candidate?.dob ? moment(candidate.dob).format('YYYYMMDD') : '',
        city: candidate.city?.name,
        state: candidate.state?.name,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      },
      metaParams
    );


    // Capitalize every word's first letter
    function capitalizeWords(str) {
      if (!str) return '';
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    // Update Spreadsheet
    const sheetData = [
      moment(appliedData.createdAt).utcOffset('+05:30').format('DD MMM YYYY'),
      moment(appliedData.createdAt).utcOffset('+05:30').format('hh:mm A'),
      capitalizeWords(course?.name), // Apply the capitalizeWords function
      candidate?.name,
      candidate?.mobile,
      candidate?.email,
      candidate?.sex === 'Male' ? 'M' : candidate?.sex === 'Female' ? 'F' : '',
      candidate?.dob ? moment(candidate.dob).format('DD MMM YYYY') : '',
      candidate?.state?.name,
      candidate?.city?.name,
      'Course',
      `${process.env.BASE_URL}/coursedetails/${courseId}`,
      course?.registrationCharges,
      appliedData?.registrationFee,
      'Lead From Portal'

    ];
    await updateSpreadSheetValues(sheetData);



    return res.status(200).json({ status: true, msg: "Course applied successfully." });
  } catch (error) {
    console.error("Error applying for course:", error.message);
    return res.status(500).json({ status: false, msg: "Internal server error.", error: error.message });
  }
});

// Modified sendEventToFacebook function
// const sendEventToFacebook = async (event_name, user_data, custom_data) => {
//   const event_id = crypto.createHash('sha256').update(`${user_data.em}-${event_name}-${Date.now()}`).digest('hex');
//   const payload = {
//     data: [
//       {
//         event_name,
//         event_time: Math.floor(Date.now() / 1000),
//         action_source: "website",
//         event_id,
//         user_data,
//         custom_data
//       }
//     ]
//   };

//   try {
//     const response = await axios.post(`${FB_GRAPH_API}?access_token=${fbConversionAccessToken}`, payload, {
//       headers: { 'Content-Type': 'application/json' }
//     });
//     console.log("Facebook Event Sent Successfully:", response.data);
//     return true; // Event sent successfully
//   } catch (error) {
//     console.error("Error sending event to Facebook:", error.response ? error.response.data : error.message);
//     return false; // Event failed
//   }
// };








router.route('/')
  .get(async (req, res) => {
    let user = req.session.user
    if (user && user.role === 3) {
      res.redirect("/candidate/dashboard");
    }
    else {
      res.redirect("/candidate/login");
    }
  })

router
  .route(["/register", "/signup"])
  .get(async (req, res) => {
    res.redirect("/candidate/login");
  })
  .post(async (req, res) => {
    try {
      let { value, error } = await CandidateValidators.register(req.body)
      if (error) {
        console.log('====== register error ', error, value)
        return res.send({ status: "failure", error: "Something went wrong!" });
      }
      let formData = value;
      const { name, mobile, sex, place, latitude, longitude } = formData;

      if (formData?.refCode && formData?.refCode !== '') {
        let referredBy = await Candidate.findOne({ _id: formData.refCode, status: true, isDeleted: false })
        if (!referredBy) {
          req.flash("error", "Enter a valid referral code.");
          return res.send({ status: 'failure', error: "Enter a valid referral code." })
        }
      }
      const dataCheck = await Candidate.findOne({ mobile: mobile });
      if (dataCheck) {
        return res.send({
          status: "failure",
          error: "Candidate mobile already registered",
        });
      }

      const datacheck2 = await User.findOne({ mobile, role: "3" });

      if (datacheck2) {
        return res.send({
          status: "failure",
          error: "User mobile already exist!",
        });
      }

      const dataCheck1 = await Candidate.findOne({ mobile });
      if (dataCheck1) {
        return res.send({
          status: "failure",
          error: "Candidate mobile already exist!",
        });
      }

      const usr = await User.create({
        name,
        sex,
        mobile,
        role: 3,
      });
      if (!usr) {
        console.log("usr not created");
        throw req.ykError("candidate user not create!");
      }

      let coins = await CoinsAlgo.findOne();
      let candidateBody = {
        name,
        sex,
        mobile,
        whatsapp: mobile,
        availableCredit: coins?.candidateCoins,
        creditLeft: coins?.candidateCoins,
        place,
        latitude,
        longitude,

        location: {
          type: "Point",
          coordinates: [latitude, longitude]
        }
      }
      console.log("Candidate Data", candidateBody)
      if (formData?.refCode && formData?.refCode !== '') {
        candidateBody["referredBy"] = formData?.refCode
      }
      const candidate = await Candidate.create(candidateBody);

      if (!candidate) {
        console.log("candidate not created");
        throw req.ykError("Candidate not create!");
      }
      if (formData?.refCode && formData?.refCode !== '') {
        const referral = await Referral.create({
          referredBy: formData?.refCode,
          referredTo: candidate._id,
          status: referalStatus.Inactive
        })

      }
      let candName = candidate.name.split(" ")
      let firstName = candName[0], surName = ''
      if (candName.length >= 2) {
        surName = candName[candName.length - 1]
      }
      let city = place.split(',')

      let phone = "91" + mobile.toString();
      let num = parseInt(phone);

      let body = {
        flow_id: msg91WelcomeTemplate,
        recipients: [
          {
            mobiles: num,
            var: name,
          },
        ],
      };

      const data = sendSms(body);
      // if (env.toLowerCase() === 'production') {
      //   let dataFormat = {
      //     Source: "mipie",
      //     FirstName: name,
      //     MobileNumber: mobile,
      //     LeadSource: "Website",
      //     LeadType: "Online",
      //     LeadName: "app",
      //     Course: "Mipie general",
      //     Center: "Padget",
      //     Location: "Technician",
      //     Country: "India",
      //     LeadStatus: "Signed Up",
      //     ReasonCode: "27",
      //     City: city[0],
      //     State: city[1],
      //     AuthToken: extraEdgeAuthToken
      //   }
      //   let edgeBody = JSON.stringify(dataFormat)
      //   let header = { "Content-Type": "multipart/form-data" }
      //   let extraEdge = await axios.post(extraEdgeUrl, edgeBody, header).then(res => {
      //     console.log(res.data)
      //     req.flash("success", "Candidate added successfully!");
      //   }).catch(err => {
      //     console.log(err)
      //     return err
      //   })
      // }
      let notificationData = {
        title: 'Signup',
        message: `Complete your profile to get your dream job.__नौकरी पाने के लिए अपना प्रोफ़ाइल पूरा करें।`,
        _candidate: candidate._id,
        source: "System"
      }
      await sendNotification(notificationData)
      return res.send({
        status: "success",
        error: "Candidate added successfully!",
      });
    } catch (err) {
      console.log("error is ", err);
      req.flash("error", err.message || "Something went wrong!");
      return res.send({ status: "failure", error: "Something went wrong!" });
    }
  });

router.get("/login", async (req, res) => {
  let user = req.session.user
  let { returnUrl } = req.query


  const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
  console.log(fullUrl);

  // Modify script to run after DOM is loaded and escape quotes properly
  const storageScript = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        try {
        const storedurl = localStorage.getItem('entryUrl');
        if(!storedurl){


          // Store current URL immediately
          const data = {
            url: '${fullUrl.replace(/'/g, "\\'")}',
            timestamp: new Date().getTime()
          };
          localStorage.setItem('entryUrl', JSON.stringify(data));
          
          // Verify it was stored
          console.log('URL stored:', localStorage.getItem('entryUrl'))};
          
          // Function to check and clean expired URL
          function cleanExpiredUrl() {
            const stored = localStorage.getItem('entryUrl');
            if (stored) {
              const data = JSON.parse(stored);
              const now = new Date().getTime();
              const hours24 = 24 * 60 * 60 * 1000;
              
              if (now - data.timestamp > hours24) {
                localStorage.removeItem('entryUrl');
                console.log('Expired URL removed');
              }
            }
          }
          
          // Check for expired URLs
          cleanExpiredUrl();
          
        } catch (error) {
          console.error('Error storing URL:', error);
        }
      });
    </script>
  `;

  if (user && user.role == 3 && returnUrl && returnUrl.trim() !== '') {
    return res.redirect(returnUrl)
  }
  else if (user && user.role == 3) {
    return res.redirect("/candidate/dashboard");
  }
  return res.render(`${req.vPath}/app/candidate/login`, { apikey: process.env.AUTH_KEY_GOOGLE, storageScript: storageScript });
});
router.get("/searchjob", [isCandidate], async (req, res) => {
  const data = req.query;
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  const candidate = await Candidate.findOne({
    mobile: value.mobile,
  });
  const candidateLat = Number(candidate.latitude);
  const candidateLong = Number(candidate.longitude);
  let {
    qualification,
    experience,
    industry,
    state,
    jobType,
    minSalary,
    techSkills,
    name,
    distance
  } = req.query;

  let filter = { status: true, validity: { $gte: new Date() }, verified: true };
  if (qualification) {
    filter['_qualification'] = new mongoose.Types.ObjectId(`${qualification}`)
  }
  if (industry) {
    filter._industry = new mongoose.Types.ObjectId(`${industry}`);
  }
  if (state) {
    filter['state.0._id'] = new mongoose.Types.ObjectId(`${state}`);
  }
  if (jobType) {
    filter.jobType = jobType;
  }
  if (experience) {
    experience = +(experience)
    experience == "0"
      ? (filter["$or"] = [{ experience: { $lte: experience } }])
      : (filter["experience"] = { $lte: experience });
  }
  if (techSkills) {
    filter._techSkills = new mongoose.Types.ObjectId(`${techSkills}`);
  }
  if (minSalary) {
    filter["$or"] = [
      { isFixed: true, amount: { $gte: minSalary } },
      { isFixed: false, min: { $gte: minSalary } },
    ];
  }
  if (name) {
    filter["$or"] = [
      { 'displayCompanyName': { "$regex": name, "$options": "i" } },
      { 'company.0.name': { "$regex": name, "$options": "i" } }
    ]
  }

  const allQualification = await Qualification.find({ status: true }).sort({
    basic: -1,
  });
  const allIndustry = await Industry.find({ status: true });
  const allStates = await State.find({
    countryId: "101",
    status: { $ne: false },
  });
  const perPage = 10;
  const p = parseInt(req.query.page);
  const page = p || 1;

  let jobDistance = Infinity

  if (distance && distance != 'all' && distance != '0') {
    jobDistance = Number(distance) * 1000
  }

  const agg = [
    {
      '$geoNear': {
        near: { type: "Point", coordinates: [candidateLong, candidateLat] },
        distanceField: "distance",
        maxDistance: jobDistance,
        distanceMultiplier: 0.001
      }
    },
    {
      '$lookup': {
        from: 'companies',
        localField: '_company',
        foreignField: '_id',
        as: '_company'
      }
    },
    {
      '$match': {
        '_company.0.isDeleted': false,
        '_company.0.status': true,
        '_id': { "$nin": candidate.appliedJobs }
      }
    },
    {
      '$lookup': {
        from: 'qualifications',
        localField: '_qualification',
        foreignField: '_id',
        as: 'qualifications'
      }
    },
    {
      '$lookup': {
        from: 'industries',
        localField: '_industry',
        foreignField: '_id',
        as: 'industry'
      }
    },
    {
      '$lookup': {
        from: 'cities',
        localField: 'city',
        foreignField: '_id',
        as: 'city'
      }
    },
    {
      '$lookup': {
        from: 'states',
        localField: 'state',
        foreignField: '_id',
        as: 'state'
      }
    },
    {
      '$lookup': {
        from: 'skills',
        localField: '_techSkills',
        foreignField: '_id',
        as: '_techSkill'
      }
    },
    {
      '$lookup': {
        from: 'jobcategories',
        localField: '_jobCategory',
        foreignField: '_id',
        as: '_jobCategory'
      }
    },
    {
      '$lookup': {
        from: 'users',
        localField: '_company.0._concernPerson',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      '$match': filter
    },
    {
      '$sort': {
        'sequence': 1,
        'createdAt': -1
      }
    },
    {
      '$facet': {
        metadata: [{ '$count': "total" }],
        data: [{ $skip: perPage * page - perPage }, { $limit: perPage }]
      }
    }
  ]
  const allJobs = await Vacancy.aggregate(agg)
  let count = allJobs[0].metadata[0]?.total
  if (!count) {
    count = 0
  }

  const totalPages = Math.ceil(count / perPage);
  let jobs = allJobs[0].data
  // console.log(jobs[0])
  // jobs.forEach((item) => {
  //   if (item.latitude && item.longitude && candidateLat && candidateLong) {
  //     let distance = getDistanceFromLatLonInKm(
  //       { lat1: candidateLat, long1: candidateLong },
  //       { lat2: Number(item.latitude), long2: Number(item.longitude) }
  //     );
  //     item.distance = distance.toFixed(0);
  //   } else {
  //     let distance = 0;
  //     item.distance = distance;
  //   }
  // });
  let skills = await Skill.find({ status: true });
  res.render(`${req.vPath}/app/candidate/search-job`, {
    menu: "Jobs",
    jobs,
    allQualification,
    allIndustry,
    allStates,
    data,
    skills,
    totalPages,
    page
  });
});
router.get("/job/:jobId", [isCandidate], async (req, res) => {
  const jobId = req.params.jobId;
  const contact = await Contact.find({ status: true, isDeleted: false }).sort({ createdAt: 1 })
  const userMobile = req.session.user.mobile;
  let validation = { mobile: userMobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  const perPage = 10;
  const page = parseInt(req.query.page) || 1;
  const populate = [
    { path: "_qualification" },
    { path: "_industry" },
    { path: "city" },
    { path: "state" },
    { path: "_jobCategory" },
    { path: "_company", populate: "_concernPerson" },
    { path: "_techSkills" },
    { path: "_nonTechSkills" },
  ];
  const jobDetails = await Vacancy.findById(jobId).populate(populate);
  if (jobDetails.status == false) {
    return res.redirect("/candidate/searchJob");
  }

  const candidate = await Candidate.findOne({ mobile: userMobile });
  let canApply = false;
  if (candidate.name && candidate.mobile && candidate.sex && candidate.whatsapp && candidate.city && candidate.state && candidate.highestQualification) {
    if (candidate.isExperienced == false || candidate.isExperienced == true) {
      canApply = true;
    }
  }
  let isRegisterInterview = false;
  const checkJobRegister = await AppliedJobs.findOne({
    _candidate: candidate._id,
    _job: new mongoose.Types.ObjectId(jobId)
  });
  if (checkJobRegister && checkJobRegister?.isRegisterInterview) {
    isRegisterInterview = true;
  }
  let isApplied = false;
  if (candidate.appliedJobs && candidate.appliedJobs.includes(jobId)) {
    isApplied = true;
  }
  let hasCredit = true;
  let coins = await CoinsAlgo.findOne({});
  if (!candidate.creditLeft || candidate.creditLeft < coins.job) {
    hasCredit = false;
  }
  let mobileNumber = jobDetails.phoneNumberof ? jobDetails.phoneNumberof : contact[0]?.mobile
  let reviewed = await Review.findOne({ _job: jobId, _user: candidate._id });
  let course = [];
  const recomCo = await Vacancy.distinct('_courses.courseLevel', {
    "_id": new mongoose.Types.ObjectId(jobId), "_courses.isRecommended": true
  });
  console.log(recomCo, "recomCorecomCorecomCorecomCo");
  if (recomCo.length > 0) {
    const fields = {
      status: true,
      isDeleted: false,
      _id: {
        $in: recomCo
      }
    };
    // if (candidate?.appliedCourses.length > 0) {
    //   fields._id = {
    //     $nin: candidate.appliedCourses
    //   }
    // }
    course = await Courses.find(fields).populate("sectors");
  }

  res.render(`${req.vPath}/app/candidate/view-job`, {
    menu: "Jobs",
    jobDetails,
    candidate,
    isApplied,
    isRegisterInterview,
    canApply,
    hasCredit,
    coins,
    mobileNumber,
    reviewed: reviewed ? true : false,
    course,
    // page,
    // totalPages
  });

});

/* Document route */
router.get("/document", [isCandidate], async (req, res) => {
  try {
    let validation = { mobile: req.session.user.mobile };
    let { value, error } = await CandidateValidators.userMobile(validation);

    if (error) {
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({ mobile: value.mobile }).lean();
    if (!candidate) {
      return res.send({ status: false, msg: "Candidate not found!" });
    }

    const documents = await CandidateDoc.findOne({ _candidate: candidate._id }).lean();



    res.render(`${req.vPath}/app/candidate/document`, {
      menu: 'document',
      candidate,
      documents: documents || {},
    });
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});


router.post("/document", [isCandidate], async (req, res) => {
  try {
    const documentsData = req.body;
    const userMobile = req.session.user.mobile;
    console.log(documentsData, "this is document data");

    const candidate = await Candidate.findOne({ mobile: userMobile }).lean();
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate not found" });
    }

    const existingDocument = await CandidateDoc.findOne({ _candidate: candidate._id });
    console.log(existingDocument, "data find successfully??>><<>")
    if (existingDocument) {
      existingDocument.Photograph = documentsData.Photograph || existingDocument.Photograph;
      existingDocument.AadharCardFront = documentsData.AadharCardFront || existingDocument.AadharCardFront;
      existingDocument.AadharCardBack = documentsData.AadharCardBack || existingDocument.AadharCardBack;
      existingDocument.ResidenceCertificate = documentsData.ResidenceCertificate || existingDocument.ResidenceCertificate;
      existingDocument.CasteCertificate = documentsData.CasteCertificate || existingDocument.CasteCertificate;
      existingDocument.RationCard = documentsData.RationCard || existingDocument.RationCard;
      existingDocument['10thMarksheet'] = documentsData['10thMarksheet'] || existingDocument['10thMarksheet'];
      existingDocument['12thMarksheet'] = documentsData['12thMarksheet'] || existingDocument['12thMarksheet'];
      existingDocument.DiplomaMarksheet = documentsData.DiplomaMarksheet || existingDocument.DiplomaMarksheet;
      existingDocument.BachelorDegreeMarkSheets = documentsData.BachelorDegreeMarkSheets || existingDocument.BachelorDegreeMarkSheets;
      existingDocument.DegreePassingCertificate = documentsData.DegreePassingCertificate || existingDocument.DegreePassingCertificate;
      existingDocument.PassportNationalityCertificate = documentsData.PassportNationalityCertificate || existingDocument.PassportNationalityCertificate;
      existingDocument.MigrationCertificateTransferCertificate = documentsData.MigrationCertificateTransferCertificate || existingDocument.MigrationCertificateTransferCertificate;
      existingDocument.GapCertificate = documentsData.GapCertificate || existingDocument.GapCertificate;
      existingDocument.ProfessionalExperienceCertificate = documentsData.ProfessionalExperienceCertificate || existingDocument.ProfessionalExperienceCertificate;
      existingDocument.AdditionalDocuments = documentsData.AdditionalDocuments || existingDocument.AdditionalDocuments;
      existingDocument.Signature = documentsData.Signature || existingDocument.Signature

      await existingDocument.save();
      console.log("Document updated:", existingDocument);
    } else {
      const newDocument = new CandidateDoc({
        _candidate: candidate._id,
        Photograph: documentsData.Photograph,
        AadharCardFront: documentsData.AadharCardFront,
        AadharCardBack: documentsData.AadharCardBack,
        ResidenceCertificate: documentsData.ResidenceCertificate,
        CasteCertificate: documentsData.CasteCertificate,
        RationCard: documentsData.RationCard,
        '10thMarksheet': documentsData['10thMarksheet'],
        '12thMarksheet': documentsData['12thMarksheet'],
        DiplomaMarksheet: documentsData.DiplomaMarksheet,
        BachelorDegreeMarkSheets: documentsData.BachelorDegreeMarkSheets,
        DegreePassingCertificate: documentsData.DegreePassingCertificate,
        PassportNationalityCertificate: documentsData.PassportNationalityCertificate,
        MigrationCertificateTransferCertificate: documentsData.MigrationCertificateTransferCertificate,
        GapCertificate: documentsData.GapCertificate,
        ProfessionalExperienceCertificate: documentsData.ProfessionalExperienceCertificate,
        AdditionalDocuments: documentsData.AdditionalDocuments,
        Signature: documentsData.Signature
      });

      await newDocument.save();
      console.log("New document created:", newDocument);
    }

    // Fetch the updated documents for rendering
    const documents = await CandidateDoc.findOne({ _candidate: candidate._id }).lean();
    console.log(documents, "this is data");
    res.render(`${req.vPath}/app/candidate/document`, {
      menu: 'document',
      candidate,
      documents: documents || {},
      message: "Success"
    });

  } catch (error) {
    console.error("Error saving documents:", error);
    req.flash("error", error.message || "Something went wrong!");
    return res.redirect("back");
  }
});


router.delete('/document', [isCandidate], async (req, res) => {
  try {
    const documentName = req.query.documentName;
    const id = req.query.id
    console.log(documentName, "this is document name");

    const userMobile = req.session.user.mobile;
    const candidate = await Candidate.findOne({ mobile: userMobile }).lean();

    if (!candidate) {
      return res.status(404).send({ success: false, message: "Candidate not found!" });
    }

    const updateResult = await CandidateDoc.updateOne(
      { _id: id, [documentName]: { $exists: true } },
      { $set: { [documentName]: "" } }
    );

    const updateadditionaldoc = await CandidateDoc.updateOne(
      { _id: id },
      { $pull: { AdditionalDocuments: documentName } }
    );
    const documents = await CandidateDoc.findOne({ _candidate: candidate._id }).lean();
    console.log(documents, "documents after delete");

    res.render(`${req.vPath}/app/candidate/document`, {
      menu: 'document',
      candidate,
      success: true,
      documents: documents || {},
      message: "Document deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting document", error);
    req.flash("error", error.message || "Something Went Wrong!");
    return res.status(500).send({ success: false, message: error.message || "Something went wrong!" });
  }
});


/* List of courses */
router.get("/searchcourses", [isCandidate], async (req, res) => {
  try {
    const data = req.query;

    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log(fullUrl);

    // Modify script to run after DOM is loaded and escape quotes properly
    const storageScript = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        try {
        const storedurl = localStorage.getItem('entryUrl');
        if(!storedurl){
          // Store current URL immediately
          const data = {
            url: '${fullUrl.replace(/'/g, "\\'")}',
            timestamp: new Date().getTime()
          };
          localStorage.setItem('entryUrl', JSON.stringify(data));
          
          // Verify it was stored
          console.log('URL stored:', localStorage.getItem('entryUrl'))};
          
          // Function to check and clean expired URL
          function cleanExpiredUrl() {
            const stored = localStorage.getItem('entryUrl');
            if (stored) {
              const data = JSON.parse(stored);
              const now = new Date().getTime();
              const hours24 = 24 * 60 * 60 * 1000;
              
              if (now - data.timestamp > hours24) {
                localStorage.removeItem('entryUrl');
                console.log('Expired URL removed');
              }
            }
          }
          
          // Check for expired URLs
          cleanExpiredUrl();
          
        } catch (error) {
          console.error('Error storing URL:', error);
        }
      });
    </script>
  `;
    const perPage = 10;
    const p = parseInt(req.query.page);
    const page = p || 1;
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    const candidate = await Candidate.findOne({
      mobile: value.mobile,
    });
    const fields = {
      status: true,
      isDeleted: false
    }
    if (candidate?.appliedCourses?.length > 0) {
      fields._id = {
        $nin: candidate?.appliedCourses
      }
    }
    console.log('data: ', data);
    if (data['name'] != '' && data.hasOwnProperty('name')) {
      fields["name"] = { "$regex": data['name'], "$options": "i" }
    }
    if (data.FromDate && data.ToDate) {
      let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day').toDate()
      let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day').toDate()
      fields["createdAt"] = {
        $gte: fdate,
        $lte: tdate
      }
    }
    let count = 0;
    console.log('fields: ', JSON.stringify(fields));
    let courses = await Courses.find(fields).populate("sectors");
    count = await Courses.countDocuments(fields);
    const totalPages = Math.ceil(count / perPage);
    return res.render(`${req.vPath}/app/candidate/search-cources`, {
      menu: 'Cources',
      courses,
      data,
      totalPages,
      page,
      storageScript: storageScript
    });

  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});
/* course by id*/
router.get("/course/:courseId", [isCandidate], async (req, res) => {
  try {
    const { courseId } = req.params;
    const fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    console.log(fullUrl);

    // Modify script to run after DOM is loaded and escape quotes properly
    const storageScript = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        try {
        const storedurl = localStorage.getItem('entryUrl');
        if(!storedurl){
          // Store current URL immediately
          const data = {
            url: '${fullUrl.replace(/'/g, "\\'")}',
            timestamp: new Date().getTime()
          };
          localStorage.setItem('entryUrl', JSON.stringify(data));
          
          // Verify it was stored
          console.log('URL stored:', localStorage.getItem('entryUrl'))};
          
          // Function to check and clean expired URL
          function cleanExpiredUrl() {
            const stored = localStorage.getItem('entryUrl');
            if (stored) {
              const data = JSON.parse(stored);
              const now = new Date().getTime();
              const hours24 = 24 * 60 * 60 * 1000;
              
              if (now - data.timestamp > hours24) {
                localStorage.removeItem('entryUrl');
                console.log('Expired URL removed');
              }
            }
          }
          
          // Check for expired URLs
          cleanExpiredUrl();
          
        } catch (error) {
          console.error('Error storing URL:', error);
        }
      });
    </script>
  `;
    const contact = await Contact.find({ status: true, isDeleted: false }).sort({ createdAt: 1 })
    const userMobile = req.session.user.mobile;
    let validation = { mobile: userMobile }
    let { value, error } = CandidateValidators.userMobile(validation)
    if (error) {
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }



    let course = await Courses.findById(courseId).populate('sectors').lean();
    if (!course || course?.status == false /* || course.courseType !== 0 */) {
      return res.redirect("/candidate/searchcourses");
    }
    const candidate = await Candidate.findOne({ mobile: userMobile }).lean();

    let canApply = false;
    if (candidate.name && candidate.mobile && candidate.sex && candidate.whatsapp && candidate.city && candidate.state && candidate.highestQualification) {
      if (candidate.isExperienced == false || candidate.isExperienced == true) {
        canApply = true;
      }
    }
    let isApplied = false;
    if (candidate.appliedCourses && candidate.appliedCourses.length > 0) {
      const [filteredCourses] = candidate.appliedCourses.filter(course => {
        return courseId.includes(course);
      });
      if (filteredCourses) {
        isApplied = true;
        const assignedCourseData = await AppliedCourses.findOne({
          _candidate: candidate._id,
          _course: new mongoose.Types.ObjectId(courseId)
        }).lean();

        course.registrationCharges = course.registrationCharges.replace(/,/g, '');
        console.log('============> assignedCourseData ', assignedCourseData, course.registrationCharges)
        if (assignedCourseData) {
          course.remarks = assignedCourseData.remarks;
          course.assignDate = assignedCourseData.assignDate ? moment(assignedCourseData.assignDate).format('DD MMM YYYY') : "";
          course.registrationStatus = assignedCourseData.registrationFee || 'Unpaid'
          // const assignDate = assignedCourseData.assignDate ? new Date(assignedCourseData.assignDate).toLocaleDateString('en-GB', {
          //   day: '2-digit',
          //   month: '2-digit',
          //   year: 'numeric'
          // }).split('/').reverse().join('-') : "";
          // course.assignDate = assignDate;
        }
      }
    }
    let mobileNumber = course.phoneNumberof ? course.phoneNumberof : contact[0]?.mobile
    // console.log('course: ', JSON.stringify(course));


    return res.render(`${req.vPath}/app/candidate/view-course`, {
      course,
      menu: 'Cources',
      isApplied,
      mobileNumber,
      canApply,
      storageScript: storageScript
    });
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
})
/* course apply */
// router.post("/course/:courseId/apply", [isCandidate, authenti], async (req, res) => {
//   let courseId = req.params.courseId;
//   let validation = { mobile: req.session.user.mobile }
//   let { value, error } = await CandidateValidators.userMobile(validation)
//   if (error) {
//     return res.send({ status: "failure", error: "Something went wrong!", error });
//   }
//   let candidateMobile = value.mobile;
//   let course = await Courses.findById(courseId);
//   if (!course) {
//     return res.send({ status: false, msg: "Course not Found!" });
//   }
//   let candidate = await Candidate.findOne({ mobile: candidateMobile }).populate([{
//     path: 'state',
//     select: "name"
//   }, {
//     path: 'city',
//     select: "name"
//   }]).lean();
//   if (!candidate) {
//     return res.send({ status: false, msg: "Candidate not found!" });
//   }

//   if (candidate.appliedCourses && candidate.appliedCourses.includes(courseId)) {
//     req.flash("error", "Already Applied");
//     return res.send({ status: false, msg: "Already Applied" });
//   } else {



//     let apply = await Candidate.findOneAndUpdate({ mobile: candidateMobile },
//       { $addToSet: { appliedCourses: courseId } },
//       { new: true, upsert: true });
//    const appliedData = await AppliedCourses({
//       _candidate: candidate._id,
//       _course: courseId
//     }).save();

//     let sheetData = [candidate?.name, candidate?.mobile,candidate?.email, candidate?.sex, candidate?.dob ? moment(candidate?.dob).format('DD MMM YYYY'): '', candidate?.state?.name, candidate.city?.name, 'Course', `${process.env.BASE_URL}/coursedetails/${courseId}`, course?.registrationCharges, appliedData?.registrationFee, moment(appliedData?.createdAt).utcOffset('+05:30').format('DD MMM YYYY hh:mm')]

//       await updateSpreadSheetValues(sheetData);
//       //Extract UTM Parameters from query
//       const sanitizeInput = (value) => typeof value === 'string' ? value.replace(/[^a-zA-Z0-9-_]/g, '') : value;
//       //Extract UTM Parameters from query
//       let utm_params = {
//         utm_source: sanitizeInput(req.query.utm_source || 'unknown'),
//         utm_medium: sanitizeInput(req.query.utm_medium || 'unknown'),
//         utm_campaign: sanitizeInput(req.query.utm_campaign || 'unknown'),
//         utm_term: sanitizeInput(req.query.utm_term || ''),
//         utm_content: sanitizeInput(req.query.utm_content || ''),
//     };
//     //Extract fbp and fbc values
//     let fbp = req.cookies?._fbp || '';
//     let fbc = req.cookies?._fbc || '';
//     if (!fbc && req.query.fbclid) {
//         fbc = `fb.${Date.now()}.${req.query.fbclid}`; // Construct fbc from fbclid query parameter
//     }

//     //Prepare user data with hashing
//     const user_data = {
//       em: [hashValue(candidate.email)],
//       ph: [hashValue(candidate.mobile)],
//       fn: hashValue(candidate.name?.split(" ")[0]),
//       ln: hashValue(candidate.name?.split(" ")[1] || ""),
//       country: hashValue("India"),
//       client_ip_address: req.ip || '',
//       fbp,
//       fbc
//   };
//     //Prepare custom data, including UTM parameters
//     const custom_data = {
//       currency: "INR",
//       value: course.registrationCharges || 0,
//       content_ids: [courseId],
//       content_type: "course",
//       num_items: 1,
//       order_id: appliedData._id.toString(),
//       ...utm_params // Add UTM parameters to custom_data
//   };
//     console.log(user_data, custom_data)

//     // Send event to Facebook
//     await sendEventToFacebook("Course Apply", user_data, custom_data);



//     if (!apply) {
//       req.flash("error", "Already failed");
//       return res.status(400).send({ status: false, msg: "Applied Failed!" });
//     }
//   }


//   res.status(200).send({ status: true, msg: "Success" });
// });
/* List of applied course */
router.get("/appliedCourses", [isCandidate], async (req, res) => {
  const p = parseInt(req.query.page);
  const page = p || 1;
  const perPage = 10;
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  let candidate = await Candidate.findOne({
    mobile: value.mobile,
    isDeleted: false, status: true
  })
  let courses = [];
  let count = 0;
  if (candidate?.appliedCourses?.length > 0) {
    courses = await AppliedCourses.find({
      _candidate: candidate._id
    }).populate({ path: '_course', populate: { path: 'sectors' } });

    console.log('=================>  ', courses)
    count = await Courses.countDocuments({
      _id: {
        $in: candidate.appliedCourses
      },
      isDeleted: false,
      status: true
    });
    console.log(courses, "appplid coursessss loisttt")
  }
  const totalPages = Math.ceil(count / perPage);
  res.render(`${req.vPath}/app/candidate/appliedCourses`, {
    menu: 'appliedCourse',
    courses,
    totalPages,
    page
  });
});

router.get("/dashboard", isCandidate, async (req, res) => {
  try {
    const menu = "dashboard";

    const appliedJobs = [
      {
        path: "appliedJobs",
        select: ["_industry city state _company"],
        options: { limit: 4, sort: { createdAt: -1 } },
        populate: [
          { path: "_industry", select: ["name"] },
          { path: "city", select: ["name"] },
          { path: "state", select: ["name"] },
          { path: "_company", select: ["name"] },
        ],
      },
    ];

    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    const candidate = await Candidate.findOne(
      { mobile: value.mobile },
      [
        "name",
        "mobile",
        "email",
        "sex",
        "whatsapp",
        "address",
        "state",
        "city",
        "pincode",
        "image",
        "resume",
        "highestQualification",
        "yearOfPassing",
        "qualifications",
        "appliedJobs",
        "isExperienced",
        "experiences",
        "techSkills",
        "nonTechSkills",
        "locationPreferences",
        "availableCredit",
        "creditLeft"
      ]
    ).populate(appliedJobs);

    if (!candidate || candidate === null)
      throw req.ykError("candidate not found");

    const hiringStatus = await HiringStatus.find({ candidate: candidate._id, isDeleted: false }, 'status company updatedAt').sort({ updatedAt: -1 }).limit(4)
      .populate(
        [
          {
            path: "company", select: ["_industry", "cityId", "name"],
            populate: [{ path: "_industry", select: "name" }]
          }]
      )
    const shortlistedCount = await HiringStatus.countDocuments({ candidate: candidate._id, isDeleted: false, status: { '$ne': 'rejected' } })
    const jobsCount = await Vacancy.countDocuments({ status: false })

    let totalCashback = await CandidateCashBack.aggregate([
      { $match: { candidateId: new mongoose.Types.ObjectId(candidate._id) } },
      { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
    ]);
    let cityArray = []
    hiringStatus.forEach(status => {
      cityArray.push(status.company?.cityId)
    })

    const cities = await City.find({ _id: { $in: cityArray } }).select("name");

    const profile = {
      profiledetails:
        candidate.name &&
        candidate.mobile &&
        candidate.sex &&
        candidate.whatsapp &&
        candidate.state &&
        candidate.city,
      qualification: candidate.highestQualification,
      experience: candidate.isExperienced != null,
      skills:
        candidate.techSkills.length > 0 && candidate.nonTechSkills.length > 0,
      location:
        candidate.locationPreferences &&
        candidate.locationPreferences.length > 0,
    };

    res.render(`${req.vPath}/app/candidate/dashboard`, {
      menu,
      profile,
      candidate,
      hiringStatus,
      cities,
      shortlistedCount,
      jobsCount,
      totalCashback
    });
  } catch (err) {
    console.log("caught error ", err);
  }
});
router.get("/pendingFee", isCandidate, async (req, res) => {
  try {
    const menu = "pendingFee";

    res.render(`${req.vPath}/app/candidate/pendingFee`, {
      menu,
    });
  } catch (err) {
    console.log("caught error ", err);
  }
});
router.get("/learn", isCandidate, async (req, res) => {
  try {
    const menu = "learn";

    res.render(`${req.vPath}/app/candidate/learn`, {
      menu,
    });
  } catch (err) {
    console.log("caught error ", err);
  }
});
router
  .route("/myprofile")
  .get(isCandidate, async (req, res) => {
    try {
      const menu = "myprofile";
      let validation = { mobile: req.session.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }
      const candidate = await Candidate.findOne({
        mobile: value.mobile,
      }).populate([
        { path: "experiences.Company_State", select: ["name", "stateId"] },
        {
          path: "experiences.Company_City",
          select: ["name", "stateId", "cityId"],
        },
        { path: "experiences.Industry_Name", select: ["name"] },
        { path: "experiences.SubIndustry_Name", select: ["name"] },
        { path: "state", select: ["name", "stateId"] },
        { path: "locationPreferences.state", select: ["name", "stateId"] },
        {
          path: "locationPreferences.city",
          select: ["name", "stateId", "cityId"],
        },
      ]);
      const isProfileCompleted = candidate.isProfileCompleted;
      const isVideoCompleted = candidate.profilevideo
      const cashback = await CashBackLogic.findOne({})
      if (!candidate || candidate === null)
        throw req.ykError("candidate not found");
      const state = await State.find({
        countryId: "101",
        status: { $ne: false },
      });
      let totalCashback = await CandidateCashBack.aggregate([
        { $match: { candidateId: new mongoose.Types.ObjectId(candidate._id) } },
        { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
      ]);
      let city = [];
      let statefilter = { status: { $ne: false } };
      if (candidate.state) {
        statefilter["stateId"] = candidate.state?.stateId;
        city = await City.find(statefilter);
      }
      let stateIds = state.map((s) => s.stateId);
      const allcities = await City.find({
        status: { $ne: false },
        stateId: { $in: stateIds },
      });
      const Qualifications = await Qualification.find({ status: true }).sort({
        basic: -1,
      });
      const subQualification = await SubQualification.find({ status: true });
      const industry = await Industry.find({ status: true });
      const subIndustry = await SubIndustry.find({ status: true });
      const Universities = await University.find({ status: true });
      const techinalSkill = await Skill.find({
        type: "technical",
        status: true,
      });
      const nonTechnicalSkill = await Skill.find({
        type: "non technical",
        status: true,
      });
      return res.render(`${req.vPath}/app/candidate/myProfile`, {
        menu,
        candidate,
        state,
        city,
        cashback,
        Qualifications,
        subQualification,
        industry,
        subIndustry,
        Universities,
        techinalSkill,
        nonTechnicalSkill,
        allcities,
        isVideoCompleted: isVideoCompleted,
        isProfileCompleted: isProfileCompleted,
        totalCashback
      });
    } catch (err) {
      console.log("Err-============>", err)
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("/candidate/login");
    }
  })
  .post(isCandidate, async (req, res) => {
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    const {
      personalInfo,
      qualifications,
      technicalskills,
      nontechnicalskills,
      locationPreferences,
      experiences,
      totalExperience,
      isExperienced,
      highestQualification,
      yearOfPassing,
    } = req.body;
    const updatedFields = { isProfileCompleted: true };
    const userInfo = {};
    Object.keys(personalInfo).forEach((key) => {
      if (personalInfo[key] !== "") {
        updatedFields[key] = personalInfo[key];
      }
    });

    const user = await Candidate.findOne({ mobile: value.mobile });
    if (qualifications?.length > 0) {
      qualifications.forEach((i) => {
        if (i.collegeLatitude && i.collegeLongitude) {
          i['location'] = {
            type: 'Point',
            coordinates: [i.collegeLongitude, i.collegeLatitude]
          }
        }
      })

      updatedFields['qualifications'] = qualifications;
    }
    if (experiences?.length > 0) {
      updatedFields["experiences"] = experiences;
    }
    if (locationPreferences?.length > 0) {
      updatedFields["locationPreferences"] = locationPreferences;
    }
    if (technicalskills?.length > 0) {
      let technicalSkill = await getTechSkills(technicalskills);
      updatedFields["techSkills"] = technicalSkill;
    }
    if (nontechnicalskills?.length > 0) {
      let nonTechnicalSkill = await getNonTechSkills(nontechnicalskills);
      updatedFields["nonTechSkills"] = nonTechnicalSkill;
    }

    updatedFields["totalExperience"] = totalExperience;
    updatedFields["isExperienced"] = isExperienced;
    updatedFields["highestQualification"] = highestQualification;
    if (yearOfPassing) {
      updatedFields["yearOfPassing"] = yearOfPassing;
    }
    if (updatedFields.latitude && updatedFields.longitude) {
      updatedFields["location"] = { type: 'Point', coordinates: [updatedFields.longitude, updatedFields.latitude] }
    }
    if (user?.referredBy && user?.referredBy && user.isProfileCompleted == false) {
      const cashback = await CashBackLogic.findOne().select("Referral")
      const referral = await Referral.findOneAndUpdate(
        { referredBy: user.referredBy, referredTo: user._id },
        { status: referalStatus.Active, earning: cashback.Referral, new: true })

      await checkCandidateCashBack({ _id: user.referrefBy })
      await candidateReferalCashBack(referral)
    }
    const candidateUpdate = await Candidate.findByIdAndUpdate(
      user._id,
      updatedFields
    );
    if (personalInfo.name) {
      userInfo["name"] = personalInfo.name;
    }
    if (personalInfo.email) {
      userInfo["email"] = personalInfo.email;
    }

    await User.findOneAndUpdate({ mobile: user.mobile, role: 3 }, userInfo);

    if (!candidateUpdate) {
      req.flash("error", "Candidate update failed!");
      return res.send({ status: false, message: "Profile Update failed" });
    }
    if (user.isProfileCompleted == false && env.toLowerCase() === 'production') {
      let dataFormat = {
        Source: "mipie",
        FirstName: user.name,
        MobileNumber: user.mobile,
        LeadSource: "Website",
        LeadType: "Online",
        LeadName: "app",
        Course: "Mipie general",
        Center: "Padget",
        Location: "Technician",
        Country: "India",
        LeadStatus: "Profile Completed",
        ReasonCode: "27",
        AuthToken: extraEdgeAuthToken
      }
      let edgeBody = JSON.stringify(dataFormat)
      let header = { "Content-Type": "multipart/form-data" }
      let extraEdge = await axios.post(extraEdgeUrl, edgeBody, header).then(res => {
        console.log(res.data)
      }).catch(err => {
        console.log(err)
        return err
      })
    }

    await checkCandidateCashBack(candidateUpdate)
    await candidateProfileCashBack(candidateUpdate)
    await candidateVideoCashBack(candidateUpdate)
    let totalCashback = await CandidateCashBack.aggregate([
      { $match: { candidateId: new mongoose.Types.ObjectId(user._id) } },
      { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
    ]);
    let isVideoCompleted = ''
    if (personalInfo.profilevideo !== '') {
      isVideoCompleted = personalInfo.profilevideo
    }
    const isProfileCompleted = candidateUpdate.isProfileCompleted
    res.send({ status: true, message: "Profile Updated Successfully", isVideoCompleted: isVideoCompleted, isProfileCompleted: isProfileCompleted, totalCashback });
  });

router.post("/removelogo", isCandidate, async (req, res) => {
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  const candidate = await Candidate.findOne({
    mobile: value.mobile,
  });
  if (!candidate) throw req.ykError("candidate doesn't exist!");

  const candidateUpdate = await Candidate.findOneAndUpdate(
    { mobile: value.mobile },
    { image: "" }
  );
  if (!candidateUpdate) throw req.ykError("Candidate not updated!");
  req.flash("success", "candidate updated successfully!");
  res.send({ status: 200, message: "Profile Updated Successfully" });
});
router.post("/removeKYCImage", isCandidate, async (req, res) => {
  const { type } = req.body
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  console.log(type)
  const candidate = await Candidate.findOne({
    mobile: value.mobile,
  });
  if (!candidate) throw req.ykError("candidate doesn't exist!");
  let kycAadharUpdate, kycPanUpdate
  if (type === 'aadhar') {
    kycAadharUpdate = await kycDocument.findOneAndUpdate(
      { _candidate: candidate._id },
      { aadharCardImage: '' }
    );
  }
  if (type === 'pan') {
    kycPanUpdate = await kycDocument.findOneAndUpdate(
      { _candidate: candidate._id },
      { panCardImage: '' }
    );

  }
  console.log(kycPanUpdate, kycAadharUpdate)
  res.send({ status: true, message: 'File deleted successfully' })
})

router.get("/getcities", async (req, res) => {
  const { stateId } = req.query;
  const cityValues = await City.find({ stateId, status: true });
  res.status(200).send({ cityValues });
});

router.get("/getcitiesbyId", async (req, res) => {
  const { stateId } = req.query;
  const state = await State.findOne({ _id: stateId });

  const cityValues = await City.find({
    stateId: state.stateId,
    status: { $ne: false },
  });
  res.status(200).send({ cityValues });
});

router.get("/getSubQualification", async (req, res) => {
  const { qualificationId } = req.query;
  const subQualification = await SubQualification.find({
    status: true,
    _qualification: qualificationId,
  });
  if (!subQualification) {
    res
      .status(200)
      .send({ status: false, message: "No Subqualifications present" });
  }
  res.status(200).send({ status: true, subQualification });
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
router.post("/job/:jobId/apply", [isCandidate, authenti], async (req, res) => {
  let jobId = req.params.jobId;
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  let candidateMobile = value.mobile;
  let vacancy = await Vacancy.findOne({ _id: jobId });
  if (!vacancy) {
    return res.send({ status: false, msg: "Vacancy not Found!" });
  }
  let candidate = await Candidate.findOne({ mobile: candidateMobile }).populate([{
    path: 'state',
    select: "name"
  }, {
    path: 'city',
    select: "name"
  }]);

  // Coins are deducted on register for interview
  // let coins = await CoinsAlgo.findOne({});
  // let coinsDeducted
  // coinsDeducted = vacancy.applyReduction > 0 ? vacancy.applyReduction : coins.job
  // if (!candidate.creditLeft || candidate.creditLeft < coinsDeducted) {
  //   req.flash("error", "You don't have sufficient coins to apply on this job!");
  //   return res
  //     .status(200)
  //     .send({ status: false, msg: "Please Subscribe to Apply Now!" });
  // } else 
  if (candidate.appliedJobs && candidate.appliedJobs.includes(jobId)) {
    req.flash("error", "Already Applied");
    return res.send({ status: false, msg: "Already Applied" });
  } else {
    let alreadyApplied = await AppliedJobs.findOne({
      _candidate: candidate._id,
      _job: jobId,
    });
    if (alreadyApplied) {
      req.flash("error", "Already Applied");
      return res.send({ status: false, msg: "Already Applied" });
    };
    let apply = await Candidate.findOneAndUpdate(
      { mobile: candidateMobile },
      {
        $addToSet: { appliedJobs: jobId },
        // $inc: { creditLeft: -coinsDeducted },
      },
      { new: true, upsert: true }
    );
    let data = {};
    data["_job"] = jobId;
    data["_candidate"] = candidate._id;
    data["_company"] = vacancy._company;
    // data["coinsDeducted"] = coinsDeducted
    const appliedData = await AppliedJobs.create(data);

    // let sheetData = [candidate?.name, candidate?.mobile, candidate?.email, candidate?.sex, candidate?.dob ? moment(candidate?.dob).format('DD MMM YYYY') : '', candidate?.state?.name, candidate.city?.name, 'Job', `${process.env.BASE_URL}/jobdetailsmore/${jobId}`, "", "", moment(appliedData?.createdAt).utcOffset('+05:30').format('DD MMM YYYY hh:mm')]


    // Capitalize every word's first letter
    function capitalizeWords(str) {
      if (!str) return '';
      return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    }

    // Update Spreadsheet
    const sheetData = [
      moment(appliedData.createdAt).utcOffset('+05:30').format('DD MMM YYYY'),
      moment(appliedData.createdAt).utcOffset('+05:30').format('hh:mm A'),
      capitalizeWords(course?.name), // Apply the capitalizeWords function
      candidate?.name,
      candidate?.mobile,
      candidate?.email,
      candidate?.sex === 'Male' ? 'M' : candidate?.sex === 'Female' ? 'F' : '',
      candidate?.dob ? moment(candidate.dob).format('DD MMM YYYY') : '',
      candidate?.state?.name,
      candidate?.city?.name,
      'Job',
      `${process.env.BASE_URL}/jobdetailsmore/${jobId}`,
      "",
      ""


    ];
    await updateSpreadSheetValues(sheetData);


    // Extract UTM Parameters
    const sanitizeInput = (value) => typeof value === 'string' ? value.replace(/[^a-zA-Z0-9-_]/g, '') : value;
    const utm_params = {
      utm_source: sanitizeInput(req.query.utm_source || 'unknown'),
      utm_medium: sanitizeInput(req.query.utm_medium || 'unknown'),
      utm_campaign: sanitizeInput(req.query.utm_campaign || 'unknown'),
      utm_term: sanitizeInput(req.query.utm_term || ''),
      utm_content: sanitizeInput(req.query.utm_content || '')
    };

    // Extract fbp and fbc values
    let fbp = req.cookies?._fbp || '';
    let fbc = req.cookies?._fbc || '';
    if (!fbc && req.query.fbclid) {
      fbc = `fb.${Date.now()}.${req.query.fbclid}`;
    }

    // Prepare user data for Facebook Event
    const user_data = {
      em: [hashValue(candidate.email)],                          // Hashed email
      ph: [hashValue(candidate.mobile)],                        // Hashed phone number
      fn: hashValue(candidate.name?.split(" ")[0]),             // Hashed first name
      ln: hashValue(candidate.name?.split(" ")[1] || ""),       // Hashed last name
      zp: hashValue(candidate.zip || ""),                       // Hashed postcode
      db: hashValue(candidate.dob ? moment(candidate.dob).format('YYYY-MM-DD') : ""), // Hashed date of birth
      ct: hashValue(candidate.city?.name),                      // Hashed city
      st: hashValue(candidate.state?.name),                     // Hashed state/region
      country: hashValue("India"),                              // Hashed country
      ge: hashValue(candidate.sex === 'Male' ? 'm' : candidate.sex === 'Female' ? 'f' : ''), // Hashed gender
      client_ip_address: req.ip || '',                          // IP address (no hash required)
      client_user_agent: req.headers['user-agent'] || '',       // User agent (no hash required)
      fbp: req.cookies?._fbp || '',                             // Browser ID
      fbc: req.cookies?._fbc || (req.query.fbclid ? `fb.${Date.now()}.${req.query.fbclid}` : ''), // Click ID
      external_id: hashValue(candidate._id.toString())          // Hashed External ID (user database ID)
    };

    // Prepare custom data for Facebook Event
    const custom_data = {
      currency: "INR",
      value: course.registrationCharges || 0,
      content_ids: [courseId],
      content_type: "job",
      num_items: 1,
      ...utm_params
    };

    // Send Event to Facebook
    console.log("Sending Facebook Event...");
    const fbEventSent = await sendEventToFacebook("Job Apply", user_data, custom_data);

    if (!apply) {
      req.flash("error", "Already failed");
      return res.status(400).send({ status: false, msg: "Applied Failed!" });
    }
    let companyDetails = await Company.findOne({ _id: vacancy._company })
    let notificationData = {
      title: 'Applied Jobs',
      message: `You have applied to a job in ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} Keep applying to get a dream Job.__बधाई हो! आपने ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} में नौकरी के लिए आवेदन किया है |`,
      _candidate: candidate._id,
      source: 'System'
    }
    await sendNotification(notificationData);
    let newData = {
      title: 'New Applied',
      message: `${candidate.name} has recently applied for your job for ${vacancy.title}`,
      _company: vacancy._company
      , source: 'System'
    }
    await sendNotification(newData)
    await checkCandidateCashBack(candidate)
    await candidateApplyCashBack(candidate)
  }
  res.status(200).send({ status: true, msg: "Success" });
});
router.get("/appliedJobs", [isCandidate], async (req, res) => {
  const p = parseInt(req.query.page);
  const page = p || 1;
  const perPage = 10;
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  let candidate = await Candidate.findOne({
    mobile: value.mobile,
    isDeleted: false, status: true
  })
  const agg = [
    {
      '$match': {
        '_candidate': candidate._id
      }
    },
    {
      '$lookup': {
        from: 'companies',
        localField: '_company',
        foreignField: '_id',
        as: '_company'
      }
    },
    {
      '$match': {
        '_company.0.isDeleted': false,
        '_company.0.status': true
      }
    },
    {
      '$lookup': {
        from: 'vacancies',
        localField: '_job',
        foreignField: '_id',
        as: 'vacancy'
      }
    },
    {
      '$match': {
        'vacancy.0.status': true,
        'vacancy.0.validity': { $gte: new Date() }
      }
    },
    {
      '$lookup': {
        from: 'qualifications',
        localField: 'vacancy.0._qualification',
        foreignField: '_id',
        as: 'qualifications'
      }
    },
    {
      '$lookup': {
        from: 'industries',
        localField: 'vacancy.0._industry',
        foreignField: '_id',
        as: 'industry'
      }
    },
    {
      '$lookup': {
        from: 'cities',
        localField: 'vacancy.0.city',
        foreignField: '_id',
        as: 'city'
      }
    },
    {
      '$lookup': {
        from: 'states',
        localField: 'vacancy.0.state',
        foreignField: '_id',
        as: 'state'
      }
    },
    {
      '$sort': {
        'sequence': 1,
        'createdAt': -1
      }
    },
    {
      '$facet': {
        metadata: [{ '$count': "total" }],
        data: [{ $skip: perPage * page - perPage }, { $limit: perPage }]
      }
    }
  ]

  const appliedJobs = await AppliedJobs.aggregate(agg);
  console.log('agg: ', appliedJobs)
  let count = appliedJobs[0].metadata[0]?.total
  if (!count) {
    count = 0
  }
  let jobs = appliedJobs[0].data
  const totalPages = Math.ceil(count / perPage);
  res.render(`${req.vPath}/app/candidate/appliedJobs`, {
    menu: "appliedJobs",
    jobs,
    totalPages,
    page
  });
});
//register for interview 
router.post("/job/:jobId/registerInterviews", [isCandidate], async (req, res) => {
  let jobId = req.params.jobId;
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  let candidateMobile = value.mobile;
  let vacancy = await Vacancy.findOne({ _id: jobId });
  if (!vacancy) {
    return res.send({ status: false, msg: "Vacancy not Found!" });
  }
  let candidate = await Candidate.findOne({ mobile: candidateMobile });
  let coins = await CoinsAlgo.findOne({});
  let coinsDeducted
  coinsDeducted = vacancy.applyReduction > 0 ? vacancy.applyReduction : coins.job
  if (!candidate.creditLeft || candidate.creditLeft < coinsDeducted) {
    req.flash("error", "You don't have sufficient coins to register for interview!");
    return res
      .status(200)
      .send({ status: false, msg: "Please Subscribe to Apply Now!" });
  } /* else if (candidate.appliedJobs && candidate.appliedJobs.includes(jobId)) {
    req.flash("error", "Already registered for the interview");
    return res.send({ status: false, msg: "Already registered for the interview" });
  } */ else {
    let alreadyApplied = await AppliedJobs.findOne({
      _candidate: candidate._id,
      _job: jobId,
      isRegisterInterview: true
    });
    if (alreadyApplied) {
      req.flash("error", "Already Applied");
      return res.send({ status: false, msg: "Already Applied" });
    };
    await AppliedJobs.findOneAndUpdate({
      '_candidate': candidate._id,
      _job: jobId
    }, {
      $set: {
        isRegisterInterview: true
      }
    });
    let apply = await Candidate.findOneAndUpdate(
      { mobile: candidateMobile },
      {
        $addToSet: { appliedJobs: jobId, },
        $inc: { creditLeft: -coinsDeducted },
      },
      { new: true, upsert: true }
    );
    if (!apply) {
      req.flash("error", "Already failed");
      return res.status(400).send({ status: false, msg: "Applied Failed!" });
    }
    let companyDetails = await Company.findOne({ _id: vacancy._company })
    let notificationData = {
      title: 'Applied Jobs',
      message: `You have register for interview in ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} Keep register for interview to get a dream Job.__बधाई हो! आपने ${vacancy.displayCompanyName ? vacancy.displayCompanyName : companyDetails.name} में साक्षात्कार के लिए पंजीकृत किया है |`,
      _candidate: candidate._id,
      source: 'System'
    }
    await sendNotification(notificationData);
    let newData = {
      title: 'New Register',
      message: `${candidate.name} has recently registered for your interview for ${vacancy.title}`,
      _company: vacancy._company
      , source: 'System'
    }
    await sendNotification(newData)
    await checkCandidateCashBack(candidate)
    await candidateApplyCashBack(candidate)
  }
  res.status(200).send({ status: true, msg: "Success" });
});
//list of register for interview
router.get("/registerInterviewsList", [isCandidate], async (req, res) => {
  try {
    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    let candidate = await Candidate.findOne({
      mobile: value.mobile,
      isDeleted: false,
      status: true
    })
    const agg = [
      {
        '$match': {
          '_candidate': candidate._id,
          isRegisterInterview: true
        }
      },
      {
        '$lookup': {
          from: 'companies',
          localField: '_company',
          foreignField: '_id',
          as: '_company'
        }
      },
      {
        '$match': {
          '_company.0.isDeleted': false,
          '_company.0.status': true
        }
      },
      {
        '$lookup': {
          from: 'vacancies',
          localField: '_job',
          foreignField: '_id',
          as: 'vacancy'
        }
      },
      {
        '$match': {
          'vacancy.0.status': true,
          'vacancy.0.validity': { $gte: new Date() }
        }
      },
      {
        '$lookup': {
          from: 'qualifications',
          localField: 'vacancy.0._qualification',
          foreignField: '_id',
          as: 'qualifications'
        }
      },
      {
        '$lookup': {
          from: 'industries',
          localField: 'vacancy.0._industry',
          foreignField: '_id',
          as: 'industry'
        }
      },
      {
        '$lookup': {
          from: 'cities',
          localField: 'vacancy.0.city',
          foreignField: '_id',
          as: 'city'
        }
      },
      {
        '$lookup': {
          from: 'states',
          localField: 'vacancy.0.state',
          foreignField: '_id',
          as: 'state'
        }
      },
      {
        '$sort': {
          'sequence': 1,
          'createdAt': -1
        }
      },
      {
        '$facet': {
          metadata: [{ '$count': "total" }],
          data: [{ $skip: perPage * page - perPage }, { $limit: perPage }]
        }
      }
    ]
    console.log("Aggregation pipeline:", JSON.stringify(agg, null, 2));

    const appliedJobs = await AppliedJobs.aggregate(agg);
    if (!appliedJobs || !appliedJobs.length || !appliedJobs[0].data) {
      return res.status(404).json({ status: "failure", error: "No jobs found" });
    }

    const { data, metadata } = appliedJobs[0];
    const count = metadata[0]?.total || 0;
    const totalPages = Math.ceil(count / perPage);

    res.render(`${req.vPath}/app/candidate/registerInterviews`, {
      menu: "registerInterviews",
      jobs: data,
      totalPages,
      page: p
    });

  } catch (error) {
    console.error("Error fetching register interviews list:", error);
    res.status(500).json({ status: "failure", error: "Something went wrong!" });
  }

  //   console.log(appliedJobs, "check register list agg data")
  //   const data = appliedJobs[0].data; // Accessing the data property of the first element
  // console.log(data);
  //   let count = appliedJobs[0].metadata[0]?.total
  //   if(!count){
  //     count = 0
  //   }
  //   let jobs=appliedJobs[0].data
  //   const totalPages = Math.ceil(count / perPage);
  //   res.render(`${req.vPath}/app/candidate/registerInterviews`, {
  //     menu: "registerInterviews",
  //     jobs,
  //     totalPages,
  //     page
  //   });


});

router.post("/removeResume", isCandidate, async (req, res) => {
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  const candidate = await Candidate.findOne({
    mobile: value.mobile,
  });
  if (!candidate) throw req.ykError("Candidate Doesn't Exist!");
  const candidateUpdate = await Candidate.findOneAndUpdate(
    { mobile: value.mobile },
    { resume: "" }
  );
  if (!candidateUpdate) throw req.ykError("Candidate not updated!");
  req.flash("success", "candidate updated successfully!");
  res.send({ status: 200, message: "Profile Updated Successfully" });
});

router.post("/removeVideo", [isCandidate, authenti], async (req, res) => {
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }
  const candidateUpdate = await Candidate.findOneAndUpdate(
    { mobile: value.mobile },
    { profilevideo: "" }
  );
  if (!candidateUpdate) throw req.ykError("Candidate not updated!");
  req.flash("success", "candidate updated successfully!");
  res.send({ status: 200, message: "Profile Updated Successfully" });
});

router.get("/getCreditCount", [isCandidate, authenti], async (req, res) => {
  try {
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    let candidate = await Candidate.findOne({
      mobile: value.mobile,
      status: true,
      isDeleted: false,
    });
    if (!candidate) {
      return res.status(400).send({ status: false, msg: "Candidate not found!" });
    }
    res.status(200).send({ status: true, credit: candidate.creditLeft });
  } catch (error) {
    console.log('error: ', error);
  }
});

router.get("/getCoinOffers", [isCandidate, authenti], async (req, res) => {
  try {
    let offers = await coinsOffers
      .find({
        forCandidate: true,
        status: true,
        isDeleted: false,
        activeTill: { $gte: moment().startOf("day") },
      })
      .select("displayOffer payAmount")
      .sort({ payAmount: -1 })
      .limit(3);
    res.status(200).send(offers);
  } catch (err) {
    console.log("her comes Error =============> ", err);
  }
});
router.post("/updateprofilestatus", [isCandidate], async (req, res) => {
  try {
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const { status } = req.body;
    let candidateUpdate = await Candidate.findOneAndUpdate({ mobile: value.mobile }, { visibility: status });
    if (!candidateUpdate) {
      return res.send({ status: false, message: "Unable to update status" })
    }
    return res.send({ status: true, message: 'Status updated successfully' })
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", message: "Unable to update status" });
  }
})
router.post("/payment", [isCandidate, authenti], async (req, res) => {
  let { offerId, amount } = req.body;
  console.log(offerId, "candidate's offerId for the coins")

  if (!offerId || !amount) {
    return res.status(400).send({ status: false, msg: 'Incorrect Data.' })
  }

  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  let candidate = await Candidate.findOne({
    mobile: value.mobile,
    status: true,
    isDeleted: false,
  }).select("name mobile email");
  let instance = new Razorpay({
    key_id: apiKey,
    key_secret: razorSecretKey,
  });
  let options = {
    amount: amount * 100,
    currency: "INR",
    notes: { candidate: `${candidate._id}`, offer: `${offerId}`, name: `${candidate.name}`, mobile: `${value.mobile}` },
  };
  console.log(options.notes, 'notes to be saved in the razorpay details')
  console.log(options, 'options to be saved in the razorpay details')

  instance.orders.create(options, async function (err, order) {
    if (err) {
      console.log('Error>>>>>>>>>>>>>>>>', err)
      return res.send({ message: err.description })
    }
    console.log(order, '<<<<<<<<<<<<<<<< order details')
    res.send({ order: order, candidate: candidate });
  });
});

router.post("/coursepayment", [isCandidate, authenti], async (req, res) => {
  let { courseId } = req.body;

  if (!courseId) {
    return res.status(400).send({ status: false, msg: 'Incorrect Data.' })
  }

  let validation = { mobile: req.session.user.mobile }
  let { value, error } = CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  let course = await Courses.findById(courseId).lean();

  let candidate = await Candidate.findOne({
    mobile: value.mobile,
    status: true,
    isDeleted: false,
  }).select("name mobile email");
  let instance = new Razorpay({
    key_id: apiKey,
    key_secret: razorSecretKey,
  });
  let options = {
    amount: Number(course.registrationCharges) * 100,
    currency: "INR",
    notes: { candidate: `${candidate._id}`, course: `${courseId}`, name: `${candidate.name}`, mobile: `${value.mobile}` },
  };
  console.log(options.notes, 'notes to be saved in the razorpay details')
  console.log(options, 'options to be saved in the razorpay details')

  instance.orders.create(options, async function (err, order) {
    if (err) {
      console.log('Error>>>>>>>>>>>>>>>>', err)
      return res.send({ message: err.description })
    }
    console.log(order, '<<<<<<<<<<<<<<<< order details')
    res.send({ order: order, candidate: candidate });
  });
});

router.post("/paymentStatus", [isCandidate, authenti], async (req, res) => {
  let { paymentId, _candidate, _offer, orderId, amount, voucher } = req.body;
  console.log(_offer, '<<<<<<<< offerId in the payment status')
  let offerDetails = await coinsOffers.findOne({ _id: _offer });
  console.log(offerDetails, '<<<<<<<<<<<<<<<<< offerDetails')

  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  let candidate = await Candidate.findOne({
    mobile: value.mobile,
    status: true,
    isDeleted: false,
  }).select("_id")
  let addPayment = {
    paymentId,
    orderId,
    amount,
    coins: offerDetails.getCoins,
    _candidate,
    _offer,
  };

  let alreadyAllocated = await PaymentDetails.findOne({ $and: [{ $or: [{ paymentId }, { orderId }] }, { _candidate }] })
  if (alreadyAllocated) {
    return res.status(400).send({ status: false, msg: 'Already Allocated!' })
  }
  console.log('coins allocation start', addPayment)

  let voucherId = await Vouchers.findOne({ code: voucher, status: true, isDeleted: false, activeTill: { $gte: moment().utcOffset('+05:30') }, activationDate: { $lte: moment().utcOffset('+05:30') } }).select("_id")

  let instance = new Razorpay({
    key_id: apiKey,
    key_secret: razorSecretKey,
  });
  instance.payments
    .fetch(paymentId, { "expand[]": "offers" })
    .then(async (data) => {
      await PaymentDetails.create({
        ...addPayment,
        paymentStatus: data.status,
      });
      if (data.status == "captured") {
        await Candidate.findOneAndUpdate(
          { _id: _candidate },
          {
            $inc: {
              availableCredit: offerDetails.getCoins,
              creditLeft: offerDetails.getCoins,
            },
          }
        );
        await coinsOffers.findOneAndUpdate(
          { _id: _offer },
          { $inc: { availedCount: 1 } }
        );
        if (voucherId) {
          const voucherUsed = await VoucherUses.create({ _candidate: candidate._id, _voucher: voucherId._id })
          if (!voucherUsed) {
            return res.send({ status: false, message: "Unable to apply Voucher" })
          }
          let updateVoucher = await Vouchers.findOneAndUpdate({ _id: voucherId._id, status: true, isDeleted: false }, { $inc: { availedCount: 1 } }, { new: true })
        }
        res.send({ status: true, msg: "Success" });
      } else {
        res.send({ status: false, msg: "Failed" });
      }
    });
});

router.post("/coursepaymentStatus", [isCandidate, authenti], async (req, res) => {
  let { paymentId, orderId, amount, courseId, _candidate } = req.body;
  console.log(courseId, _candidate, '<<<<<<<< courseId in the payment status')
  let courseDetails = await AppliedCourses.findOne({ _candidate, _course: courseId });
  console.log(courseDetails, '<<<<<<<<<<<<<<<<< courseDetails')
  let course = await Courses.findById(courseId).lean();
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  let candidate = await Candidate.findOne({
    mobile: value.mobile,
    status: true,
    isDeleted: false,
  }).select("_id")
  let addPayment = {
    paymentId,
    orderId,
    amount: course.registrationCharges,
    coins: 0,
    _candidate,
    _course: courseId
  };

  let alreadyAllocated = await PaymentDetails.findOne({ $and: [{ $or: [{ paymentId }, { orderId }] }, { _candidate }] })
  if (alreadyAllocated) {
    console.log('=========== In alreadyAllocated ', alreadyAllocated)
    return res.status(400).send({ status: false, msg: 'Already Allocated!' })
  }
  // console.log('coins allocation start', addPayment)

  // let voucherId = await Vouchers.findOne({ code: voucher, status: true, isDeleted: false, activeTill: { $gte: moment().utcOffset('+05:30') }, activationDate: { $lte: moment().utcOffset('+05:30') } }).select("_id")

  let instance = new Razorpay({
    key_id: apiKey,
    key_secret: razorSecretKey,
  });
  instance.payments
    .fetch(paymentId, { "expand[]": "offers" })
    .then(async (data) => {
      await PaymentDetails.create({
        ...addPayment,
        paymentStatus: data.status,
      });
      if (data.status == "captured") {
        await AppliedCourses.findOneAndUpdate(
          { _id: courseDetails._id },
          {
            registrationFee: 'Paid'
          }
        );

        res.send({ status: true, msg: "Success" });
      } else {
        res.send({ status: false, msg: "Failed" });
      }
    });
});

router.get("/Coins", [isCandidate], async (req, res) => {
  const p = parseInt(req.query.page);
  const page = p || 1;
  const perPage = 10;
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  let candidate = await Candidate.findOne({
    mobile: value.mobile,
    status: true,
    isDeleted: false,
  }).select("_id creditLeft");
  let populate = {
    path: "_offer",
    select: "displayOffer",
  };
  let count = await PaymentDetails.countDocuments({ _candidate: candidate._id })
  const totalPages = Math.ceil(count / perPage);
  let latestTransactions = await PaymentDetails.find({
    _candidate: candidate._id,
  })
    .populate(populate)
    .skip(perPage * page - perPage)
    .limit(perPage)
    .sort({ createdAt: -1 });
  let coinOffers = await coinsOffers.find({
    forCandidate: true,
    isDeleted: false,
    status: true,
    activeTill: { $gte: moment().startOf("day") },
  });
  res.render(`${req.vPath}/app/candidate/miPieCoins`, {
    menu: "miPieCoins",
    latestTransactions,
    coinOffers,
    candidate,
    totalPages,
    count,
    page
  });
});

router.get("/completeProfile", [isCandidate, authenti], async (req, res) => {
  try {
    let highestQualification = await Qualification.find({ status: true });
    let state = await State.find({ status: true, countryId: "101" });
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    let candidate = await Candidate.findOne(
      { mobile: value.mobile },
      " sex dob address state city location pincode highestQualification isExperienced totalExperience location latitude longitude place mobile whatsapp"
    );
    let city = [];

    if (candidate.state) {
      let st = await State.findOne({ _id: candidate.state }, "stateId");
      city = await City.find({ status: { $ne: false }, stateId: st.stateId });
    }
    dob = moment(candidate.dob).utcOffset("+05:30").format("YYYY-MM-DD");

    res.status(200).send({ highestQualification, state, city, candidate, dob });
  } catch (err) {
    res.status(500).send({ status: false, err });
  }
});
router.get("/getcandidatestatus", [isCandidate], async (req, res) => {
  let validation = { mobile: req.session.user.mobile }
  let { value, error } = await CandidateValidators.userMobile(validation)
  if (error) {
    console.log(error)
    return res.send({ status: "failure", error: "Something went wrong!", error });
  }

  const candidate = await Candidate.findOne({ mobile: value.mobile });
  res.send({ status: true, visibility: candidate.visibility })
})
router.get("/nearbyJobs", [isCandidate], async (req, res) => {
  try {
    const allQualification = await Qualification.find({ status: true }).sort({
      basic: -1,
    });
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }
    const userMobile = value.mobile;
    const candidate = await Candidate.find({ status: true, isDeleted: false, mobile: userMobile });
    if (!candidate.length) {
      req.flash("error", "Your are disabled");
      return res.redirect("back");
    }
    const allIndustry = await Industry.find({ status: true });
    const allStates = await State.find({
      countryId: "101",
      status: { $ne: false },
    });
    let latitude = candidate[0].latitude
    let longitude = candidate[0].longitude
    let skills = await Skill.find({ status: true, type: 'technical' });
    res.render(`${req.vPath}/app/candidate/nearbyJobs`, {
      menu: "nearbyJobs",
      allQualification,
      allIndustry,
      allStates,
      skills,
      candidate,
      latitude,
      longitude
    });
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});

router.get(
  "/getNearbyJobsForMap",
  [isCandidate, authenti],
  async (req, res) => {
    const userMobile = req.user.mobile;
    const candidate = await Candidate.findOne({ mobile: userMobile });
    if (!candidate.latitude || !candidate.longitude) {
      req.flash("error", "Add Your Current Location!");
      return res.send({ jobs: [], nearest: {}, status: false })
    }
    const lat = Number(candidate.latitude);
    const long = Number(candidate.longitude);
    let {
      qualification,
      experience,
      industry,
      state,
      jobType,
      minSalary,
      techSkills,
      name,
      distance
    } = req.query;
    let filter = { 'status': true, validity: { $gte: new Date() }, verified: true }
    if (qualification) {
      filter['_qualification'] = new mongoose.Types.ObjectId(qualification)
    }
    if (industry) {
      filter['_industry'] = new mongoose.Types.ObjectId(industry)
    }
    if (jobType) {
      filter['jobType'] = jobType
    }
    if (state) {
      filter['state'] = new mongoose.Types.ObjectId(state)
    }
    if (experience) {
      filter['experience'] = { $lte: Number(experience) }
    }
    if (techSkills) {
      filter['_techSkills'] = new mongoose.Types.ObjectId(techSkills);
    }
    if (minSalary) {
      filter["$or"] = [
        { isFixed: true, amount: { $gte: Number(minSalary) } },
        { isFixed: false, min: { $gte: Number(minSalary) } },
      ];
    }
    if (name) {
      filter["$or"] = [
        { 'displayCompanyName': { "$regex": name, "$options": "i" } },
        { 'company.0.name': { "$regex": name, "$options": "i" } }
      ]
    }
    let jobDistance = Infinity
    if (distance && distance != 'all' && distance != '0') {
      jobDistance = Number(distance) * 1000
    }

    let jobs = await Vacancy.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [long, lat] },
          distanceField: "distance",
          maxDistance: jobDistance,
          query: { location: { $exists: true } },
        },
      },
      {
        $match: filter
      },
      {
        $lookup: {
          from: "companies",
          localField: "_company",
          foreignField: "_id",
          as: "_company",
        }
      },
      {
        '$match': {
          '_company.0.isDeleted': false,
          '_company.0.status': true,
          '_id': { "$nin": candidate.appliedJobs }
        }
      },
      {
        $lookup: {
          from: 'states',
          localField: 'state',
          foreignField: '_id',
          as: 'state'
        }
      },
      {
        $lookup: {
          from: 'cities',
          localField: 'city',
          foreignField: '_id',
          as: 'city'
        }
      },
      {
        $lookup: {
          from: 'industries',
          localField: '_industry',
          foreignField: '_id',
          as: '_industry'
        }
      },
      {
        $lookup: {
          from: 'qualifications',
          localField: '_qualification',
          foreignField: '_id',
          as: '_qualification'
        }
      }
    ]);
    let nearest = jobs[0]

    if (jobs.length < 1) {
      nearest = {
        location: {
          coordinates: [long, lat]
        }
      }
    }

    res.send({ jobs, nearest });
  }
);

router.get('/backfill/location', [isCandidate], async (req, res) => {
  let candidates = await Candidate.find({ latitude: { $exists: true }, longitude: { $exists: true } })
  let count = 0
  for (candidate of candidates) {
    let upd = await Candidate.findOneAndUpdate({ _id: candidate._id }, {
      location: {
        type: 'Point',
        coordinates: [Number(candidate.longitude), Number(candidate.latitude)]
      }
    }, { new: true })
    count++
    console.log(upd)
  }
  console.log(count)
  res.send({ count: count })
})

router.get("/myEarnings", [isCandidate], async (req, res) => {
  try {
    const perPage = 20;
    const p = parseInt(req.query.page, 10);
    const page = p || 1;
    let canRedeem = false
    let limit = 3
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    let candidate = await Candidate.findOne({ mobile: value.mobile });
    if (!candidate) {
      req.flash("error", err.message || "Candidate not found!");
      return res.send({ status: false, message: "Candidate not found!" });
    }
    await checkCandidateCashBack(candidate)
    let candidateEarning = await CandidateCashBack.find({ candidateId: candidate._id, eventType: cashbackEventType.credit })
      .sort({ createdAt: -1 }).limit(limit)
    let count = await CandidateCashBack.find({ candidateId: candidate._id }).countDocuments()
    const totalPages = Math.ceil(count / perPage);

    let totalCashback = await CandidateCashBack.aggregate([
      { $match: { candidateId: new mongoose.Types.ObjectId(candidate._id) } },
      { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
    ]);
    let thresholdCashback = await CashBackLogic.findOne({});
    let documents = await KycDocument.findOne({ _candidate: candidate._id })
    if (totalCashback[0]?.totalAmount && totalCashback[0]?.totalAmount >= thresholdCashback.threshold && documents?.kycCompleted == true) {
      canRedeem = true
    }
    let activeRequest = await CashBackRequest.find({ _candidate: candidate._id }).sort({ createdAt: -1 }).limit(limit)
    res.render(`${req.vPath}/app/candidate/myearnings`, {
      menu: "myEarnings", totalCashback: totalCashback ? totalCashback[0]?.totalAmount : 0, documents, upi: candidate.upi,
      canRedeem, threshold: thresholdCashback.threshold, totalPages, page, perPage, count, candidateEarning, activeRequest
    });
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});

router.post("/requestCashback", [isCandidate], async (req, res) => {
  try {
    let { amount } = req.body
    amount = Number(amount)
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    let candidate = await Candidate.findOne({ mobile: value.mobile });
    if (!candidate) {
      return res.status(400).send({ status: false, msg: 'User not found!' })
    }
    let kyc = await KycDocument.findOne({ _candidate: candidate._id, kycCompleted: false })
    if (kyc) {
      return res.status(400).send({ status: false, msg: 'KYC not completed!' })
    }
    let cashbackDetails = await CashBackLogic.findOne({});
    if (amount < cashbackDetails.threshold) {
      return res.send({ status: false, msg: 'Not enough money to redeem!' })
    }
    let add = {
      candidateId: candidate._id,
      eventType: cashbackEventType.debit,
      eventName: candidateCashbackEventName.cashbackrequested,
      amount: amount * -1,
      isPending: true,
    };
    let addEntry = await CandidateCashBack.create(add)
    let addRequest = await CashBackRequest.create(
      { _candidate: candidate._id, amount: amount, isAccepted: false, status: cashbackRequestStatus.pending, _cashback: addEntry._id })
    let updatePreviousRecords = await CandidateCashBack.updateMany({ candidateId: candidate._id, eventType: cashbackEventType.credit }, { isPending: false });
    if (!addRequest || !addEntry || !updatePreviousRecords) {
      return res.status(400).send({ status: false, msg: 'Cashback Request failed!' })
    }
    return res.status(201).send({ status: true, msg: 'Cashback Request sent!' })
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.send({ status: "failure", error: "Something went wrong!" });
  }
});

router.route('/cashback')
  .get([isCandidate], async (req, res) => {
    try {
      let validation = { mobile: req.session.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }

      const candidate = await Candidate.findOne({ mobile: value.mobile }).select("name")
      if (!candidate) {
        console.log("Candidate doesn't exists")
        req.flash("error", "Candidate doesn't exists!");
      }
      let thresholdCashback = await CashBackLogic.findOne({});
      res.render(`${req.vPath}/app/candidate/cashback`, {
        thresholdCashback, candidate, menu: 'cashback'
      });
    }
    catch (err) {
      console.log(err);
      req.flash("error", err.message || "Something went wrong!");
      return res.status(500).send({ status: false, message: err.message })
    }
  })

router.route('/kycDocument')
  .post([isCandidate], async (req, res) => {
    try {
      let validation = { mobile: req.session.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }

      let candidate = await Candidate.findOne({ mobile: value.mobile })
      if (!candidate) {
        req.flash("error", "Candidate doesn't exists!");
        return res.status(404).send({ status: false, message: "Candidate doesn't exists!" })
      }
      let { aadharCard, aadharCardImage, panCard, panCardImage, upi } = req.body
      let add = {}
      if (aadharCard || aadharCard == '') {
        add['aadharCard'] = aadharCard
      }
      if (aadharCardImage || aadharCardImage == '') {
        add['aadharCardImage'] = aadharCardImage
      }
      if (panCard || panCard == '') {
        add['panCard'] = panCard
      }
      if (panCardImage || panCardImage == '') {
        add['panCardImage'] = panCardImage
      }
      if (upi) {
        let updateUpi = await Candidate.findOneAndUpdate({ _id: candidate._id }, { upi })
        if (!updateUpi) {
          req.flash("error", "UPI Id not updated!");
          return res.status(404).send({ status: false, message: "UPI Id not updated!" })
        }
      }
      let alreadyUploaded = await KycDocument.findOne({ _candidate: candidate._id })
      if (alreadyUploaded && alreadyUploaded.kycCompleted == false) {
        add['kycCompleted'] = false
        add['status'] = ''
        add['comment'] = ''
        let updateDocument = await KycDocument.findOneAndUpdate({ _candidate: candidate._id }, add)
        if (!updateDocument) {
          req.flash("error", "Unable to upload Documents!");
          return res.status(400).send({ status: false, message: "Unable to upload Documents!" })
        }
        req.flash("success", "Documents uploaded Successfully!");
        return res.redirect("back");
      } else if (!alreadyUploaded) {
        add['_candidate'] = candidate._id
        let uploadDocument = await KycDocument.create(add)
        if (!uploadDocument) {
          req.flash("error", "Unable to upload Documents!");
          return res.status(400).send({ status: false, message: "Unable to upload Documents!" })
        }
        req.flash("success", "Documents uploaded Successfully!");
        return res.redirect("back");
      } else {
        req.flash("success", "Documents uploaded Successfully!");
        return res.redirect("back");
      }
    }
    catch (err) {
      console.log(err);
      req.flash("error", err.message || "Something went wrong!");
      return res.status(500).send({ status: false, message: err.message })
    }
  })
router.route('/InterestedCompanies').get([isCandidate], async (req, res) => {
  try {

    const menu = 'InterestedCompanies'
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
    }).populate([
      { path: "experiences.Company_State", select: ["name", "stateId"] },
      {
        path: "experiences.Company_City",
        select: ["name", "stateId", "cityId"],
      },
      { path: "experiences.Industry_Name", select: ["name"] },
      { path: "experiences.SubIndustry_Name", select: ["name"] },
      { path: "state", select: ["name", "stateId"] },
      { path: "locationPreferences.state", select: ["name", "stateId"] },
      {
        path: "locationPreferences.city",
        select: ["name", "stateId", "cityId"],
      },
    ]);
    const count = await HiringStatus.find({ candidate: candidate._id, isDeleted: false }).countDocuments()
    const p = parseInt(req.query.page);
    const page = p || 1;
    const perPage = 10;
    const totalPages = Math.ceil(count / perPage);
    const hiringStatus = await HiringStatus.find({ candidate: candidate._id, isDeleted: false }, 'status company updatedAt comment').sort({ updatedAt: -1 })
      .populate(
        [
          {
            path: "company", select: ["_industry", "cityId", "name"],
            populate: [{ path: "_industry", select: "name" }],
          }]
      ).skip(perPage * page - perPage)
      .limit(perPage);
    let cityArray = []
    hiringStatus.forEach(status => {
      cityArray.push(status.company?.cityId)
    })
    const cities = await City.find({ _id: { $in: cityArray } }).select("name");
    return res.status(200).render('app/candidate/InterestedCompanies', { menu, hiringStatus, candidate, cities, page, totalPages, count })
  }
  catch (err) {
    console.log("err", err)
  }
})

router.route('/notifications').get([isCandidate], async (req, res) => {
  try {
    const menu = 'Notifications'
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
    })
    if (!candidate) {
      req.flash("error", "Candidate doesn't exists!");
      return res.status(404).send({ status: false, message: "Candidate doesn't exists!" })
    }
    const notificationsms = await Notification.find({ _candidate: candidate._id });
    const notificationsUpdate = await Notification.updateMany({ _candidate: candidate._id, isRead: false }, { $set: { isRead: true } })
    return res.status(200).render('app/candidate/Notifications', { menu, notificationsms })
  }
  catch (err) {
    console.log("err", err)
  }
})
router.get("/watchVideos", [isCandidate], async (req, res) => {
  try {
    const videos = await VideoData.find({ status: true })
    res.render(`${req.vPath}/app/candidate/watchVideos.ejs`, { menu: 'videos', videos })
  } catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message })
  }
})
router.get('/notificationCount', [isCandidate, authenti], async (req, res) => {
  try {
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
    })
    if (!candidate) {
      return res.status(404).send({ status: false, message: "Candidate doesn't exists!" })
    }
    const notifications = await Notification.countDocuments({ _candidate: candidate._id, isRead: false });
    res.send({ status: true, count: notifications })
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message })
  }
})
router.put('/applyVoucher', [isCandidate, authenti], async (req, res) => {
  try {
    let { amount, code, offerId } = req.body;

    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    let candidate = await Candidate.findOne({ mobile: value.mobile, status: true, isDeleted: false })
    let voucher = await Vouchers.findOne({ code, status: true, isDeleted: false, activeTill: { $gte: moment().utcOffset('+05:30') }, activationDate: { $lte: moment().utcOffset('+05:30') } })
    if (!voucher) {
      return res.send({ status: false, message: `Voucher does not exists` })
    }

    let isUsedVoucher = await VoucherUses.findOne({ _candidate: candidate._id, _voucher: voucher._id, status: true, isDeleted: false })
    if (isUsedVoucher) {
      return res.send({ status: false, message: `Voucher already used` })
    }

    if (voucher.voucherType.toLowerCase() === 'amount')
      amount = amount - voucher.value

    else
      amount = amount - (amount * voucher.value) / 100

    if (amount < 0)
      return res.send({ status: false, message: "Invalid Voucher" })

    if (amount == 0) {
      let offerDetails = await coinsOffers.findOne({ _id: offerId });
      let candidateUpdate = await Candidate.findByIdAndUpdate(
        { _id: candidate._id },
        {
          $inc: {
            availableCredit: offerDetails.getCoins,
            creditLeft: offerDetails.getCoins,
          },
        }
      );
      await PaymentDetails.create({
        paymentId: new mongoose.Types.ObjectId(),
        orderId: new mongoose.Types.ObjectId(),
        amount,
        coins: offerDetails.getCoins,
        _candidate: candidate._id,
        _offer: offerId,
        comments: "free offer availed",
        paymentStatus: 'captured',
      });
      await coinsOffers.findOneAndUpdate(
        { _id: offerId },
        { $inc: { availedCount: 1 } }
      );
      if (voucher._id) {
        const voucherUsed = await VoucherUses.create({ _candidate: candidate._id, _voucher: voucher._id })
        if (!voucherUsed) {
          return res.send({ status: false, message: "Unable to apply Voucher" })
        }
        let updateVoucher = await Vouchers.findOneAndUpdate({ _id: voucher._id, status: true, isDeleted: false }, { $inc: { availedCount: 1 } }, { new: true })
        return res.status(200).send({ status: true, message: 'Voucher Applied', amount })
      }
    }
    res.status(200).send({ status: true, message: 'Voucher Applied', amount })
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message })
  }
})

router.get('/notificationCount', [isCandidate, authenti], async (req, res) => {
  try {
    let validation = { mobile: req.session.user.mobile }
    let { value, error } = await CandidateValidators.userMobile(validation)
    if (error) {
      console.log(error)
      return res.send({ status: "failure", error: "Something went wrong!", error });
    }

    const candidate = await Candidate.findOne({
      mobile: value.mobile,
    })
    if (!candidate) {
      return res.status(404).send({ status: false, message: "Candidate doesn't exists!" })
    }
    const notifications = await Notification.countDocuments({ _candidate: candidate._id, isRead: false });
    res.send({ status: true, count: notifications })
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message })
  }
})
router.get('/referral', isCandidate, async (req, res) => {
  try {
    const user = req.session.user
    const { fromDate, toDate, status } = req.query
    let filter = {}
    if (fromDate && toDate) {
      let fdate = moment(fromDate).utcOffset("+05:30").startOf('day').toDate()
      let tdate = moment(toDate).utcOffset("+05:30").endOf('day').toDate()
      filter["createdAt"] = { $gte: fdate, $lte: tdate }
    } else if (fromDate) {
      let fdate = moment(fromDate).utcOffset("+05:30").startOf('day').toDate()
      filter["createdAt"] = { $gte: fdate }
    } else if (toDate) {
      let tdate = moment(toDate).utcOffset("+05:30").endOf('day').toDate()
      filter["createdAt"] = { $lte: tdate }
    }
    if (status) {
      filter["status"] = status
    }
    const candidate = await Candidate.findOne({ mobile: user.mobile, status: true, isDeleted: false })
    if (!candidate) {
      req.flash("error", "Your are disabled");
      return res.redirect("back");
    }
    const cashback = await CashBackLogic.findOne().select("Referral")
    const count = await Referral.countDocuments({ referredBy: candidate._id, ...filter })
    const p = parseInt(req.query.page);
    const page = p || 1;
    let perPage = 10
    const totalPages = Math.ceil(count / perPage);
    const referral = await Referral.find({ referredBy: candidate._id, ...filter })
      .populate([{ path: 'referredTo', select: 'name mobile ' }])
      .skip(perPage * page - perPage)
      .limit(perPage)

    res.render(`${req.vPath}/app/candidate/referral`, { menu: 'referral', candidate, cashback, referral, totalPages, page, count, data: req.query });
  }
  catch (err) {
    console.log(err);
    return res.status(500).send({ status: false, message: err.message })
  }
})

router.get('/shareCV', isCandidate, async (req, res) => {
  try {
    res.render(`${req.vPath}/app/candidate/shareCV`, { menu: 'shareCV' });
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, message: err.message })
  }
})

router.get('/createResume', isCandidate, authenti, async (req, res) => {
  try {
    const user = req.session.user
    const candidate = await Candidate.findOne({ mobile: user.mobile, isDeleted: false })
    if (!candidate) {
      return res.status(400).send({ status: false, message: "No such candidate found" })
    }

    let url = `${req.protocol}://${req.get("host")}/candidateForm/${candidate._id}`
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
      path: path.join(__dirname, `../../../public/documents/output${candidate._id}.pdf`),
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

    res.send({ status: 200, uploadData: `${req.protocol}://${req.get("host")}/documents/output${candidate._id}.pdf` });
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, message: err.message })
  }
})
router.route('/verification')
  .get(isCandidate, authenti, async (req, res) => {
    try {
      let validation = { mobile: req.session.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }

      const userMobile = value.mobile;
      const candidate = await Candidate.findOne({ mobile: userMobile }).select("verified mobile")
      if (!candidate) {
        return res.send({ status: false, message: "No such user found" })
      }
      return res.send({ status: true, data: candidate })
    }
    catch (err) {
      console.log(err);
      return res.send({ status: false, message: err.message })
    }
  })
  .post(isCandidate, authenti, async (req, res) => {
    try {
      const { mobile, verified } = req.body;
      let candidate = await Candidate.findOne({ mobile });
      if (!candidate) {
        return res.send({ status: false, message: "No such user found" })
      }
      let updatedData = await Candidate.findOneAndUpdate({ mobile }, { verified }, { new: true })
      console.log('updated Verification============', updatedData)
      if (!updatedData) {
        return res.send({ status: false, message: "Verification failed" })
      }
      return res.send({ status: true, data: updatedData, messsage: 'Verification successful' })
    }
    catch (err) {
      console.log('error while updating the verification status========', err);
      return res.send({ status: false, message: err.message })
    }
  })
router.route('/requestLoan')
  .get(isCandidate, async (req, res) => {
    try {
      let validation = { mobile: req.session.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }

      let mobile = value.mobile;
      let errMessage;
      let candidate = await Candidate.findOne({ isDeleted: false, mobile })
      if (!candidate) {
        req.flash("error", "No such user Exists");
        return res.redirect("back")
      }
      if (!candidate.isProfileCompleted) {
        errMessage = 'Please complete your Profile / कृपया अपना प्रोफाइल पूरा करें।';
        return res.render(`${req.vPath}/app/candidate/requestLoan`, { menu: 'requestLoan', loanpurpose: loanEnquiryPurpose, errMessage })
      }
      let loanDue = await LoanEnquiry.findOne({ _candidate: candidate._id, status: loanEnquiryStatus.Due })
      if (loanDue) {
        errMessage = 'You have already submitted the Loan request. We will update you soon. / आपने पहले ही ऋण अनुरोध सबमिट कर दिया है। हम आपको जल्द ही अपडेट करेंगे।';
        return res.render(`${req.vPath}/app/candidate/requestLoan`, { menu: 'requestLoan', loanpurpose: loanEnquiryPurpose, errMessage })
      }

      return res.render(`${req.vPath}/app/candidate/requestLoan`, { menu: 'requestLoan', loanpurpose: loanEnquiryPurpose, errMessage })
    }
    catch (err) {
      console.log(err)
      return res.status(500).send({ status: false, message: err.message })
    }
  })
  .post(isCandidate, authenti, async (req, res) => {
    try {
      const body = req.body;
      let validation = { mobile: req.session.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }

      const candidate = await Candidate.findOne({ mobile: value.mobile, isDeleted: false, status: true })
      if (!candidate) {
        return res.send({ status: false, message: 'No such user found' })
      }
      let loanDue = await LoanEnquiry.findOne({ _candidate: candidate._id, status: loanEnquiryStatus.Due })
      if (loanDue) {
        return res.send({ status: false, message: 'You have already submitted the Loan request. We will update you soon.' })
      }
      body["_candidate"] = candidate._id
      body["status"] = loanEnquiryStatus.Due
      const loan = await LoanEnquiry.create(body)
      if (!loan) {
        return res.send({ status: false, message: 'Something went wrong' })
      }
      return res.status(200).send({ status: true, message: 'Loan request sent successfully' })
    }
    catch (err) {
      console.log(err)
      return res.status(500).send({ status: false, message: err.message })
    }
  })

router.route('/review/:job')
  .post([isCandidate, authenti], async (req, res) => {
    try {
      let validation = { mobile: req.session.user.mobile }
      let { value, error } = await CandidateValidators.userMobile(validation)
      if (error) {
        console.log(error)
        return res.send({ status: "failure", error: "Something went wrong!", error });
      }
      const candidate = await Candidate.findOne({ mobile: value.mobile, isDeleted: false, status: true })
      if (!candidate) {
        return res.send({ status: false, message: 'No such user found' })
      }
      const jobId = req.params.job
      const { rating, comment } = req.body;
      if (!rating || !jobId) {
        return res.status(400).send({ status: false, msg: 'Missing Data.' })
      }
      let reviewDetails = {
        _job: jobId,
        _user: candidate._id,
        rating
      }
      if (comment) reviewDetails.comment = comment
      const alreadyReviewed = await Review.findOne({ _job: jobId, _user: candidate._id })
      if (alreadyReviewed) {
        return res.status(400).send({ status: false, msg: 'Already Reviewed' })
      }
      const createReview = await Review.create(reviewDetails)
      if (!createReview) {
        return res.status(400).send({ status: false, msg: 'Review not created.' })
      }
      return res.status(200).send({ status: true, msg: 'Review created Successfully.' })
    }
    catch (err) {
      console.log(err)
      return res.status(500).send({ status: false, message: err.message })
    }
  })
module.exports = router;
