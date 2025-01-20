const {
  CandidateProject,
} = require('../../models');

module.exports.getProjects = async (req, res) => {
  try {
    const { _id } = req.user;
    const candProject = await CandidateProject.find({ _candidate: _id, status: true }).select('name');
    if (!candProject) throw req.ykError('Candidate projects not exist!');
    return res.send({ status: true, message: 'Candidate projects get successfully!', data: { candProject } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.addProject = async (req, res) => {
  try {
    const { _id } = req.user;
    const candProject = await CandidateProject.create({ _candidate: _id, ...req.body });
    if (!candProject) throw req.ykError('Candidate project not add now!');
    return res.send({ status: true, message: 'Candidate project add successfully!', data: { candProject } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.projectDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id } = req.user;
    const projectDetail = await CandidateProject.findOne({
      _candidate: _id,
      _id: id,
      status: true,
    }).select({ createdAt: false, updatedAt: false, __v: false });
    if (!projectDetail) throw req.ykError('Candidate project not exist!');
    return res.send({ status: true, message: 'Candidate project detail get successfully!', data: { projectDetail } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.projectUpdate = async (req, res) => {
  try {
    const project = await CandidateProject.findByIdAndUpdate(
      { _id: req.body._id },
      { ...req.body },
      { new: true },
    );
    if (!project) throw req.ykError('Candidate project not updated now!');
    return res.send({ status: true, message: 'Candidate project updated successfully!', data: { project } });
  } catch (err) {
    return req.errFunc(err);
  }
};

module.exports.projectDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const projectDetail = await CandidateProject.findByIdAndDelete(id);
    if (!projectDetail) throw req.ykError('Candidate project not deleted now!');
    return res.send({ status: true, message: 'Candidate project deleted successfully!' });
  } catch (err) {
    return req.errFunc(err);
  }
};
