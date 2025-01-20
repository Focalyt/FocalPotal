const mongoose = require('mongoose');
const {
  Candidate,
} = require('../../models');

module.exports.addCandidate = async (req, res) => {
  try {
    const { _college } = req.user;
    const { mobile } = req.body;
    const candExist = await Candidate.findOne({ mobile });
    if (candExist) throw req.ykError('Mobile number already exist!');
    const candidate = await Candidate.create({ ...req.body, isProfileCompleted: true, _college });
    if (!candidate) throw req.ykError('Candidate not register now. Try again later!');
    return res.send({ status: true, message: 'Candidate register successfully!', data: { candidate } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.getActiveCandidate = async (req, res) => {
  try {
    const { _college } = req.user;
    const $match = {
      $match: {
        _college: mongoose.Types.ObjectId(_college),
      },
    };
    const $project = {
      $project: {
        _id: true,
        name: true,
        mobile: true,
        status: true,
      },
    };
    const candidates = await Candidate.aggregate([
      $match,
      $project,
    ]);
    if (!candidates) throw req.ykError('Candidate not found!');
    return res.send({ status: true, message: 'Candidate data fetch successfully!', data: { candidates } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.getInactiveCandidate = async (req, res) => {
  try {
    const { _college } = req.user;
    const $match = {
      $match: {
        _college: mongoose.Types.ObjectId(_college),
        status: true,
      },
    };
    const $lookup = {
      $lookup: {
        from: 'countries',
        localField: 'countryId',
        foreignField: 'countryId',
        as: 'countryData',
      },
    };
    const $unwind = { $unwind: { path: '$countryData', preserveNullAndEmptyArrays: true } };
    const $lookupb = {
      $lookup: {
        from: 'states',
        localField: 'stateId',
        foreignField: 'stateId',
        as: 'stateData',
      },
    };
    const $unwindb = { $unwind: { path: '$stateData', preserveNullAndEmptyArrays: true } };
    const $lookupc = {
      $lookup: {
        from: 'cities',
        localField: 'cityId',
        foreignField: 'cityId',
        as: 'cityData',
      },
    };
    const $unwindc = { $unwind: { path: '$cityData', preserveNullAndEmptyArrays: true } };
    const $lookupq = {
      $lookup: {
        from: 'qualifications',
        localField: '_qualification',
        foreignField: '_id',
        as: 'qualificationData',
      },
    };
    const $unwindq = { $unwind: { path: '$qualificationData', preserveNullAndEmptyArrays: true } };
    const $lookupsq = {
      $lookup: {
        from: 'subqualifications',
        localField: '_subQualification',
        foreignField: '_id',
        as: 'subData',
      },
    };
    const $unwindsq = { $unwind: { path: '$subData', preserveNullAndEmptyArrays: true } };
    const $project = {
      $project: {
        _id: true,
        name: true,
        mobile: true,
        email: true,
        address: true,
        pincode: true,
        image: true,
        semester: true,
        cgpa: true,
        resume: true,
        session: true,
        interests: true,
        cgpaType: true,
        otherUrls: true,
        careerObjective: true,
        _skill: true,
        linkedInUrl: true,
        facebookUrl: true,
        twitterUrl: true,
        countryId: '$countryData._id',
        countryName: '$countryData.name',
        stateId: '$stateData._id',
        stateName: '$stateData.name',
        cityId: '$cityData._id',
        cityName: '$cityData.name',
        _qualification: '$qualificationData._id',
        _qualificationName: '$qualificationData.name',
        _subQualification: '$subData._id',
        _subQualificationName: '$subData.name',
      },
    };
    const candidate = await Candidate.aggregate([
      $match,
      $lookup,
      $unwind,
      $lookupb,
      $unwindb,
      $lookupc,
      $unwindc,
      $lookupq,
      $unwindq,
      $lookupsq,
      $unwindsq,
      $project,
    ]);
    if (!candidate) throw req.ykError('Candidate not found!');
    return res.send({ status: true, message: 'Candidate data fetch successfully!', data: { candidate } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.candidateStatus = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.body._id, req.body, { new: true }).select('_id name status');
    if (!candidate) throw req.ykError('Candidate not update now. Try again later!');
    return res.send({ status: true, message: 'Candidate update successfully!', data: { candidate } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.candidateData = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) throw req.ykError('Candidate data not fetch now. Try again later!');
    return res.send({ status: true, message: 'Candidate data get successfully!', data: { candidate } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.candidateUpdate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.body._id, req.body);
    if (!candidate) throw req.ykError('Candidate data not update now. Try again later!');
    return res.send({ status: true, message: 'Candidate data update successfully!', data: { candidate } });
  } catch (err) {
    return req.errFunc(err);
  }
};

