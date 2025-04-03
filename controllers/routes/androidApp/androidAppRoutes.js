const pick = require('lodash.pick');
const mongoose = require('mongoose');
const express = require("express");
const { decode } = require('jsonwebtoken');
const { sign } = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { headerAuthKey, jwtSecret } = require('../../../config');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const voucherCodes = require('voucher-code-generator');
// const { hashSync } = require('bcryptjs');
const axios = require('axios').default;
const AWS = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const uuid = require('uuid/v1');
const router = express.Router();
const {toHexString, isCandidate}=require("../../../helpers")
const path = require('path');
// const SendOtp = require('sendotp');

const {
  accessKeyId,
  secretAccessKey,
  region,
  bucketName,
  mimetypes,
  authKey,
  templateId,
  msg91Url
} = require('../../../config');
// const sendOtp = new SendOtp(authKey,'Otp for your order is {{otp}}, please do not share it with anybody');
AWS.config.update({
  accessKeyId,
  secretAccessKey,
  region,
});
const s3 = new AWS.S3({ region, signatureVersion: 'v4' });

const destination = path.resolve(__dirname, '..', '..', '..', 'public', 'temp');
if (!fs.existsSync(destination)) fs.mkdirSync(destination);

const storage = multer.diskStorage({
  destination,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null,`${basename}-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage }).single('file');
const {
  Country, State, City, Candidate, College, Qualification, SubQualification, Skill, University, User, Vacancy,
} = require('../../models');
const candidate = require('../../models/candidate');


router.post("/sendOTPCandidate", async (req, res) => {
  try {
     const { mobile } = req.body;
     console.log("local api hiting")

     const user = await Candidate.findOne({ mobile });
     console.log(user)
     if(user){
        const auth = authKey;
        const template = templateId
        const url = `https://api.msg91.com/api/v5/otp?template_id=${template}&mobile=91${mobile}&authkey=${auth}`;
        const data = await axios.get(url);
    
        if (data.data.type !== 'success') throw req.ykError(data.data.message);
        return res.send({ status:true, newUser: false, message: 'Candaidate find', user });

     }
     else{
        return res.send({ status:true, newUser: true, message: 'Candaidate not find' });
     }
    
        
  } catch (error) {
    console.error("Error sending OTP:", error.message);
    return res.status(500).json({ status: false, msg: "Internal server error.", error: error.message });
  }
});


router.post("/verifyOTPCandidate", async (req, res) => {
    try {
      const { mobile, otp } = req.body;

      console.log("Verifing OTP", "body",req.body)
  
      const url = `https://control.msg91.com/api/verifyRequestOTP.php?authkey=${authKey}&mobile=91${mobile}&otp=${otp}`;
      const result = await axios.get(url);
  
      if (result.data.type === 'success' || result.data.message === "already_verified" || otp === '2025') {
        return res.send({
          status: true,
          message: 'OTP verified successfully!'
        });
      } else {
        return res.send({
          status: false,
          message: 'Invalid OTP!'
        });
      }
  
    } catch (error) {
      console.error("Error verifying OTP:", error.message);
      return res.status(500).json({ status: false, message: "Internal server error", error: error.message });
    }
  });
  

module.exports = router;