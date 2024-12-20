const mongoose = require('mongoose');
const {
  CandidateCareer, CareerObjective,
} = require('../../models');

module.exports.getCareers = async (req, res) => {
  try {
    const { _id } = req.user;
    const candCareer = await CandidateCareer.find({ _candidate: _id, status: true }).select('companyName');
    if (!candCareer) throw req.ykError('Candidate career not exist!');
    return res.send({ status: true, message: 'Candidate career get successfully!', data: { candCareer } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.addCareer = async (req, res) => {
  try {
    const { _id } = req.user;
    const candCareer = await CandidateCareer.create({ _candidate: _id, ...req.body });
    if (!candCareer) throw req.ykError('Candidate career not add now!');
    return res.send({ status: true, message: 'Candidate career add successfully!', data: { candCareer } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.careerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id } = req.user;
    const $match = {
      $match: {
        _id: mongoose.Types.ObjectId(id),
        _candidate: mongoose.Types.ObjectId(_id),
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
    const $project = {
      $project: {
        _id: '$_id',
        companyName: '$companyName',
        countryId: '$countryData._id',
        countryName: '$countryData.name',
        stateId: '$stateData._id',
        stateName: '$stateData.name',
        cityId: '$cityData._id',
        cityName: '$cityData.name',
        currentlyEmployed: '$currentlyEmployed',
        designation: '$designation',
        description: '$description',
        startDate: '$startDate',
        endDate: '$endDate',
      },
    };
    const careerDetail = await CandidateCareer.aggregate([
      $match,
      $lookup,
      $unwind,
      $lookupb,
      $unwindb,
      $lookupc,
      $unwindc,
      $project,
    ]);
    if (!careerDetail) throw req.ykError('Candidate career not exist!');
    return res.send({ status: true, message: 'Candidate career detail get successfully!', data: { careerDetail } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.careerUpdate = async (req, res) => {
  try {
    const career = await CandidateCareer.findByIdAndUpdate(
      { _id: req.body._id },
      { ...req.body },
      { new: true },
    );
    if (!career) throw req.ykError('Candidate career not updated now!');
    return res.send({ status: true, message: 'Candidate career updated successfully!', data: { career } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.careerDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const careerDetail = await CandidateCareer.findByIdAndDelete(id);
    if (!careerDetail) throw req.ykError('Candidate career not deleted now!');
    return res.send({ status: true, message: 'Candidate career deleted successfully!' });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.getAllCareer = async (req, res) => {
  try {
    const { _qualification, _subQualification } = req.user;

    let _qual = _qualification.toString();
    if (_subQualification && _subQualification !== '') {
      _qual = _qual.concat('-').concat(_subQualification);
    }
    const careers = await CareerObjective.find({ status: true, _qual }).select('name objectives');
    if (!careers) throw req.ykError('Careers not exist!');
    return res.send({ status: true, message: 'Careers list get successfully!', data: { careers } });
  } catch (err) {
    return req.errFunc(err);
  }
};
