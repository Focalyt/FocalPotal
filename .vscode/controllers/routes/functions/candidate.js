const mongoose = require("mongoose");
const {
	Candidate,
	CandidateQualification,
	CandidateCareer,
	CandidateProject,
	CandidateReference,
} = require("../../models");

module.exports.register = async (req, res) => {
	try {
		const { _id } = req.user;
		const { mobile } = req.body;
		const candExist = await Candidate.findOne({ _id: { $ne: _id }, mobile });
		if (candExist) throw req.ykError("Mobile number already exist!");
		const candidate = await Candidate.findByIdAndUpdate(
			{ _id },
			{ ...req.body, isProfileCompleted: true },
			{ new: true }
		);
		if (!candidate)
			throw req.ykError("Candidate not register now. Try again later!");
		return res.send({
			status: true,
			message: "Candidate register successfully!",
			data: { candidate },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.getProfileDetail = async (req, res) => {
	try {
		const { _id } = req.user;
		const $match = {
			$match: {
				_id: mongoose.Types.ObjectId(_id),
				status: true,
			},
		};
		const $lookup = {
			$lookup: {
				from: "countries",
				localField: "countryId",
				foreignField: "countryId",
				as: "countryData",
			},
		};
		const $unwind = {
			$unwind: { path: "$countryData", preserveNullAndEmptyArrays: true },
		};
		const $lookupb = {
			$lookup: {
				from: "states",
				localField: "stateId",
				foreignField: "stateId",
				as: "stateData",
			},
		};
		const $unwindb = {
			$unwind: { path: "$stateData", preserveNullAndEmptyArrays: true },
		};
		const $lookupc = {
			$lookup: {
				from: "cities",
				localField: "cityId",
				foreignField: "cityId",
				as: "cityData",
			},
		};
		const $unwindc = {
			$unwind: { path: "$cityData", preserveNullAndEmptyArrays: true },
		};
		const $lookupq = {
			$lookup: {
				from: "qualifications",
				localField: "_qualification",
				foreignField: "_id",
				as: "qualificationData",
			},
		};
		const $unwindq = {
			$unwind: {
				path: "$qualificationData",
				preserveNullAndEmptyArrays: true,
			},
		};
		const $lookupsq = {
			$lookup: {
				from: "subqualifications",
				localField: "_subQualification",
				foreignField: "_id",
				as: "subData",
			},
		};
		const $unwindsq = {
			$unwind: { path: "$subData", preserveNullAndEmptyArrays: true },
		};
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
				countryId: "$countryData._id",
				countryName: "$countryData.name",
				stateId: "$stateData._id",
				stateName: "$stateData.name",
				cityId: "$cityData._id",
				cityName: "$cityData.name",
				_qualification: "$qualificationData._id",
				_qualificationName: "$qualificationData.name",
				_subQualification: "$subData._id",
				_subQualificationName: "$subData.name",
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
		if (!candidate) throw req.ykError("Candidate not found!");
		return res.send({
			status: true,
			message: "Candidate data fetch successfully!",
			data: { candidate },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.changeImage = async (req, res) => {
	try {
		const { image } = req.body;
		const { _id } = req.user;
		if (!image) throw req.ykError("Image is required!");
		const candidate = await Candidate.findByIdAndUpdate(
			_id,
			{ $set: { image } },
			{ new: true }
		).select("image");
		if (!candidate) throw req.ykError("profile image not updated now!");
		return res.send({
			status: true,
			message: "Candidate image change successfully!",
			data: { candidate },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.changeMobile = async (req, res) => {
	try {
		const { mobile } = req.body;
		const { _id } = req.user;
		const candExist = await Candidate.findOne({ mobile, _id: { $ne: _id } });
		if (candExist) throw req.ykError("Mobile number already exist!");
		const candidate = await Candidate.findByIdAndUpdate(_id, mobile, {
			new: true,
		}).select("mobile");
		if (!candidate) throw req.ykError("Mobile number not updated now!");
		return res.send({
			status: true,
			message: "Candidate mobile number change successfully!",
			data: { candidate },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.completeProfile = async (req, res) => {
	try {
		const { mobile } = req.body;
		const { _id } = req.user;
		const candExist = await Candidate.findOne({ mobile, _id: { $ne: _id } });
		if (candExist) throw req.ykError("Mobile number already exist!");
		const candidate = await Candidate.findByIdAndUpdate(
			_id,
			{ ...req.body },
			{ new: true }
		);
		if (!candidate) throw req.ykError("Candidate profile not updated now!");
		return res.send({
			status: true,
			message: "Candidate profile completed successfully!",
			data: { candidate },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.getCareerObjective = async (req, res) => {
	try {
		let careerObj;
		const { careerObjective } = req.user;
		if (!careerObjective) {
			careerObj = "";
		} else {
			careerObj = careerObjective;
		}
		return res.send({
			status: true,
			message: "Candidate career objective get successfully!",
			data: { careerObjective: careerObj },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.updateCareerObjective = async (req, res) => {
	try {
		const { _id } = req.user;
		const candidate = await Candidate.findByIdAndUpdate(
			_id,
			{ ...req.body },
			{ new: true }
		);
		if (!candidate) throw req.ykError("Candidate data not update now!");
		const { careerObjective } = candidate;
		return res.send({
			status: true,
			message: "Candidate career objective updated successfully!",
			data: { careerObjective },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.getSkill = async (req, res) => {
	try {
		let skills;
		const { _skill } = req.user;
		if (!_skill) {
			skills = "";
		} else {
			skills = _skill;
		}
		return res.send({
			status: true,
			message: "Candidate skills data get successfully!",
			data: { skills },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.updateSkill = async (req, res) => {
	try {
		const { _id } = req.user;
		const candidate = await Candidate.findByIdAndUpdate(
			_id,
			{ ...req.body },
			{ new: true }
		);
		if (!candidate) throw req.ykError("Candidate skill data not update now!");
		const { _skill } = candidate;
		return res.send({
			status: true,
			message: "Candidate skill updated successfully!",
			data: { _skill },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.getInterest = async (req, res) => {
	try {
		let interest;
		const { interests } = req.user;
		if (!interests) {
			interest = "";
		} else {
			interest = interests;
		}
		return res.send({
			status: true,
			message: "Candidate interest data get successfully!",
			data: { interest },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.updateInterest = async (req, res) => {
	try {
		const { _id } = req.user;
		const candidate = await Candidate.findByIdAndUpdate(
			_id,
			{ ...req.body },
			{ new: true }
		);
		if (!candidate)
			throw req.ykError("Candidate interest data not update now!");
		const { interests } = candidate;
		return res.send({
			status: true,
			message: "Candidate interests updated successfully!",
			data: { interests },
		});
	} catch (err) {
		return req.errFunc(err);
	}
};

module.exports.profileDetail = async (req, res) => {
	try {
		let contactDetail = false;
		let careerObj = false;
		let qualification = false;
		let candidateCarrer = false;
		let projects = false;
		let skillData = false;
		let interestData = false;
		let referenceData = false;
		const {
			_id,
			email,
			image,
			countryId,
			stateId,
			cityId,
			careerObjective,
			_skill,
			interests,
		} = req.user;

		if (email && countryId && stateId && cityId && image)
			contactDetail = true;
		if (careerObjective && careerObjective !== "") careerObj = true;
		if (_skill && _skill.length > 0) skillData = true;
		if (interests && interests.length > 0) interestData = true;
		const qua = await CandidateQualification.find({ _candidate: _id });
		if (qua && qua.length > 0) qualification = true;
		const career = await CandidateCareer.find({ _candidate: _id });
		if (career && career.length > 0) candidateCarrer = true;
		const proj = await CandidateProject.find({ _candidate: _id });
		if (proj && proj.length > 0) projects = true;
		const ref = await CandidateReference.find({ _candidate: _id });
		if (ref && ref.length > 0) referenceData = true;
		const data = {
			image,
			contactDetail,
			careerObj,
			qualification,
			candidateCarrer,
			projects,
			skillData,
			interestData,
			referenceData,
		};
		return res.send({
			status: true,
			message: "Candidate profile detail fetch successfully!",
			data,
		});
	} catch (err) {
		return req.errFunc(err);
	}
};
