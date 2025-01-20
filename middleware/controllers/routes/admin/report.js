const express = require("express");
const { Qualification, HiringStatus, AppliedJobs } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
const moment = require("moment");
const { parseAsync } = require("json2csv");
const fs = require("fs");
let path = require("path");
const baseURL = process.env.BASE_URL

router.use(isAdmin);

router.route("/").get(async (req, res) => {
  try {
    let date = new Date();
    let presentMonth = date.getMonth() + 1;
    let presentYear = date.getFullYear();
    return res.render(`${req.vPath}/admin/report`, {
      menu: "report",
      presentMonth,
      presentYear,
    });
  } catch (err) {
    console.log(err.message);
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});

router.get("/hiringStatus", async (req, res) => {
  let { month, year, status } = req.query;
  let startDate = moment([year, month - 1]);
  let filter = {
    createdAt: {
      $gte: moment(startDate).startOf("month"),
      $lte: moment(startDate).endOf("month"),
    },
    isDeleted: false,
  };
  if (status) {
    filter["status"] = { $regex: status, $options: "i" };
  }
  let populate = [
    {
      path: "candidate",
      select: "name highestQualification mobile",
    },
    { path: "company", select: "name" },
    {
      path: "job",
      select: "title",
    },
  ];
  let shortlistedCandidates = await HiringStatus.find(filter)
    .populate(populate)
    .select(
      "status candidate job company highestQualification createdAt updatedAt"
    );

  const fields = [
    "Candidate Name",
    "Mobile No",
    "Highest Qualification",
    "Hiring Status",
    "Company Name",
    "JD Title",
    "Date",
  ];
  let data = [];
  let qual;
  let qualification

  for (let ele of shortlistedCandidates) {
    qual = ''
    if (ele.candidate.highestQualification) {
      qual = await Qualification.findOne({
        _id: ele.candidate.highestQualification,
      });
    }
    qualification = qual ? qual?.name : qual
    data.push({
      "Candidate Name": ele.candidate?.name,
      "Mobile No": ele.candidate?.mobile,
      "Highest Qualification": qualification,
      "Hiring Status": ele.status,
      "Company Name": ele.company?.name,
      "JD Title": ele.job?.title,
      Date: moment(ele.createdAt).utcOffset("+05:30").format("DD MMM YYYY"),
    });
  }

  parseAsync(data, { fields })
    .then((csv) =>
      fs.writeFile("public/hiringStatus.csv", csv, (err) => {
        if (err) {
          console.log(err);
          return res.send({ sucess: false, err });
        }
        return res.send({
          sucess: true,
          path: `${baseURL}/hiringStatus.csv`,
        });
      })
    )

    .catch((err) => {
      return res.send({ sucess: false, err });
    });
});

router.get("/appliedCandidates", async (req, res) => {
  let { month, year, status } = req.query;
  let startDate = moment([year, month - 1]);
  let filter = {
    createdAt: {
      $gte: moment(startDate).startOf("month"),
      $lte: moment(startDate).endOf("month"),
    },
  };
  let populate = [
    {
      path: "_candidate",
      select: "name highestQualification mobile",
    },
    { path: "_company", select: "name" },
    {
      path: "_job",
      select: "title",
    },
  ];
  let appliedCandidates = await AppliedJobs.find(filter)
    .populate(populate)
    .select(
      "_candidate _job _company highestQualification createdAt updatedAt"
    );

  const fields = [
    "Candidate Name",
    "Mobile No",
    "Highest Qualification",
    "Company Name",
    "JD Title",
    "Applied On",
  ];
  let data = [];
  let qual;
  let qualification

  for (let ele of appliedCandidates) {
    qual = ''
    if (ele._candidate.highestQualification) {
      qual = await Qualification.findOne({
        _id: ele._candidate.highestQualification,
      });
    }
    qualification = qual ? qual?.name : qual
    data.push({
      "Candidate Name": ele._candidate?.name,
      "Mobile No": ele._candidate?.mobile,
      "Highest Qualification": qualification,
      "Company Name": ele._company?.name,
      "JD Title": ele._job?.title,
      "Applied On": moment(ele.createdAt).utcOffset("+05:30").format("DD MMM YYYY"),
    });
  }

  parseAsync(data, { fields })
    .then((csv) =>
      fs.writeFile("public/documents/appliedCandidates.csv", csv, (err) => {
        if (err) {
          console.log(err);
          return res.send({ sucess: false, err });
        }
        res.set('Content-Type', 'text/csv');
        return res.sendFile(path.join(__dirname, '../../../public/documents/appliedCandidates.csv'))
      })
    )
    .catch((err) => {
      return res.send({ sucess: false, err });
    });
});

module.exports = router;
