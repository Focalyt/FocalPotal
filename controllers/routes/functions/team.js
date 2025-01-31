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
 
};