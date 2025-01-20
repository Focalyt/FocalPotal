const {
  CandidateReference,
} = require('../../models');

module.exports.getReferences = async (req, res) => {
  try {
    const { _id } = req.user;
    const candReference = await CandidateReference.find({ _candidate: _id, status: true }).select('name');
    if (!candReference) throw req.ykError('Candidate references not exist!');
    return res.send({ status: true, message: 'Candidate references get successfully!', data: { candReference } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.addReference = async (req, res) => {
  try {
    const { _id } = req.user;
    const candRefrence = await CandidateReference.create({ _candidate: _id, ...req.body });
    if (!candRefrence) throw req.ykError('Candidate reference not add now!');
    return res.send({ status: true, message: 'Candidate reference add successfully!', data: { candRefrence } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.referenceDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id } = req.user;
    const referenceDetail = await CandidateReference.findOne({
      _candidate: _id,
      _id: id,
      status: true,
    }).select({ createdAt: false, updatedAt: false, __v: false });
    if (!referenceDetail) throw req.ykError('Candidate reference not exist!');
    return res.send({ status: true, message: 'Candidate reference detail get successfully!', data: { referenceDetail } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.referenceUpdate = async (req, res) => {
  try {
    const reference = await CandidateReference.findByIdAndUpdate(
      { _id: req.body._id },
      { ...req.body },
      { new: true },
    );
    if (!reference) throw req.ykError('Candidate reference not updated now!');
    return res.send({ status: true, message: 'Candidate reference updated successfully!', data: { reference } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.referenceDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const referenceDetail = await CandidateReference.findByIdAndDelete(id);
    if (!referenceDetail) throw req.ykError('Candidate reference not deleted now!');
    return res.send({ status: true, message: 'Candidate reference deleted successfully!' });
  } catch (err) {
    return req.errFunc(err);
  }
};
