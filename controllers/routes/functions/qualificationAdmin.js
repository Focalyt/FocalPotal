const {
    Qualification,
  } = require('../../models');

  module.exports.getList = async (req, res) => {
    try {
      const qualifications = await Qualification.find({ }).select('name status').sort({ createdAt: -1 });
      return res.send({ status: true, message: 'Qualifications List get successfully!', data: { qualifications } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.addQualification = async (req, res) => {
    try {
      const { name } = req.body;
      const checkdata = await Qualification.findOne({ name });
      if (checkdata && checkdata !== '') throw req.ykError('Qualification already exist!');
      const qualification = await Qualification.create({ name });
      if (!qualification) throw req.ykError('Qualification not add now. Please try again later!');
      return res.send({ status: true, message: 'Qualification data add successfully!', data: { qualification } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.updateQualification = async (req, res) => {
    try {
      const { name } = req.body;
      const checkdata = await Qualification.findOne({ _id: { $ne: req.body._id },  name });
      if (checkdata && checkdata !== '') throw req.ykError('Qualification already exist!');
      const qualification = await Qualification.findByIdAndUpdate(req.body._id, { name }, { new: true });
      if (!qualification) throw req.ykError('Qualification not update now. Please try again later!');
      return res.send({ status: true, message: 'Qualification data update successfully!', data: { qualification } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.updateStatus = async (req, res) => {
    try {
      const qualification = await Qualification.findByIdAndUpdate(req.body._id, req.body, { new: true }).select('_id status');
      if (!qualification) throw req.ykError('Qualification not update now. Try again later!');
      return res.send({ status: true, message: 'Qualification update successfully!', data: { qualification } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.qualificationData = async (req, res) => {
    try {
      const { id } = req.params;
      const qualification = await Qualification.findById(id).select('name');
      if (!qualification) throw req.ykError('Qualification data not get now. Please try again later!');
      return res.send({ status: true, message: 'Qualification data get successfully!', data: { qualification } });
    } catch (err) {
      return req.errFunc(err);
    }
  };
