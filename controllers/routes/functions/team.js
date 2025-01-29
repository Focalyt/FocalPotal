const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid/v1');
const path = require('path');
// const mongoose = require('mongoose');
const Team = require('../../models/team'); // PostSchema import करें

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

module.exports.uploadTeamMember = async (req, res) => {
  try {
    const { name, mimetype: ContentType } = req.files.file;

    if (Array.isArray(req.files.file)) {
      return res.send({
            status:false,
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
};