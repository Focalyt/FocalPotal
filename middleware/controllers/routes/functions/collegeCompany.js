const {
  Company,
} = require('../../models');

module.exports.allCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ status: true }).select('name logo');
    if (!companies) throw req.ykError('Company data not get!');
    return res.send({ status: true, message: 'Company data get successfully!', data: { companies } });
  } catch (err) {
    return req.errFunc(err);
  }
};


