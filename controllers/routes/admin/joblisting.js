const express = require("express");
const moment = require('moment')
const { Vacancy, Candidate, Qualification, Review, CoinsAlgo, Courses, CourseSectors } = require("../../models");
const { isAdmin } = require("../../../helpers");
const { ObjectId } = require("mongodb");
const mongoose = require('mongoose');
const router = express.Router();
router.use(isAdmin);
router.route("/").get(async (req, res) => {
  try {
    const data = req.query;
    const fields = {}
    if (data['title'] != '' && data.hasOwnProperty('title')) {
      fields["title"] = { "$regex": data.title, "$options": "i" }
    }
    if (data.FromDate && data.ToDate) {
      let fdate = moment(data.FromDate).utcOffset("+05:30").startOf('day').toDate()
      let tdate = moment(data.ToDate).utcOffset("+05:30").endOf('day').toDate()
      fields["createdAt"] = {
        $gte: fdate,
        $lte: tdate
      }
    }
    if (data['displayCompanyName'] != '' && data.hasOwnProperty('displayCompanyName')) {
      fields["displayCompanyName"] = { "$regex": data.displayCompanyName, "$options": "i" }
    }
    if (req.query.status == undefined) {
      var status = true;
      var isChecked = "false";
    } else if (req.query.status.toString() == "true") {
      var status = true;
      var isChecked = "false";
    } else if (req.query.status.toString() == "false") {
      var status = false;
      var isChecked = "true";
    }
    fields["status"] = status
    if (data.verified) {
      fields["verified"] = data.verified == 'true' ? true : false
    }
    if (data.isRecommended) {
      fields["isRecommended"] = data.isRecommended == 'true' ? true : false
    }
    const menu = "jobListings";
    const perPage = 20;
    const p = parseInt(req.query.page);
    const page = p || 1;
    const count = await Vacancy.find(fields).countDocuments()
    let agg = [
      { $match: fields },
      { $lookup: { from: 'companies', localField: '_company', foreignField: '_id', as: '_company' } },
      { $unwind: { path: '$_company' } },
      { $lookup: { from: 'appliedjobs', localField: '_id', foreignField: '_job', as: 'appliedjobs' } },
      { $addFields: { applications: { $size: '$appliedjobs' } } },
      { $lookup: { from: 'reviews', localField: '_id', foreignField: '_job', as: 'reviews' } },
      //   {
      //     $lookup: {
      //         from: 'courses', 
      //         localField: '_courses.sector',
      //         foreignField: '_id',
      //         as: 'courses'
      //     }
      // },
      {
        $project: {
          title: 1, experience: 1, _qualification: 1, createdAt: 1, status: 1, sequence: 1, displayCompanyName: 1, _company: { name: 1, _id: 1 }, applications: 1, verified: 1, isRecommended: 1, rating: { $round: [{ $avg: '$reviews.rating' }, 2] },
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: perPage * page - perPage },
      { $limit: perPage }
    ]
    let jd = await Vacancy.aggregate(agg)
    if (!jd) {
      return res.send({ status: false, message: "No job description yet" });
    }
    const totalPages = Math.ceil(count / perPage);
    res.render(`${req.vPath}/admin/jd-listing`, { menu, jd, totalPages, page, count, isChecked, data });
  }
  catch (err) {
    console.log(err)
    return res.status(500).send({ status: false, message: err })
  }
});
router.route("/:id")
  .get(async (req, res) => {
    try {
      const menu = "jobListings";
      let coinsAlgorithum = await CoinsAlgo.findOne({});
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
        {
          path: "_courses",
          select: "name courseLevel sectors",
          populate: [
            { path: "sectors", select: "name" },
            { path: "courseLevel", select: "courseLevel" },
            { path: "name", select: "name" }
          ]
        }

      ];
      const jd = await Vacancy.findById(req.params.id).populate(populate).lean();
      let coinsVal = jd.applyReduction > 0 ? jd.applyReduction : coinsAlgorithum.job
      let appliedCandidates = await Candidate.find({ isDeleted: false, status: true, appliedJobs: req.params.id })
        .populate({
          path: 'qualifications.Qualification',
          select: 'name'
        }).select('name highestQualification qualifications sex isExperienced totalExperience _id').exec()
      let qualifications = await Qualification.find({ status: true }).select('_id name')
      let reviews = await Review.aggregate([
        { $match: { '_job': new mongoose.Types.ObjectId(req.params.id) } },
        { $lookup: { from: 'candidates', localField: '_user', foreignField: '_id', as: 'candidate' } },
        { $unwind: '$candidate' },
        { $project: { candidate: { name: 1, _id: 1 }, rating: 1, comment: 1, createdAt: 1 } },
        {
          $facet: {
            reviews: [{ $sort: { createdAt: -1 } }],
            averageRating: [{ $group: { _id: null, average: { $avg: "$rating" } } }, { $project: { average: { $round: ["$average", 2] } } }]
          }
        }
      ]);
      const sector = await CourseSectors.find({ status: true });
      const courses = [];
      res.render(`${req.vPath}/admin/jd-listing/viewJob`, { menu, jd, courses, sector, appliedCandidates, qualifications, reviews: reviews[0]?.reviews || [], averageRating: reviews[0]?.averageRating[0]?.average || 0, coinsVal });
    } catch (err) {
      console.log(err);
      return res.status(500).send({ status: false, message: err })
    }
  })
  .put(async (req, res) => {
    try {
      let { id } = req.params
      let body = req.body
      console.log('body: ', body);
      let updatedData = {}
      let filter = {
        _id: new mongoose.Types.ObjectId(id)
      }
     /*  if (body.courseId && (body.isVerifie || body.isVerifie == false)) {
        filter["_courses._id"] = ObjectId(body.courseId);
        updatedData["_courses.$.isVerifie"] = body.isVerifie;
        delete body.courseId;
        delete body.isVerifie;
      } */
      if (body.courseId && (body.isRecommended || body.isRecommended == false)) {
        filter["_courses._id"] = new mongoose.Types.ObjectId(body.courseId);
        updatedData["_courses.$.isRecommended"] = body.isRecommended;
        delete body.courseId;
        delete body.isRecommended;
      }
      for (let key in body) {
        updatedData[key] = body[key];
      }
      let data = await Vacancy.updateMany(filter, { $set: updatedData });
      data = await Vacancy.findById(id)
      if (!data) {
        return res.status(500).send({
          status: false,
          message: "Unable to update Verification status",
        });
      }
      console.log(data, " put data api")
      return res.status(200).send({ status: true, msg: 'Verification status updated Successfully', data: data });
    } catch (err) {
      console.log(err);
      return res.status(500).send({ status: false, message: err })
    }
  })

router.route("/updatesequence").patch(async (req, res) => {
  const { jobId, val } = req.body
  const update = await Vacancy.findByIdAndUpdate({ _id: jobId }, { sequence: +(val) })
  res.send({ status: true, sequence: val })
  console.log(update, "updateSequence")
})
router.route("/changeStatus").patch(async (req, res) => {
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
router.route("/removeCourse/:id").put(async (req, res) => {
  try {
    const { courseId } = req.body

    const data = await Vacancy.findByIdAndUpdate(req.params.id, {
      $pull: { _courses: { _id: new mongoose.Types.ObjectId(courseId) } }
    }, { new: true });

    if (!data) {
      return res.status(500).send({
        status: false,
        message: "Can't update status of this job post",
      });
    }
    console.log(JSON.stringify(data), "ahaghaghagahga");
    return res.status(200).send({ status: true, data: data });
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.status(500).send({ status: false, message: err.message });
  }
});
module.exports = router