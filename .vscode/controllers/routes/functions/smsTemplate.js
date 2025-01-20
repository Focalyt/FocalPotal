const {
    CollegeSms,
  } = require('../../models');

  module.exports.getList = async (req, res) => {
    try {
      const { _college } = req.user;
      const types = await CollegeSms.find(
        { _college },
      ).select('name message status').sort({ createdAt: -1 });
      return res.send({ status: true, message: 'College Sms List get successfully!', data: { types } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.addSms = async (req, res) => {
    try {
      const { _college } = req.user;
      const type = await CollegeSms.create({ ...req.body, _college });
      if (!type) throw req.ykError('Sms Template not add now. Please try again later!');
      return res.send({ status: true, message: 'Sms Template data add successfully!', data: { type } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.updateSms = async (req, res) => {
    try {
      const type = await CollegeSms.findByIdAndUpdate(req.body._id, { ...req.body }, { new: true });
      if (!type) throw req.ykError('Sms template not update now. Please try again later!');
      return res.send({ status: true, message: 'Sms template data update successfully!', data: { type } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.updateStatus = async (req, res) => {
    try {
      const type = await CollegeSms.findByIdAndUpdate(req.body._id, req.body, { new: true }).select('_id status');
      if (!type) throw req.ykError('Sms Template not update now. Try again later!');
      return res.send({ status: true, message: 'Sms Template update successfully!', data: { type } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.smsData = async (req, res) => {
    try {
      const { id } = req.params;
      const type = await CollegeSms.findById(id).select('name message');
      if (!type) throw req.ykError('Sms template data not get now. Please try again later!');
      return res.send({ status: true, message: 'Sms template data get successfully!', data: { type } });
    } catch (err) {
      return req.errFunc(err);
    }
  };
