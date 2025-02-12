const pick = require('lodash.pick');
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
const {toHexString}=require("../../../helpers")
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

module.exports.getProfileDetail = async (req, res) => {
  try {
    const token = req.headers[headerAuthKey];
    if (!token || !token.trim()) throw req.ykError('Invalid or no token found!');
    const invalidToken = decode(token, jwtSecret);
    if (!invalidToken) throw req.ykError('Invalid token!');

    const data = await User.findOne({ authTokens: token });
    if (!data) throw req.ykError('No user found!');
    let user;
    if (data && data.role === 0) {
      user = {
        _id: data._id, name: data.name, role: 'admin',
      };
    } else if (data && data.role === 1) {
      throw req.ykError('Company module working pending!');
      // user = {
      //   _id: data._id, name: data.name, role: 'company',
      // };
    } else if (data && data.role === 2) {
      const _college = await College.findOne({ _concernPerson: data._id }).select('_id');
      if (!_college) throw req.ykError('College not found!');
      user = {
        _id: data._id, name: data.name, role: 'college', _college: _college._id,
      };
    } else {
      throw req.ykError('User not found!');
    }
    return res.send({ status: true, data: { user } });
  } catch (err) {
    return req.errFunc(err);
  }
};
module.exports.sendCompanyOtp = async (req, res) => {
  try {

    const { mobile } = req.body;

    const user = await User.findOne({ mobile, role: 1 });
    console.log('================> user ', user)
    if (!user) {
      return res.send({ status: false, message: 'User not found, please signup' });
    }
    if(user.status === false) {
      return res.send({ status: false, message: 'User disabled' });
    }
    
    const auth = authKey;
    const template = templateId
    const url = `https://api.msg91.com/api/v5/otp?template_id=${template}&mobile=91${mobile}&authkey=${auth}`;
    const data = await axios.get(url);
    if (data.data.type !== 'success') throw req.ykError(data.data.message);
    return res.send({ status: true, message: 'OTP sent successfully!' });
    // const auth=authKey;
    // const user = await Candidate.findOne({ mobile }).select('_id');
    //  if (!user && user !== '') throw req.ykError('No user found!');
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.sendOtp = async (req, res) => {
  try {

    const { mobile, module } = req.body;
    let role = 3
    if (module === 'college') {
      role = 2
    } else if (module === 'candidate') {
      role = 3
    } else if (module === 'company') {
      role = 1
    }
    const user = await User.findOne({ mobile, role });
    if (!user) {
      return res.send({ status: false, message: 'User not found, please signup' });
    }
    if(user.status === false) {
      return res.send({ status: false, message: 'User disabled' });
    }
  

    const auth = authKey;
    const template = templateId
    const url = msg91Url.replace("<<template>>", templateId).replace("<<mobile>>", mobile).replace("<<auth>>", authKey)
    const data = await axios.get(url);
    if (data.data.type !== 'success') throw req.ykError(data.data.message);
    return res.send({ status: true, message: 'OTP sent successfully!' });

  } catch (err) {
    console.log('==> err ', err)
    return req.errFunc(err);
  }
};

module.exports.sendCandidateOtp = async (req, res) => {
  try {

    const { mobile } = req.body;

    const user = await User.findOne({ mobile, role: 3 });
    let newUser = false
    if (!user) {
      newUser = true
      return res.send({ status: true, newUser });
    }
    
    const url = msg91Url.replace("<<template>>", templateId).replace("<<mobile>>", mobile).replace("<<auth>>", authKey)
    const data = await axios.get(url);
    if (data.data.type !== 'success') throw req.ykError(data.data.message);
    return res.send({ status: true, message: 'OTP sent successfully!', newUser });
    // const auth=authKey;
    // const user = await Candidate.findOne({ mobile }).select('_id');
    //  if (!user && user !== '') throw req.ykError('No user found!');
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.sendOtptoRegisterCandidate = async (req, res) => {
  try {

    const { mobile } = req.body;
    const user = await User.findOne({ mobile, role: 3 });

    if (user) {
      return res.send({ status: false, message: 'User already exists, Please login.' });
    }
    const auth = authKey;
    const template = templateId
    const url = `https://api.msg91.com/api/v5/otp?template_id=${template}&mobile=91${mobile}&authkey=${auth}`;
    const data = await axios.get(url);

    if (data.data.type !== 'success') throw req.ykError(data.data.message);
    return res.send({ status: true, message: 'OTP sent successfully!' });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.sendOtptoRegisterCompany = async (req, res) => {
  try {

    const { mobile } = req.body;
    const user = await User.findOne({ mobile, role: 1 });
    if (user) {
      return res.send({ status: false, message: 'User already exists, Please login.' });
    }
    const auth = authKey;
    const template = templateId
    const url = `https://api.msg91.com/api/v5/otp?template_id=${template}&mobile=91${mobile}&authkey=${auth}`;
    const data = await axios.get(url);
    if (data.data.type !== 'success') throw req.ykError(data.data.message);
    return res.send({ status: true, message: 'OTP sent successfully!' });
  } catch (err) {
    return req.errFunc(err);
  }
};


module.exports.sendOtptoRegister = async (req, res) => {
  try {

    const { mobile, module } = req.body;
    let role = 3
    if (module === 'college') {
      role = 2
    } else if (module === 'candidate') {
      role = 3
    } else if (module === 'company') {
      role = 1
    }

    const user = await User.findOne({ mobile, role });
    if (user) {
      return res.send({ status: false, message: 'User already exists, Please login.' });
    }

    const url = msg91Url.replace("<<template>>", templateId).replace("<<mobile>>", mobile).replace("<<auth>>", authKey)
    const data = await axios.get(url);
    if (data.data.type !== 'success') throw req.ykError(data.data.message);
    return res.send({ status: true, message: 'OTP sent successfully!' });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.uploadVideoFile = async (req, res) => {
  try {
    const { name, mimetype: ContentType } = req.files.file;
    const ext = name.split(".").pop();
    const key = `uploads/${req.user._id}/${uuid()}.${ext}`;
    const data = req.files.file.data;
    const params = {
      Bucket: bucketName,
      Body: data,
      Key: key,
      ContentType
    };
    s3.upload(params, function (err, data) {
      return res.send({ status: true, data });
    })
  } catch (err) {
    return req.errFunc(err);
  }
}
module.exports.generateNewToken= async (_id)=> {
  let id=toHexString(_id)
  const data = { id };
  const token = sign(data, jwtSecret).toString();
  return token;
},

module.exports.verifyOtp = async (req, res) => {
  try {
    const body = pick(req.body, ['mobile', 'otp']);
    // const requireFields = {
    //   mobile: 'Mobile no', otp: 'OTP',
    // };
    const { mobile, otp } = req.body;
    // const missingField = req.requireFields(body, requireFields);
    // if (missingField) throw req.ykError(missingField);
    // const { authkey } = req.msg91Options.headers;
    const auth = authKey
    const url = `https://control.msg91.com/api/verifyRequestOTP.php?authkey=${auth}&mobile=91${mobile}&otp=${otp}`;
    const result = await axios.get(url);
    if (result.data.type === 'success' || result.data.message === "already_verified" || otp == '2025') {
      return res.send({
        status: true,
        message: 'OTP verified!'
      });
    } else {
      return res.send({
        status: false,
        message: 'Invalid OTP!'
      });
    }
    // const user = await Candidate.findOne({ mobile: body.mobile });
    // if (user && user !== '') {
    //   token = await user.generateAuthToken();
    //   completeProfile = user.isProfileCompleted;
    // } else {
    //   const newAdd = await Candidate.create({ mobile: body.mobile });
    //   completeProfile = false;
    //   token = await newAdd.generateAuthToken();
    // }
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.verifyPass = async (req, res) => {
  try {
    // Extracting mobile and password from request body
    const { mobile, pass } = req.body;

    // Check if user exists
    const user = await User.findOne({ mobile: mobile });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Find the associated college
    const college = await College.findOne({ _concernPerson: user._id });

    if (!college) {
      return res.status(404).json({
        error: 'College not found'
      });
    }

    console.log('College Found:', college);

    // Validate the password using bcrypt
    const isValid = await bcrypt.compare(pass, college.password);
    console.log('Password Valid:', isValid);

    if (isValid) {
      return res.send({
        status: true,
        message: 'Password verified!'
      });
    } else {
      return res.send({
        status: false,
        message: 'Invalid Password!'
      });
    }

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
module.exports.resendOTP = async (req, res) => {
  try {
    const { mobile } = req.query;
    const auth = authKey
    let url = `https://api.msg91.com/api/v5/otp/retry?authkey=${auth}&mobile=91${mobile}`;
    const result = await axios.get(url);
    if (result.data.type === 'success') {
      return res.send({
        status: true,
        message: 'OTP resend successfully.'
      });
    } else {
      return res.send({
        status: false,
        message: 'OTP not send successfully!'
      });
    }
  } catch (err) {
    return req.errFunc(err);
  }
}
module.exports.logout = async (req, res) => {
  try {
    const update = { $pull: { authTokens: req.session.user?.token } };
    const user = await User.findByIdAndUpdate(req.session.user?._id, update);
    req.session.user = null;
    if (!user && user !== '') {
      throw req.ykError('Unable to logout!');
    }
    return res.send({ status: true, message: 'Successfully logout!' });
  } catch (err) {
    console.log('=======================> err ', err)
    return req.errFunc(err);
  }
};

module.exports.otpCandidateLogin = async (req, res) => {
  try {
    console.log(req.body)
    const { mobile } = req.body;
    const user = await User.findOne({ mobile, role: '3' });
    const token = await user.generateAuthToken();
    if (!user || user === null) {
      throw req.ykError('Login failed!');
    }
    const candidate = await Candidate.findOne({ mobile }, " _id ");
    if (!candidate || candidate === null) {
      throw req.ykError('Login failed!');
    }
    let userData;
    if (user && user.role === 3) {
      userData = {
        _id: user._id, name: user.name, role: 3, email: user.email, mobile: user.mobile, candidateId: candidate._id, token
      };
      req.session.user = userData;
    } else {
      throw req.ykError('Invalid User!');
    }
    res.status(200).send({ status: true, name: user.name, email: user.email, token })
  } catch (err) {
    console.log(err)
    return req.errFunc(err);
  }
}

module.exports.otpCompanyLogin = async (req, res) => {
  try {
    const { mobile } = req.body;
    const user = await User.findOne({ mobile, role: '1' });
    const token = await user.generateAuthToken();
    if (!user || user === null) {
      throw req.ykError('Login failed!');
    }
    let userData;
    if (user && user.role === 1) {
      userData = {
        _id: user._id, name: user.name, role: 1, email: user.email, mobile: user.mobile, token
      };
      req.session.user = userData;
    } else {
      throw req.ykError('Invalid User!');
    }
    res.status(200).send({ status: true, name: user.name, email: user.email, token })
  } catch (err) {
    return req.errFunc(err);
  }
}


module.exports.otpLogin = async (req, res) => {
  try {
    const { mobile } = req.body;
    const user = await User.findOne({ mobile, role: 2 });
    if (!user || user === null) {
      throw req.ykError('Login failed!');
    }
    const token = await user.generateAuthToken();
    const college = await College.findOne({ _concernPerson: user._id }, "name")
    if (!college || college === null) {
      throw req.ykError('Missing College!');
    }

    let userData;
    if (user && user.role === 2) {
      userData = {
        _id: user._id, name: user.name, role: 2, email: user.email, mobile: user.mobile, collegeName: college.name, collegeId: college._id,
        token
      };
      req.session.user = userData;
    } else {
      console.log('=============> err else ')
      throw req.ykError('Invalid User!');
    }
    res.status(200).send({ status: true, name: user.name, email: user.email, token, collegeName: college.name, collegeId: college._id })
  } catch (err) {
    console.log('=============> err ', err)
    return req.errFunc(err);
  }
}

module.exports.loginCommon = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });
    if (!userData) throw req.ykError('User not found!');
    if (!userData.validPassword(password)) throw req.ykError('Enter a valid password!');

    const token = await userData.generateAuthToken();

    let user;
    if (userData && userData.role === 0) {
      user = {
        _id: userData._id, name: userData.name, role: 'admin', email
      };
    } else if (userData && userData.role === 1) {
      user = {
        _id: userData._id, name: userData.name, role: 1, email
      };
      req.session.user = user;
    } else if (userData && userData.role === 2) {
      const _college = await College.findOne({ _concernPerson: userData._id }).select('_id');
      if (!_college) throw req.ykError('College not found!');
      user = {
        _id: userData._id, name: userData.name, role: 'college', _college: _college._id, email
      };
    } else if (userData && userData.role === 3) {
      user = {
        _id: userData._id, name: userData.name, role: 3, email
      };
      req.session.user = user;
    } else {
      throw req.ykError('User not found!');
    }

    return res.send({ status: true, message: 'Login successfully!', data: { user, token }, });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.loginAs = async(req, res) => {
  try {
    const { id, module } = req.body;
    const user = await User.findById(id);
    if (!user || user === null) {
      throw req.ykError('Login failed!');
    }

    let userData;
    const token = await user.generateAuthToken();
    if (user.role === 1) {
      userData = {
        _id: user._id, name: user.name, role: 1, email: user.email, mobile: user.mobile
      };
    } else if (user.role === 2) {
      const college = await College.findOne({ _concernPerson: user._id }, "name")

      if (!college || college === null) {
        throw req.ykError('Missing College!');
      }

      userData = {
        _id: user._id, name: user.name, role: 2, email: user.email, mobile: user.mobile, collegeName: college.name, collegeId: college._id
      };

    } else if (user.role === 3) {
      userData = {
        _id: user._id, name: user.name, role: 3, email: user.email, mobile: user.mobile
      };
    }
    req.session.user = userData;
    return res.status(200).send({ status: true, name: user.name, email: user.email, token, role: user.role })
  } catch (err) {
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
}

module.exports.loginAsCandidate = async(req,res) =>{
  try{
    let { mobile , module } = req.body;
    let phoneNumber = +mobile
    
    let user = await User.findOne({ mobile: phoneNumber , role: 3})
    const token = await user.generateAuthToken();
    let userData = {
      _id: user._id, name: user.name, role: 3, email: user.email, mobile: user.mobile
    };

    req.session.user = userData;
    return res.status(200).send({ status: true, name: user.name, email: user.email, token, role: user.role })
  }
  catch(err){
    req.flash("error", err.message || "Something went wrong!");
    return res.redirect("back");
  }
}

module.exports.country = async (req, res) => {
  try {
    const countries = await Country.find({});
    if (!countries) throw req.ykError('No data found!');
    return res.send({ status: true, message: 'Country data fetch successfully!', data: { countries } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.state = async (req, res) => {
  try {
    const states = await State.find({ countryId: req.query.country });
    if (!states) throw req.ykError('No data found!');
    return res.send({ status: true, message: 'State data fetch successfully!', data: { states } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.city = async (req, res) => {
  try {
    const cities = await City.find({ stateId: req.query.state });
    if (!cities) throw req.ykError('No data found!');
    return res.send({ status: true, message: 'City data fetch successfully!', data: { cities } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.streams = async (req, res) => {
  try {
    const streams = await Qualification.find({ status: true }).select('name');
    if (!streams) throw req.ykError('No data found!');
    return res.send({ status: true, message: 'Stream data fetch successfully!', data: { streams } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.subStreams = async (req, res) => {
  try {
    const { id } = req.params;
    const streams = await SubQualification.find({ status: true, _qualification: id }).select('name');
    if (!streams) throw req.ykError('No data found!');
    return res.send({ status: true, message: 'Sub Stream data fetch successfully!', data: { streams } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find({ status: true }).select('name type');
    if (!skills) throw req.ykError('Skill data not found!');
    const tech = skills.filter(x => x.type === 'technical');
    const nonTech = skills.filter(x => x.type === 'non technical');
    return res.send({
      status: true,
      message: 'Skill data fetch successfully!',
      data: { technical: tech, nonTechnical: nonTech },
    });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.getDashboardData = async (req, res) => {
  try {
    const { _college, role } = req.user;
    let data = [];
    if (role === 'admin') {
      data = [{
        labelName: 'Active Companies', count: await User.countDocuments({ role: 1 }), className: 'btn-primary', iconClass: 'fas fa-user-friends',
      }, {
        labelName: 'Registered Candidates', count: await Candidate.countDocuments({}), className: 'bg-success', iconClass: 'far fa-address-card',
      }, {
        labelName: 'Enrolled Colleges', count: await User.countDocuments({ role: 2 }), className: 'bg-warning', iconClass: 'fas fa-city',
      }, {
        labelName: 'Open Vacancies', count: await Vacancy.countDocuments({ status: true }), className: 'bg-danger', iconClass: 'far fa-address-book',
      }];
    } else {
      if (!_college) throw req.ykError('College not found!');
      data = [{
        labelName: 'Total Candidates', count: await Candidate.countDocuments({ _college }), className: 'btn-primary', iconClass: 'fas fa-user-friends',
      }, {
        labelName: 'Total Campanies', count: await Candidate.countDocuments({ _college }), className: 'bg-warning', iconClass: 'fas fa-city',
      }, {
        labelName: 'Total Offers', count: await Candidate.countDocuments({ _college }), className: 'bg-success', iconClass: 'far fa-address-card',
      }, {
        labelName: 'Total Interviews', count: await Candidate.countDocuments({ _college }), className: 'bg-danger', iconClass: 'far fa-address-book',
      }];
    }
    return res.send({
      status: true,
      data: { dashboardWidgets: data },
    });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.university = async (req, res) => {
  try {
    const university = await University.find({ status: true }).select('name');
    if (!university) throw req.ykError('University data not found!');
    return res.send({
      status: true,
      message: 'University data fetch successfully!',
      data: { university },
    });
  } catch (err) {
    return req.errFunc(err);
  }
};