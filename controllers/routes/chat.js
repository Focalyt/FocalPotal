const express = require("express");
const moment = require("moment");
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config()
const { extraEdgeAuthToken, extraEdgeUrl, env } = require("../../config");

const {
	Vacancy, Courses, Candidate, Company, AppliedJobs, AppliedCourses, User, CandidateCashBack
} = require("../models");

const { sendNotification } = require('./services/notification');
const { CandidateValidators } = require('../../helpers/validators')
const {updateSpreadSheetValues} = require("./services/googleservice")
const { candidateProfileCashBack, candidateVideoCashBack, candidateApplyCashBack, checkCandidateCashBack, candidateReferalCashBack } = require('./services/cashback')

const chatRoutes = express.Router();
const commonRoutes = express.Router();

commonRoutes.get("/joblist", async (req, res) => {
	try {
		let recentJobs = await Vacancy.find({ status: true, _company: { $ne: null }, validity: { $gte: moment().utcOffset('+05:30') },verified:true }).populate([
			{
				path: '_company',
				select: "name logo stateId cityId"
			},
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
                path:"_subQualification",
				select:"name"
			},
			{
				path: "state",
				select: "name",
			},
			{
				path: "city",
				select: "name",
			},]).sort({ sequence: 1, createdAt: -1 });
		
		return res.send({ status: true, activeJobs:recentJobs });
	} catch (err) {
		return res.send({ status: false, err })
	}
})
commonRoutes.get("/courselist", async (req, res) => {
	try {
		const { courseType } = req.query;
	  const COURSE_TYPES = ['coursejob', 'course'];  
  
	  let query = { status: true };
  
	  if (courseType && COURSE_TYPES.includes(courseType)) {
		query.courseType = courseType;
	  } else {
		query.courseType = { $in: COURSE_TYPES };
	  }
  
	  let recentCourses = await Courses.find(query).populate({
		path:"sectors",
		select:"name id"
	  })
		.sort({ createdAt: -1 });
  
	  return res.send({ status: true, activeCourses: recentCourses });
	} catch (err) {
	  return res.send({ status: false, err });
	}
  });
  
   
commonRoutes.get("/jobDetails/:id",async(req,res)=>{
	try {
        const { id } = req.params;
        
        let job = await Vacancy.findOne({ _id: id })
            .populate([
                {
                    path: '_company',
                    select: "name logo stateId cityId"
                },
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
					path:"_subQualification",
					select:"name"
				},
                {
                    path: "state",
                    select: "name",
                },
                {
                    path: "city",
                    select: "name",
                }
            ]);

        if (!job) {
            return res.status(404).send({ status: false, message: "Job not found" });
        }

        return res.send({ status: true, jobdetails:job });
    }catch(err){
	return res.send({status:false,err})
}

})

commonRoutes.get("/coursedetails/:id",async(req,res)=>{
	try{
		const {id}=req.params;
		let course=await Courses.findOne({_id:id}).populate({
			path:"sectors",
			select:"name id"
		  })

		return res.send({status:true,courseDetails:course})
	}
	catch(err){
		return res.send({status:false,err})
	}
})

commonRoutes.post("/applyjob/:id",async(req,res)=>{
	try{
		let {id} = req.params;
		let jobId = id;
		
  		let validation = { mobile: req.body.mobile }
  		let { value, error } = CandidateValidators.userMobile(validation)
  		if (error) {
  		  return res.send({ status: "failure", error: "Something went wrong!", error });
  		}
  		let candidateMobile = value.mobile;
  		let vacancy = await Vacancy.findOne({ _id: jobId });
		
  		if (!vacancy) {
  		  return res.send({ status: false, msg: "Vacancy not Found!" });
  		}
		
  		let candidate = await Candidate.findOne({ mobile: candidateMobile });
		
		if(!candidate){
			return res.send({ status: false, msg: "Candidate not found!" });
		}
  		if (candidate.appliedJobs && candidate.appliedJobs.includes(jobId)) {
  		  return res.send({ status: false, msg: "Already Applied" });
  		} else {
  		  let alreadyApplied = await AppliedJobs.findOne({
  		    _candidate: candidate._id,
  		    _job: jobId,
  		  });
  		  if (alreadyApplied) {
  		    return res.send({ status: false, msg: "Already Applied" });
  		  };
  		  let apply = await Candidate.findOneAndUpdate(
  		    { mobile: candidateMobile },
  		    {
  		      $addToSet: { appliedJobs: jobId }
  		    },
  		    { new: true, upsert: true }
  		  );
		  
  		  let data = {};
  		  data["_job"] = jobId;
  		  data["_candidate"] = candidate._id;
  		  data["_company"] = vacancy._company;
  		  
  		  const appliedData = await AppliedJobs.create(data);
	  
  		  let sheetData = [candidate?.name, candidate?.mobile,candidate?.email, candidate?.sex, candidate?.dob ? moment(candidate?.dob).format('DD MMM YYYY'): '', candidate?.state?.name, candidate.city?.name, 'Job', `${process.env.BASE_URL}/jobdetailsmore/${jobId}`, "", "", moment(appliedData?.createdAt).utcOffset('+05:30').format('DD MMM YYYY hh:mm')]
	  
  		  await updateSpreadSheetValues(sheetData)
	  
  		  if (!apply) {
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
	}
	catch(err){
		return res.send({status:false, err: err})
	}
})

commonRoutes.post("/applycourse/:id",async(req,res)=>{
	try{
			let {id} = req.params;
			let courseId = id;
			
			let validation = { mobile: req.body.mobile }
			
			let { value, error } = await CandidateValidators.userMobile(validation)
			if (error) {
			  return res.send({ status: "failure", error: "Something went wrong!", error });
			}
			let candidateMobile = value.mobile;
			
			let course = await Courses.findOne({_id: courseId});
			
			if (!course) {
			  return res.send({ status: false, msg: "Course not Found!" });
			}
			
			let candidate = await Candidate.findOne({ mobile: candidateMobile }).populate([{
			  path: 'state',
			  select: "name"
			}, {
			  path: 'city',
			  select: "name"
			}]).lean();
			
			if (!candidate) {
			  return res.send({ status: false, msg: "Candidate not found!" });
			}
			
			if (candidate.appliedCourses && candidate.appliedCourses.includes(courseId)) {
			  req.flash("error", "Already Applied");
			  return res.send({ status: false, msg: "Already Applied" });
			} else {			
			  let apply = await Candidate.findOneAndUpdate({ mobile: candidateMobile },
				{ $addToSet: { appliedCourses: courseId } },
				{ new: true, upsert: true });
			 const appliedData = await AppliedCourses({
				_candidate: candidate._id,
				_course: courseId
			  }).save();

			  let sheetData = [candidate?.name, candidate?.mobile,candidate?.email, candidate?.sex, candidate?.dob ? moment(candidate?.dob).format('DD MMM YYYY'): '', candidate?.state?.name, candidate.city?.name, 'Course', `${process.env.BASE_URL}/coursedetails/${courseId}`, course?.registrationCharges, appliedData?.registrationFee, moment(appliedData?.createdAt).utcOffset('+05:30').format('DD MMM YYYY hh:mm')]
		  
				await updateSpreadSheetValues(sheetData)
		  
			  if (!apply) {
				req.flash("error", "Already failed");
				return res.status(400).send({ status: false, msg: "Applied Failed!" });
			  }
			}
		
			res.status(200).send({ status: true, msg: "Success" });
  	}
  	catch(err){
		console.log(err)
		  return res.send({status:false,err})
  	}
})

commonRoutes.post("/updateprofile",async(req,res)=>{
	try{
		let validation = { mobile: req.body.mobile }
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
		  { $match: { candidateId: ObjectId(user._id) } },
		  { $group: { _id: "", totalAmount: { $sum: "$amount" } } },
		]);
		let isVideoCompleted = ''
		if (personalInfo.profilevideo !== '') {
		  isVideoCompleted = personalInfo.profilevideo
		}
		const isProfileCompleted = candidateUpdate.isProfileCompleted
		res.send({ status: true, message: "Profile Updated Successfully", isVideoCompleted: isVideoCompleted, isProfileCompleted: isProfileCompleted, totalCashback });
	}
	catch(err){
		console.log(err)
		return res.send({status:false,err})
	}
})

/* List of applied course */
commonRoutes.post("/appliedCourses", async (req, res) => {
	try{
		let validation = { mobile: req.body.mobile }
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
		  }).populate({path:'_course', populate: {path:'sectors'}});
	  
		  count = await Courses.countDocuments({
			_id: {
			  $in: candidate.appliedCourses
			},
			isDeleted: false,
			status: true
		  });

		}
		
		res.send({ status: true, message: "List of applied courses", courses: courses, count: count });
	}
	catch(err){
		return res.send({status:false,err})
	}	
  });

  /* List of applied jobs */
  commonRoutes.post("/appliedJobs", async (req, res) => {
	try{
		let validation = { mobile: req.body.mobile }
		let { value, error } = await CandidateValidators.userMobile(validation)
		if (error) {
		  console.log(error)
		  return res.send({ status: "failure", error: "Something went wrong!", error });
		}
		let candidate = await Candidate.findOne({
		  mobile: value.mobile,
		  isDeleted: false, status: true
		})
		
		const appliedJobs = await AppliedJobs.find({
			_candidate: candidate._id
		  })
		
		res.send({ status: true, message: "List of applied jobs", jobs: appliedJobs, count: appliedJobs.length });
	}
	catch(err){
		return res.send({status:false,err})
	}
  });
commonRoutes.post("/payment",  async (req, res) => {
  let { offerId, amount } = req.body;
  console.log(offerId, "candidate's offerId for the coins")

  if (!offerId || !amount) {
	return res.status(400).send({ status: false, msg: 'Incorrect Data.' })
  }

  let validation = { mobile: req.body.mobile }
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

commonRoutes.post("/coursepayment", async (req, res) => {
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

commonRoutes.post("/paymentStatus", async (req, res) => {
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

commonRoutes.post("/coursepaymentStatus",  async (req, res) => {
  let { paymentId, orderId, amount, courseId, _candidate } = req.body;
  console.log(courseId,_candidate, '<<<<<<<< courseId in the payment status')
  let courseDetails = await AppliedCourses.findOne({ _candidate, _course: courseId});
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

commonRoutes.get("/Coins",  async (req, res) => {
  let validation = { mobile: req.body.mobile }
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

commonRoutes.get("/getCreditCount",  async (req, res) => {
  try {
	let validation = { mobile: req.body.mobile }
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



chatRoutes.use("/", commonRoutes);

module.exports =chatRoutes;
