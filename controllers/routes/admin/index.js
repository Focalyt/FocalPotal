const express = require('express');
const {
  College,
  Qualification,
  CollegeRepresentative,
  Country,
  University,
  User,
  State,
  City,
  Company,
  PaymentDetails,
  Candidate,
  HiringStatus,
  Vacancy,
  AppliedJobs,
  AppliedCourses

} = require('../../models');
const moment = require('moment')

const appBannerRoutes = require('./appBanner');
const appUpdateRoutes = require('./appUpdate');
const careerObjectiveRoutes = require('./careerObjective');
const candidateRoutes = require('./candidate');
const collegeRoutes = require('./college');
const companyRoutes = require('./company');
const coverLetterRoutes = require('./coverLetter');
const jobCategoryRoutes = require('./jobCategory');
const jobSubCategoryRoutes = require('./jobSubCategory');
const qualificationRoutes = require('./qualification');
const mockInterviewRoutes = require('./mockInterview');
const industryRoutes = require('./industry');
const skillRoutes = require('./skill');
const skillTestRoutes = require('./skillTest');
const subIndustryRoutes = require('./subIndustry');
const subQualificationRoutes = require('./subQualification');
const testCategoryRoutes = require('./testCategory');
const vacancyRoutes = require('./vacancy');
const vacancyTypeRoutes = require('./vacancyType');
const universityRoutes = require('./university');
const stateRoutes = require('./states');
const cityRoutes = require('./city');
const { isAdmin } = require('../../../helpers');
const miPieCoinsRoutes = require('./miPieCoins')
const paymentRoutes = require('./payments')
const smsRoutes = require('./smsUsage')
const courseRoutes=require('./courses')
const postRoutes=require('./post')
const freelancerRoutes=require('./freelancer')
const rolesRoutes = require('./adminRoles')
const coinsRoutes = require('./coinsAlgo')
const reportRoutes = require('./report')
const razorpayPaymentsRoutes = require('./razorpayPayments');
const chatBotFaqRoutes = require("./chatBotFaqs");
const cashBackRoutes=require('./cbLogic');
const jobListings=require('./joblisting')
const vouchers=require('./vouchers')
const videosData=require('./videos')
const contactRoutes=require('./contacts')
const loanRoutes = require('./loanEnquiry');
const courseSectorsRoutes = require('./courseSectors');
const teamRoutes=require('./team')


const router = express.Router();
router.use('/appBanner', appBannerRoutes);
router.use('/post', postRoutes);
router.use('/freelancer', freelancerRoutes);
router.use('/appUpdate', appUpdateRoutes);
router.use('/careerObjective', careerObjectiveRoutes);
router.use('/candidate', candidateRoutes);
router.use('/college', collegeRoutes);
router.use('/company', companyRoutes);
router.use('/coverLetter', coverLetterRoutes);
router.use('/jobCategory', jobCategoryRoutes);
router.use('/jobSubCategory', jobSubCategoryRoutes);
router.use('/qualification', qualificationRoutes);
router.use('/mockInterview', mockInterviewRoutes);
router.use('/industry', industryRoutes);
router.use('/skill', skillRoutes);
router.use('/skillTest', skillTestRoutes);
router.use('/subIndustry', subIndustryRoutes);
router.use('/subQualification', subQualificationRoutes);
router.use('/testCategory', testCategoryRoutes);
router.use('/vacancy', vacancyRoutes);
router.use('/vacancyType', vacancyTypeRoutes);
router.use('/university', universityRoutes);
router.use('/states', stateRoutes);
router.use('/cities', cityRoutes);
router.use('/courses',courseRoutes)
router.use('/Coins', miPieCoinsRoutes)
router.use('/payments',paymentRoutes)
router.use('/smsUsage',smsRoutes)
router.use('/roles', rolesRoutes)
router.use('/coinsAlgo',coinsRoutes)
router.use('/report', reportRoutes)
router.use('/razorpayPayments', razorpayPaymentsRoutes)
router.use('/chatBotFAQ', chatBotFaqRoutes)
router.use('/cashback',cashBackRoutes)
router.use('/joblisting',jobListings)
router.use("/Vouchers",vouchers)
router.use('/uploadedVideos',videosData)
router.use("/contact",contactRoutes)
router.use("/loanEnquiry",loanRoutes);
router.use('/courseSectors', courseSectorsRoutes);
router.use('/team', teamRoutes);
router.use(isAdmin);
router.post ('/courses',async(req,res)=>{
  
})
router.get('/', async (req, res) => {
  try {
    const totalRevenue = await PaymentDetails.aggregate([
      {$match: { paymentStatus: 'captured',
               }},
      {$group: { _id: '',
                 totalRevenue: {
                 $sum: '$amount'
                }}}
    ])
     const monthRevenue = await PaymentDetails.aggregate([
       {$match: { paymentStatus: 'captured',
                  createdAt: {$gte : moment().utcOffset('+05:30').startOf('month').toDate(),
                   $lte : moment().utcOffset('+05:30').endOf('month').toDate()}
                }},
       {$group: { _id: '',
                  monthRevenue: {
                  $sum: '$amount'
                 }}}
     ])
     const weekRevenue = await PaymentDetails.aggregate([
      {$match: { paymentStatus: 'captured',
                 createdAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
                  $lte : moment().utcOffset('+05:30').endOf('week').toDate()}
               }},
      {$group: { _id: '',
                 weekRevenue: {
                 $sum: '$amount'
                }}}
    ])
     const dayRevenue = await PaymentDetails.aggregate([
       {$match: { paymentStatus: 'captured',
                  createdAt: {$gte : moment().utcOffset('+05:30').startOf('day').toDate(),
                   $lte : moment().utcOffset('+05:30').endOf('day').toDate()}
                }},
       {$group: { _id: '',
                  dayRevenue: {
                  $sum: '$amount'
                 }}}
     ])
     const yesterdayRevenue= await PaymentDetails.aggregate([
      {$match: { paymentStatus: 'captured',
                 createdAt: {$gte : moment().subtract(1,'day').utcOffset('+05:30').startOf('day').toDate(),
                  $lte : moment().subtract(1,'day').utcOffset('+05:30').endOf('day').toDate()}
               }},
      {$group: { _id: '',
                 yesterdayRevenue: {
                 $sum: '$amount'
                }}}
    ])
    const dayBeforeYesterdayRevenue=await PaymentDetails.aggregate([
      {$match: { paymentStatus: 'captured',
                 createdAt: {$gte : moment().subtract(2,'day').utcOffset('+05:30').startOf('day').toDate(),
                  $lte : moment().subtract(2,'day').utcOffset('+05:30').endOf('day').toDate()}
               }},
      {$group: { _id: '',
                 dayBeforeYesterdayRevenue: {
                 $sum: '$amount'
                }}}
    ])
     //Candidate 
    const totalCandidates = await Candidate.find({status:true}).countDocuments()
    const monthCandidates = await Candidate.find({
      status: true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('month').toDate(),
       $lte : moment().utcOffset('+05:30').endOf('month').toDate()}}
      ).countDocuments()
    const weekCandidates = await Candidate.find({
        status: true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('week').toDate()}}
        ).countDocuments()
    const dayCandidates = await Candidate.find({
      status: true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('day').toDate(),
       $lte : moment().utcOffset('+05:30').endOf('day').toDate()}}
      ).countDocuments()
    const yesterdayCandidates=await Candidate.find({
      status:true,createdAt:{$gte:moment().subtract(1,'day').utcOffset('+05:30').startOf('day').toDate(),
      $lte : moment().subtract(1,'day').utcOffset('+05:30').endOf('day').toDate()
    }}).countDocuments();
    const dayBeforeYesterdayCandidates=await Candidate.find({
      status:true,createdAt:{$gte:moment().subtract(2,'day').utcOffset('+05:30').startOf('day').toDate(),
      $lte : moment().subtract(2,'day').utcOffset('+05:30').endOf('day').toDate()
    }}).countDocuments();
    
    //Hired
    const totalHired = await HiringStatus.find({status :{'$eq':'hired'}, isDeleted: false}).countDocuments()

    const monthHired = await HiringStatus.find({
      status :{'$eq':'hired'},updatedAt: {$gte : moment().utcOffset('+05:30').startOf('month').toDate(),
       $lte : moment().utcOffset('+05:30').endOf('month').toDate()}, isDeleted: false}).countDocuments()
    const weekHired = await HiringStatus.find({
      status :{'$eq':'hired'},updatedAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
       $lte : moment().utcOffset('+05:30').endOf('week').toDate()}, isDeleted: false}).countDocuments()
    const dayHired = await HiringStatus.find({
      status :{'$eq':'hired'},updatedAt: {$gte : moment().utcOffset('+05:30').startOf('day').toDate(),
       $lte : moment().utcOffset('+05:30').endOf('day').toDate()}, isDeleted: false}).countDocuments()
    const yesterdayHired=await HiringStatus.find({
      status :{'$eq':'hired'},updatedAt: {$gte : moment().subtract(1,'day').utcOffset('+05:30').startOf('day').toDate(),
       $lte : moment().subtract(1,'day').utcOffset('+05:30').endOf('day').toDate()}, isDeleted: false}).countDocuments()
    const dayBeforeYesterdayHired=await HiringStatus.find({
      status :{'$eq':'hired'},updatedAt: {$gte : moment().subtract(2,'day').utcOffset('+05:30').startOf('day').toDate(),
       $lte : moment().subtract(2,'day').utcOffset('+05:30').endOf('day').toDate()}, isDeleted: false}).countDocuments()
       //Shortlisted
      const totalShortlisted = await HiringStatus.aggregate([
        {$match: { status :{'$ne':'rejected'}, isDeleted: false}},
        {$lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company'
        }},
        {$match: { 'company.0.status': true, 'company.0.isDeleted': false }}
      ])
      const monthShortlisted = await HiringStatus.aggregate([
        {$match: { status :{'$ne':'rejected'}, createdAt: {$gte : moment().utcOffset('+05:30').startOf('month').toDate(),
        $lte : moment().utcOffset('+05:30').endOf('month').toDate()}, isDeleted: false}},
        {$lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company'
        }},
        {$match: { 'company.0.status': true, 'company.0.isDeleted': false }}
      ])
      const weekShortlisted = await HiringStatus.aggregate([
        {$match: { status :{'$ne':'rejected'}, createdAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
        $lte : moment().utcOffset('+05:30').endOf('week').toDate()}, isDeleted: false}},
        {$lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company'
        }},
        {$match: { 'company.0.status': true, 'company.0.isDeleted': false }}
      ])
      const dayShortlisted = await HiringStatus.aggregate([
        {$match: { status :{'$ne':'rejected'}, createdAt: {$gte : moment().utcOffset('+05:30').startOf('day').toDate(),
        $lte : moment().utcOffset('+05:30').endOf('day').toDate()}, isDeleted: false}},
        {$lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company'
        }},
        {$match: { 'company.0.status': true, 'company.0.isDeleted': false }}
      ])  
      const yesterdayShortlisted=await HiringStatus.aggregate([
        {$match: { status :{'$ne':'rejected'}, createdAt: {$gte : moment().subtract(1,'day').utcOffset('+05:30').startOf('day').toDate(),
        $lte : moment().subtract(1,'day').utcOffset('+05:30').endOf('day').toDate()}, isDeleted: false}},
        {$lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company'
        }},
        {$match: { 'company.0.status': true, 'company.0.isDeleted': false }}
      ])  
      const dayBeforeYesterdayShortlisted=await HiringStatus.aggregate([
        {$match: { status :{'$ne':'rejected'}, createdAt: {$gte : moment().subtract(2,'day').utcOffset('+05:30').startOf('day').toDate(),
        $lte : moment().subtract(2,'day').utcOffset('+05:30').endOf('day').toDate()}, isDeleted: false}},
        {$lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'company'
        }},
        {$match: { 'company.0.status': true, 'company.0.isDeleted': false }}
      ])  
      //Companies
    const totalCompanies = await Company.find({status:true}).countDocuments()
    const monthCompanies = await Company.find({
      status: true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('month').toDate(),
       $lte : moment().utcOffset('+05:30').endOf('month').toDate()}}
      ).countDocuments()
    const weekCompanies = await Company.find({
        status: true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('week').toDate()}}
        ).countDocuments()
    const dayCompanies = await Company.find({
      status: true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('day').toDate(),
       $lte : moment().utcOffset('+05:30').endOf('day').toDate()}}
      ).countDocuments()
      const yesterdayCompanies=await Company.find({
        status: true, createdAt: {$gte : moment().subtract(1,'day').utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().subtract(1,'day').utcOffset('+05:30').endOf('day').toDate()}}
        ).countDocuments();
        const dayBeforeYesterdayCompanies=await Company.find({
          status: true, createdAt: {$gte : moment().subtract(2,'day').utcOffset('+05:30').startOf('day').toDate(),
           $lte : moment().subtract(2,'day').utcOffset('+05:30').endOf('day').toDate()}}
          ).countDocuments()
      const dayJobs = await Vacancy.find({
        status:true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('day').toDate()}})
        .countDocuments()
      const weekJobs = await  Vacancy.find({
        status:true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('week').toDate()}})
        .countDocuments()
      const monthJobs = await  Vacancy.find({
        status:true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('month').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('month').toDate()}})
        .countDocuments()
      const jobs = await  Vacancy.find({status:true}).countDocuments()
      const yesterdayJobs= await Vacancy.find({
        status:true, createdAt: {$gte : moment().subtract(1,'day').utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().subtract(1,'day').utcOffset('+05:30').endOf('day').toDate()}})
        .countDocuments()
      const dayBeforeYesterdayJobs= await Vacancy.find({
        status:true, createdAt: {$gte : moment().subtract(2,'day').utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().subtract(2,'day').utcOffset('+05:30').endOf('day').toDate()}})
        .countDocuments()

      //College
    const totalColleges = await College.find({status:true}).countDocuments()
    const monthColleges = await College.find({
      status: true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('month').toDate(),
       $lte : moment().utcOffset('+05:30').endOf('month').toDate()}}
      ).countDocuments()
    const weekColleges = await College.find({
     status: true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
      $lte : moment().utcOffset('+05:30').endOf('week').toDate()}}
        ).countDocuments()
    const dayColleges = await College.find({
      status: true, createdAt: {$gte : moment().utcOffset('+05:30').startOf('day').toDate(),
       $lte : moment().utcOffset('+05:30').endOf('day').toDate()}}
      ).countDocuments()
    const yesterdayColleges=await College.find({
      status: true, createdAt: {$gte : moment().subtract(1,'day').utcOffset('+05:30').startOf('day').toDate(),
       $lte : moment().subtract(1,'day').utcOffset('+05:30').endOf('day').toDate()}}
      ).countDocuments();
    const dayBeforeYesterdayColleges=await College.find({
      status: true, createdAt: {$gte : moment().subtract(2,'day').utcOffset('+05:30').startOf('day').toDate(),
       $lte : moment().subtract(2,'day').utcOffset('+05:30').endOf('day').toDate()}}
      ).countDocuments()

      //applied jobs
      const totalAppliedJobs = await AppliedJobs.find({}).countDocuments()
      const monthAppliedJobs = await AppliedJobs.find({
        createdAt: {$gte : moment().utcOffset('+05:30').startOf('month').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('month').toDate()}
      }).countDocuments()
      const weekAppliedJobs = await AppliedJobs.find({
        createdAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('week').toDate()}
      }).countDocuments()
      const dayAppliedJobs = await AppliedJobs.find({
        createdAt: {$gte : moment().utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('day').toDate()}
      }).countDocuments()
      const yesterdayAppliedJobs=await AppliedJobs.find({
        createdAt: {$gte : moment().subtract(1,'day').utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().subtract(1,'day').utcOffset('+05:30').endOf('day').toDate()}
      }).countDocuments()
      const dayBeforeYesterdayAppliedJobs=await AppliedJobs.find({
        createdAt: {$gte : moment().subtract(2,'day').utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().subtract(2,'day').utcOffset('+05:30').endOf('day').toDate()}
      }).countDocuments()

      //applied Courses
      const totalAppliedCourses = await AppliedCourses.find({}).countDocuments()
      const monthAppliedCourses = await AppliedCourses.find({
        createdAt: {$gte : moment().utcOffset('+05:30').startOf('month').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('month').toDate()}
      }).countDocuments()
      const weekAppliedCourses = await AppliedCourses.find({
        createdAt: {$gte : moment().utcOffset('+05:30').startOf('week').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('week').toDate()}
      }).countDocuments()
      const dayAppliedCourses = await AppliedCourses.find({
        createdAt: {$gte : moment().utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().utcOffset('+05:30').endOf('day').toDate()}
      }).countDocuments()
      const yesterdayAppliedCourses=await AppliedCourses.find({
        createdAt: {$gte : moment().subtract(1,'day').utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().subtract(1,'day').utcOffset('+05:30').endOf('day').toDate()}
      }).countDocuments()
      const dayBeforeYesterdayAppliedCourses=await AppliedCourses.find({
        createdAt: {$gte : moment().subtract(2,'day').utcOffset('+05:30').startOf('day').toDate(),
         $lte : moment().subtract(2,'day').utcOffset('+05:30').endOf('day').toDate()}
      }).countDocuments()

    return res.render(`${req.vPath}/admin`,{
      totalRevenue: totalRevenue[0]?.totalRevenue,
      monthRevenue: monthRevenue[0]?.monthRevenue,
      weekRevenue: weekRevenue[0]?.weekRevenue,
      dayRevenue: dayRevenue[0]?.dayRevenue,
      yesterdayRevenue:yesterdayRevenue[0]?.yesterdayRevenue,
      dayBeforeYesterdayRevenue:dayBeforeYesterdayRevenue[0]?.dayBeforeYesterdayRevenue,
      monthCandidates,weekCandidates,
      monthCompanies,weekCompanies,
      monthColleges,weekColleges,
      yesterdayColleges,yesterdayCompanies,yesterdayJobs,yesterdayHired,yesterdayShortlisted,yesterdayAppliedJobs,dayBeforeYesterdayAppliedJobs,dayBeforeYesterdayCompanies,dayBeforeYesterdayColleges,dayBeforeYesterdayHired,dayBeforeYesterdayJobs,dayBeforeYesterdayShortlisted,
      dayShortlisted: dayShortlisted.length,weekShortlisted: weekShortlisted.length,
      monthShortlisted: monthShortlisted.length,totalShortlisted: totalShortlisted.length,
      totalCandidates, dayCandidates, totalCompanies, dayCompanies, dayColleges, totalColleges,menu:'dashboard',
      dayJobs,weekJobs,monthJobs,jobs,dayHired,weekHired,monthHired,totalHired,
      totalAppliedJobs, monthAppliedJobs, weekAppliedJobs, dayAppliedJobs,dayBeforeYesterdayCandidates,yesterdayCandidates,totalAppliedCourses,monthAppliedCourses,weekAppliedCourses,dayAppliedCourses,yesterdayAppliedCourses,dayBeforeYesterdayAppliedCourses
    });
  } catch (err) {
    req.session.formData = req.body;
    req.flash('error', err.message || 'Something went wrong!');
    return res.redirect('back');
  }
});


router.get('/backfill/duplicateCandidates', async(req, res) => {
  try{
    const duplicate = await Candidate.aggregate([
      {'$group': {
        _id: '$mobile',
        count: {
          $sum: 1
        }
      }},
       {'$match': {
        count: {$gt: 1}
      }
      }
    ])
    for(let candidate of duplicate){
      let arr = await Candidate.find({mobile: candidate._id}).sort({createdAt: -1}).select('status isDeleted')
      for(let i=0; i<arr.length-1; i++){
        let del = await Candidate.deleteMany({_id: arr[i]._id})
        console.log(del, "<<<<<<<<<<<<<<<<<<<<<<<<deleted")
      }
    }
    res.send({count: duplicate.length, data: duplicate})
  }
  catch(err){
    res.send(err.message)
  }
})

router.get('/backfill/appliedJobs', async (req, res) => {
   let candidates = await Candidate.find({'appliedJobs.0': {$exists: true}})
   for(let candidate of candidates){
     for(let j of candidate.appliedJobs){
      let job = await Vacancy.findOne({_id: j})
      if(job){
        let data = {}
        data['_job'] = j
        data['_candidate'] = candidate._id
        data['_company'] = job._company
        console.log(data, "data======")
        let newData = await AppliedJobs.create(data)
        console.log(newData, "<<<<<<<<<=================created")
      }
     }
   }
  res.status(200).send({data: candidates[0]})
})

module.exports = router;
