const {
  CandidateQualification,
  University,
} = require('../../models');

module.exports.getQualification = async (req, res) => {
  try {
    const { _id } = req.user;
    const candQualification = await CandidateQualification.find({ _candidate: _id, status: true }).select('name');
    if (!candQualification) throw req.ykError('Candidate qualification not exist!');
    return res.send({ status: true, message: 'Candidate qualification get successfully!', data: { candQualification } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.addQualification = async (req, res) => {
  try {
    let uni;
    let board;
    const { _id } = req.user;
    const { boardOrUniv, university } = req.body;
    if (boardOrUniv === 'other' || boardOrUniv === 'others') {
      const checkData = await University.findOne({ name: university });
      if (checkData) throw req.ykError('Send valid university/board!');
      uni = await University.create({ name: university });
      if (!uni) throw req.ykError('University not added!');
      board = uni._id;
    } else {
      board = boardOrUniv;
    }
    const candQualification = await CandidateQualification.create({
      _candidate: _id,
      ...req.body,
      boardOrUniv: board,
    });
    if (!candQualification) throw req.ykError('Candidate qualification not add now!');
    return res.send({ status: true, message: 'Candidate qualification add successfully!', data: { candQualification } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.qualificationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id } = req.user;
    const populate = { path: 'boardOrUniv', select: 'name' };
    const qualificationDetail = await CandidateQualification.findOne({
      _candidate: _id,
      _id: id,
      status: true,
    }).populate(populate).select({ createdAt: false, updatedAt: false, __v: false });
    if (!qualificationDetail) throw req.ykError('Candidate qualification not exist!');
    return res.send({ status: true, message: 'Candidate qualification detail get successfully!', data: { qualificationDetail } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.qualificationUpdate = async (req, res) => {
  try {
    const qualification = await CandidateQualification.findByIdAndUpdate(
      { _id: req.body._id },
      { ...req.body },
      { new: true },
    );
    if (!qualification) throw req.ykError('Candidate qualification not updated now!');
    return res.send({ status: true, message: 'Candidate qualification updated successfully!', data: { qualification } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.qualificationDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const qualificationDetail = await CandidateQualification.findByIdAndDelete(id);
    if (!qualificationDetail) throw req.ykError('Candidate qualification not deleted now!');
    return res.send({ status: true, message: 'Candidate qualification deleted successfully!' });
  } catch (err) {
    return req.errFunc(err);
  }
};
