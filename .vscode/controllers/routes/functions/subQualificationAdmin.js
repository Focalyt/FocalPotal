const {
    SubQualification,
  } = require('../../models');

  module.exports.getList = async (req, res) => {
    try {
      const $match = { };
      const subQualifications = await SubQualification.aggregate([
        { $match },
        {
          $lookup: {
            from: 'qualifications',
            localField: '_qualification',
            foreignField: '_id',
            as: 'qualData',
          },
        },
        { $unwind: '$qualData' },
        {
          $project: {
            _id: true, name: true, _qualification: true, status: true, qualName: '$qualData.name',
          },
        },
      ]);
      return res.send({ status: true, message: 'Sub Qualifications List get successfully!', data: { subQualifications } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.addSubQualification = async (req, res) => {
    try {
      const { name, _qualification } = req.body;
      const checkdata = await SubQualification.findOne({ name, _qualification });
      if (checkdata && checkdata !== '') throw req.ykError('Sub Qualification already exist!');
      const subQualification = await SubQualification.create({ name, _qualification });
      if (!subQualification) throw req.ykError('Sub Qualification not add now. Please try again later!');
      return res.send({ status: true, message: 'Sub Qualification data add successfully!', data: { subQualification } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.updateSubQualification = async (req, res) => {
    try {
      const { name, _qualification } = req.body;
      const checkdata = await SubQualification.findOne({ _id: { $ne: req.body._id },  name, _qualification });
      if (checkdata && checkdata !== '') throw req.ykError('Sub Qualification already exist!');
      const subQualUpdate = await SubQualification.findByIdAndUpdate(req.body._id, { name, _qualification }, { new: true })
        .populate({ path: '_qualification', select: 'name' });
      if (!subQualUpdate) throw req.ykError('Sub Qualification not update now. Please try again later!');
      const subQualification = {
        _id: subQualUpdate._id,
        name: subQualUpdate.name,
        _qualification,
        qualName: subQualUpdate._qualification.name,
        status : subQualUpdate.status,
      };
      return res.send({ status: true, message: 'Sub Qualification data update successfully!', data: { subQualification } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.updateStatus = async (req, res) => {
    try {
      const subQualification = await SubQualification.findByIdAndUpdate(req.body._id, req.body, { new: true }).select('_id status');
      if (!subQualification) throw req.ykError('Sub Qualification not update now. Try again later!');
      return res.send({ status: true, message: 'Sub Qualification update successfully!', data: { subQualification } });
    } catch (err) {
      return req.errFunc(err);
    }
  };

  module.exports.subQualificationData = async (req, res) => {
    try {
      const { id } = req.params;
      const subQualification = await SubQualification.findById(id).select('name _qualification');
      if (!subQualification) throw req.ykError('Sub Qualification data not get now. Please try again later!');
      return res.send({ status: true, message: 'Sub Qualification data get successfully!', data: { subQualification } });
    } catch (err) {
      return req.errFunc(err);
    }
  };
