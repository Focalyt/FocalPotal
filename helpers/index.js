const express = require("express");
const axios = require("axios");
const ObjectId = require("mongodb").ObjectID;
const {verify}=require('jsonwebtoken')
const {
  City,
  State,
  SubIndustry,
  SubQualification,
  Candidate,
  User,
  College,
  University,
  Qualification,
  Industry,
  Skill
} = require("../controllers/models");

const { msgApikey, authKey, msg91SmsUrl,jwtSecret, chat_service_api } = require("../config");
const qualification = require("../controllers/models/qualification");
const { default: mongoose } = require("mongoose");

const msg91Options = {
  method: "POST",
  hostname: "api.msg91.com",
  port: null,
  path: "/api/v2/sendsms",
  headers: {
    authkey: msgApikey,
    "content-type": "application/json",
  },
};

const router = express.Router({ mergeParams: true });

router.route("/getcity").post(async (req, res) => {
  try {
    const { stateId } = req.body
    const state = await State.findById(stateId)
    const cities = await City.find({ stateId: state.stateId });
    res.send(cities);
  } catch (err) {
    req.flash("error", "Something went wrong!");
  }
});

router.route("/getstate").post(async (req, res) => {
  try {
    const states = await State.find(req.body);
    res.send(states);
  } catch (err) {
    req.flash("error", "Something went wrong!");
  }
});

router.route("/getsubInd").post(async (req, res) => {
  try {
    const inds = await SubIndustry.find(req.body).select("name");
    res.send(inds);
  } catch (err) {
    req.flash("error", "Something went wrong!");
  }
});

router.route("/getsubQual").post(async (req, res) => {
  try {
    const inds = await SubQualification.find(req.body);
    res.send(inds);
  } catch (err) {
    req.flash("error", "Something went wrong!");
  }
});

module.exports = router;

module.exports.isAdmin = async (req, res, next) => {
  try {
    const error = req.ykError("You are not authorized",);

    const { user } = req.session;
    if (!user) {
      throw error;
    } else if (user.role != 0 && user.role != 10) {
      throw error;
    }
    return next();
  } catch (err) {
    const userAgent = req.get('User-Agent');
    const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
    console.log("--- ERROR Admin ", ipAddress, userAgent, err);
    req.flash("error", err.message);
    return res.redirect("/admin/login");
  }
};

module.exports.isCollege = async (req, res, next) => {
  try {
    const error = req.ykError("You are not authorized");
    const { user } = req.session;
    if (!user || user.role !== 2) throw error;
    return next();
  } catch (err) {
    const userAgent = req.get('User-Agent');
    const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
    console.log("--- ERROR College", ipAddress, userAgent, err);
    req.flash("error", err.message);
    return res.redirect("/college/login");
  }
};

module.exports.isCompany = async (req, res, next) => {
  try {
    const error = req.ykError("You are not authorized");
    const { user } = req.session;
    if (!user || user.role !== 1) throw error;
    req.companyUser = user._id;
    return next();
  } catch (err) {
    const userAgent = req.get('User-Agent');
    const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
    console.log("--- ERROR Company", ipAddress, userAgent, err);
    req.flash("error", err.message);
    return res.redirect("/company/login");
  }
};

module.exports.isCandidate = async (req, res, next) => {
  try {
    const error = req.ykError("You are not authorized");
    const { user } = req.session;
    if (!user || user.role !== 3) throw error;
    return next();
  } catch (err) {
    const userAgent = req.get('User-Agent');
    const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress;
    console.log("--- ERROR Candidate ", ipAddress, userAgent, err);
    req.flash("error", err.message);
    return res.redirect("/candidate/login");
  }
};



// module.exports.sendSms = async (data) => {
//   try {
//     const { authkey } = msg91Options.headers;
//     const headers = { authkey, "Content-Type": "application/json" };
//     const url = "http://api.msg91.com/api/v2/sendsms";
//     await axios.post(url, data, { headers });
//   } catch (err) {
//     throw err;
//   }
// };

module.exports.authenti = async (req, res, next) => {
  try {
    const token = req.header("x-auth");
    if (!token) throw req.ykError("Missing Token");
    const user = await User.findOne({ authTokens: token });
    if (!user) throw req.ykError("User not found in authenti");
    req.user = user;
    req.token = token;
    return next();
  } catch (err) {
    return req.errFunc(err);
  }
};
module.exports.authentiAdmin = async (req, res, next) => {
  try {
    const token = req.user.token
    if (!token) throw req.ykError("Missing Token");
    const {_id}=verify(token,jwtSecret)
    const user = await User.findOne({ _id });
    if (!user) throw req.ykError("User not found in authenti");
    if(user.role==0){
      req.user = user;
      req.token = token;
      return next();
    }
  } catch (err) {
    return req.errFunc(err);
  }
};
module.exports.toHexString= (str)=> {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16);
  }
  return hex;
}

module.exports.authCollege = async (req, res, next) => {
  try {
    const token = req.header("x-auth");
    const college = await User.findOne({ authTokens: token }).select(
      "_id name mobile"
    );
    if (!college) throw req.ykError("User not found");
    const coll = await College.findOne({
      _concernPerson: college._id,
    }).select("_id");
    if (!coll) throw req.ykError("College User not found");
    req.user = {
      _id: college._id,
      name: college.name,
      mobile: college.mobile,
      _college: coll._id,
    };
    req.token = token;
    return next();
  } catch (err) {
    return req.errFunc(err);
  }
};
module.exports.auth1 = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.session.user._id,
      status: false,
    });
    if (user) {
      rePath = res.redirect("/admin/login");
      return rePath;
    }
    return next();
  } catch (err) {
    console.log('==================> auth1 not', err)
    //  return req.errFunc(err);
  }
};
// module.exports.auth1 = async (req, res, next) => {
//     try {
//         console.log(req.session.user._id);
//         const user = await User.findOne({
//             _id: req.session.user._id,
//         });
//         if (user.status == false) {
//             rePath = res.redirect(/admin/login);
//             return rePath;
//         }
//         if (user.isDeleted == true) {
//             rePath = res.redirect(/admin/login);
//             return rePath;
//         }
//         console.log(user, "user");
//         if (user) {
//             console.log(user, "user");
//             rePath = res.redirect(/admin/login);
//             return rePath;
//         }
//         return next();
//     } catch (err) {
//         //  return req.errFunc(err);
//     }
// };
module.exports.authCommon = async (req, res, next) => {
  try {
    const token = req.header("x-auth");
    const college = await User.findOne({ authTokens: token }).select(
      "_id name mobile role"
    );
    if (!college) throw req.ykError("User not found!");
    if (college && college.role === 0) {
      req.user = {
        _id: college._id,
        name: college.name,
        mobile: college.mobile,
        role: "admin",
      };
    } else if (college && college.role === 1) {
      throw req.ykError("Work on progress!");
    } else if (college && college.role === 2) {
      const coll = await College.findOne({
        _concernPerson: college._id,
      }).select("_id");
      if (!coll) throw req.ykError("User not found!");
      req.user = {
        _id: college._id,
        name: college.name,
        mobile: college.mobile,
        _college: coll._id,
        role: "college",
      };
    } else {
      throw req.ykError("User not found!");
    }
    req.token = token;
    return next();
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.authChat = async (req, res, next) => {
  try {
    const token = req.header("x-auth");    
    if (!token) throw req.ykError("Not Authorized request");
    if (token === chat_service_api) {
      return next();
    } else {
      throw req.ykError("Invalid request");
    }
    
  } catch (err) {
    return req.errFunc(err);
  }
};


module.exports.sendMail = async (subject, message, email) => {
  const nodemailer = require("nodemailer");
  var transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    // ignoreTLS: true,
    secure: true,
    port: 465,
    auth: {
      user: "focalytportal@gmail.com",
      pass: "mcsmzquieeevemdt",
    },
    tls: { rejectUnauthorized: false },
  });

  var mailOptions = {
    from: "Focalyt Portal<focalytportal@gmail.com>",
    to: email,
    subject: subject,
    html: message,
  };

  transporter.sendMail(mailOptions, async function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log(info);
      // res.redirect("/forgetpassword");
      // return res.send({status:1})
    }
  });
};

module.exports.generatePassword = async () => {
  var chars =
    "0123456789abcdefghijklmnopqrstuvwxyz!@#$%&ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var passwordLength = 8;
  var password = "";
  for (var i = 0; i <= passwordLength; i++) {
    var randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }
  return password;
};

const calculateExperience = (fromDate = "", toDate = "") => {
  let experience = "";
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diff_In_Time = end.getTime() - start.getTime();
  let no_of_Days = diff_In_Time / (1000 * 3600 * 24);
  year = no_of_Days >= 365 ? Math.floor(no_of_Days / 365) : 0;
  no_of_Days = year ? no_of_Days - year * 365 : no_of_Days;
  months = no_of_Days >= 30 ? Math.floor((no_of_Days % 365) / 30) : 0;
  no_of_Days = months ? no_of_Days - months * 30 : no_of_Days;
  return year + " year" + months + " month";
};
module.exports.getTotalExperience = async (expArray) => {
  let year = 0;
  let exp = "";
  let requiredMonth = 0;
  for (let i = 0; i < expArray.length; i++) {
    let exp = expArray[i].split(" ");
    year += +exp[0];
    let month = exp[1].split(" ");
    requiredMonth += +month[0].replace("year", "");
  }
  if (requiredMonth % 12 === 0) {
    exp = year + requiredMonth / 12 + " year";
  } else if (requiredMonth % 12 !== 0) {
    exp =
      year +
      Math.floor(requiredMonth / 12) +
      " year" +
      (requiredMonth % 12) +
      " month";
  } else {
    exp = year + " year" + requiredMonth + " month";
  }
  return exp;
};
module.exports.getTechSkills = async (techSkillArray) => {
  const finalArray = [];
  for (let i = 0; i < techSkillArray.length; i++) {
    if (techSkillArray[i].skillId.length && techSkillArray[i].upload_url) {
      finalArray.push({
        id: ObjectId(techSkillArray[i].skillId),
        URL: techSkillArray[i].upload_url,
      });
    }
  }

  return finalArray;
};
module.exports.getNonTechSkills = async (nonTechSkillArray) => {
  const finalArray = [];
  for (let i = 0; i < nonTechSkillArray.length; i++) {
    if (nonTechSkillArray[i].skillId.length && nonTechSkillArray[i].upload_url) {
      finalArray.push({
        id: ObjectId(nonTechSkillArray[i].skillId),
        URL: nonTechSkillArray[i].upload_url,
      });
    }
  }

  return finalArray;
};
module.exports.getDistanceFromLatLonInKm = (first, second) => {
  var R = 6371;
  var dLat = deg2rad(second.lat2 - first.lat1);
  var dLon = deg2rad(second.long2 - first.long1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(first.lat1)) * Math.cos(deg2rad(second.lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}
module.exports.sendSms = async (body) => {
  try {
    let headers = { 'authkey': authKey, 'content-type': "application/json" }
    let result
    if (process.env.NODE_ENV.toLowerCase() === 'production') {
      result = await axios.post(msg91SmsUrl, body, { headers: headers });
      if (result.data.type !== 'success') return result.data.message;
    }
    else {
      result = false
    }
    return result.data
  }
  catch (err) {
    console.log(err)
    throw err
  }
}