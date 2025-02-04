const express = require("express");
const router = express.Router();
const { isAdmin } = require("../../../helpers");
// const mongoose = require('mongoose');
const Team = require('../../models/team'); // PostSchema import करें
const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid/v1');
const path = require('path');

// Middleware to ensure the user is an admin
// router.use(isAdmin);



const {
  accessKeyId,
  secretAccessKey,
  region,
  bucketName,
  mimetypes,
} = require('../../../config');



AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});


const s3 = new AWS.S3({ region, signatureVersion: 'v4' });
const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

const destination = path.resolve(__dirname, '..', '..', '..', 'public', 'temp');
if (!fs.existsSync(destination)) fs.mkdirSync(destination);

const storage = multer.diskStorage({
  destination,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage }).single("file"); // "file" नाम सही होना चाहिए

// Senior Manager page route
router.get("/add", async (req, res) => {
  try {
    // Fetch any required data here if needed
    const data = []; // Replace with actual data
    return res.render(`${req.vPath}/admin/team/add`, { data, menu: 'addTeam', });
    // return res.render(`${req.vPath}/admin/team/junior`, { data });
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
});

router.post("/add", async (req, res) => {
  
    try {
      const { name, mimetype: ContentType } = req.files.file;

      if (Array.isArray(req.files.file)) {
        return res.send({
          status: false,
          messege: "Only 1 image is allowed"
        });
      }
      const ext = name.split(".").pop();
      const key = `team/${uuid()}.${ext}`;
      const data = req.files.file.data;


      const params = {
        Bucket: bucketName,
        Body: data,
        Key: key,
        ContentType
      };
      // **Upload to S3**
      const uploadResult = await s3.upload(params).promise();

      const memberName = req.body.name;
      const position = req.body.position;
      const designation = req.body.designation;
      const description = req.body.description;



      const newTeam = new Team({
        name: memberName,
        image: {
          fileURL: uploadResult.Location,

        },
        position,
        designation,
        description,
      });

      const savedTeam = await newTeam.save();

      return res.send({
        status: true,
        message: "Team member uploaded successfully",
        data: savedTeam,
      });



    } catch (err) {
      return req.errFunc(err);



    }

  });
  router.get("/view", async (req, res) => {
    try {
      const teamMembers = await Team.find().sort({  createdAt: -1 })
    console.log(teamMembers);
      
      return res.render(`${req.vPath}/admin/team/teamMember`, { teamMembers, menu: 'team', });
      // return res.render(`${req.vPath}/admin/team/junior`, { data });
    } catch (err) {
      req.flash("error", err.message || "Something went wrong!");
      return res.redirect("back");
    }
  });


  router.patch("/teamsequence", async (req, res) => {
    const { id, val } = req.body
    const update = await Team.findByIdAndUpdate({ _id: id }, { sequence: +(val) })
    res.send({ status: true, sequence: val })
    console.log(update, "updateSequence")
  })
  router.patch("/changeStatus" , async (req, res) => {
    try {
      const updata = { $set: { status: req.body.status } };
  
      const data = await Team.findByIdAndUpdate(req.body.id, updata);
  
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
module.exports = router;