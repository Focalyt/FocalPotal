const express = require("express");
const multer  = require('multer')
var multipleUpload = multer().array('file');
const { authenti, authCollege, authCommon, isCandidate, isAdmin, authentiAdmin, auth1 } = require("../../helpers");
const {
	commonFunc,
	imageFunc,
	candidateFunc,
	collegeTodoFunc,
	collegeCandidateFunc,
	collegeCompanyFunc,
	smsTemplateFunc,
	qualificationFunc,
	qualificationAdminFunc,
	subQualificationAdminFunc,
	careerFunc,
	projectFunc,
	referenceFunc,
	postFunc,
	teamFunc
} = require("./functions");

const apiRoutes = express.Router();
const commonRoutes = express.Router();
const imageRoutes = express.Router();
const candidateRoutes = express.Router();
const collegeTodoRoutes = express.Router();
const collegeCandidateRoutes = express.Router();
const collegeCompanyRoutes = express.Router();
const careerRoutes = express.Router();
const projectRoutes = express.Router();
const qualificationRoutes = express.Router();
const qualificationAdminRoutes = express.Router();
const subQualificationAdminRoutes = express.Router();
const referenceRoutes = express.Router();
const smsTemplateRoutes = express.Router();

commonRoutes.post("/sendCandidateOtp", commonFunc.sendCandidateOtp);
commonRoutes.post("/postfiles", postFunc.uploadPostFiles);
commonRoutes.post("/editpost", postFunc.editPost);
commonRoutes.post("/uploadPostVideoFile", postFunc.uploadPostVideoFile);
commonRoutes.post("/sendCompanyOtp",commonFunc.sendCompanyOtp);
commonRoutes.post("/sendOtp",commonFunc.sendOtp);
commonRoutes.post("/sendOtptoRegisterCandidate", commonFunc.sendOtptoRegisterCandidate);
commonRoutes.post("/sendOtptoRegisterCompany", commonFunc.sendOtptoRegisterCompany);
commonRoutes.post("/sendOtptoRegister", commonFunc.sendOtptoRegister);
commonRoutes.post("/verifyOtp", commonFunc.verifyOtp);
commonRoutes.post("/verifyPass", commonFunc.verifyPass);
commonRoutes.get("/resendOTP",commonFunc.resendOTP);
commonRoutes.get("/currentUserWebapp", commonFunc.getProfileDetail);
commonRoutes.get("/logout", commonFunc.logout);
commonRoutes.get("/streams", authenti, commonFunc.streams);
commonRoutes.post("/loginCommon", commonFunc.loginCommon);
commonRoutes.post("/loginAs", isAdmin, commonFunc.loginAs)
commonRoutes.post("/loginAsCandidate", isAdmin, commonFunc.loginAsCandidate)
commonRoutes.post("/otpCandidateLogin",commonFunc.otpCandidateLogin);
commonRoutes.post("/otpCompanyLogin",commonFunc.otpCompanyLogin);
commonRoutes.post("/otpLogin",commonFunc.otpLogin);
commonRoutes.get("/subStreams/:id", authenti, commonFunc.subStreams);
commonRoutes.get("/skills", authenti, commonFunc.getAllSkills);
commonRoutes.get("/university", authenti, commonFunc.university);
commonRoutes.get("/country", commonFunc.country);
commonRoutes.get("/state", commonFunc.state);
commonRoutes.get("/city", commonFunc.city);
commonRoutes.post("/getUploadUrl", [authenti, isCandidate], imageFunc.getUploadUrl);
commonRoutes.post("/uploadSingleFile", [authenti], imageFunc.uploadSingleImage);
commonRoutes.post("/uploadAdminFile", [auth1], imageFunc.uploadSingleImage);
commonRoutes.post("/uploadMultipleFiles", [authenti], imageFunc.uploadMultipleFiles);
commonRoutes.post("/uploadMultiFiles", [auth1], imageFunc.uploadAdminMultipleFiles);
commonRoutes.post("/uploadVideo", [authenti], imageFunc.uploadVideoFile);
commonRoutes.post("/uploadJD", [authenti], imageFunc.uploadJd);
commonRoutes.post("/deleteSingleFile", [authenti], imageFunc.deleteSingleFile);
commonRoutes.post("/deletefile", [auth1], imageFunc.deleteSingleFile);
commonRoutes.get(
	"/getDashboardWidgets",
	authCommon,
	commonFunc.getDashboardData
);

imageRoutes.post("/uploadFile", authenti, imageFunc.uploadImageAndroid);

candidateRoutes.get("/profileDetail", authenti, candidateFunc.getProfileDetail);
candidateRoutes.post("/register", authenti, candidateFunc.register);
candidateRoutes.post("/changeMobile", authenti, candidateFunc.changeMobile);
candidateRoutes.post("/changeImage", authenti, candidateFunc.changeImage);
candidateRoutes.post(
	"/completeProfile",
	authenti,
	candidateFunc.completeProfile
);
candidateRoutes.get("/profile", authenti, candidateFunc.profileDetail);
candidateRoutes.get(
	"/getCareerObjective",
	authenti,
	candidateFunc.getCareerObjective
);
candidateRoutes.post(
	"/updateCareerObjective",
	authenti,
	candidateFunc.updateCareerObjective
);
candidateRoutes.get("/getSkill", authenti, candidateFunc.getSkill);
candidateRoutes.post("/updateSkill", authenti, candidateFunc.updateSkill);
candidateRoutes.get("/getInterest", authenti, candidateFunc.getInterest);
candidateRoutes.post("/updateInterest", authenti, candidateFunc.updateInterest);

collegeTodoRoutes.get("/", authCollege, collegeTodoFunc.getList);
collegeTodoRoutes.get("/:id", authCollege, collegeTodoFunc.todoData);
collegeTodoRoutes.post("/", authCollege, collegeTodoFunc.addTodo);
collegeTodoRoutes.put("/", authCollege, collegeTodoFunc.updateTodo);

smsTemplateRoutes.get("/", authCollege, smsTemplateFunc.getList);
smsTemplateRoutes.get("/:id", authCollege, smsTemplateFunc.smsData);
smsTemplateRoutes.post("/", authCollege, smsTemplateFunc.addSms);
smsTemplateRoutes.put("/", authCollege, smsTemplateFunc.updateSms);
smsTemplateRoutes.patch("/", authCollege, smsTemplateFunc.updateStatus);

qualificationAdminRoutes.get("/", authCommon, qualificationAdminFunc.getList);
qualificationAdminRoutes.get(
	"/:id",
	authCommon,
	qualificationAdminFunc.qualificationData
);
qualificationAdminRoutes.post(
	"/",
	authCommon,
	qualificationAdminFunc.addQualification
);
qualificationAdminRoutes.put(
	"/",
	authCommon,
	qualificationAdminFunc.updateQualification
);
qualificationAdminRoutes.patch(
	"/",
	authCommon,
	qualificationAdminFunc.updateStatus
);

subQualificationAdminRoutes.get(
	"/",
	authCommon,
	subQualificationAdminFunc.getList
);
subQualificationAdminRoutes.get(
	"/:id",
	authCommon,
	subQualificationAdminFunc.subQualificationData
);
subQualificationAdminRoutes.post(
	"/",
	authCommon,
	subQualificationAdminFunc.addSubQualification
);
subQualificationAdminRoutes.put(
	"/",
	authCommon,
	subQualificationAdminFunc.updateSubQualification
);
subQualificationAdminRoutes.patch(
	"/",
	authCommon,
	subQualificationAdminFunc.updateStatus
);

collegeCandidateRoutes.post(
	"/add",
	authCollege,
	collegeCandidateFunc.addCandidate
);
collegeCandidateRoutes.get(
	"/",
	authCollege,
	collegeCandidateFunc.getActiveCandidate
);
collegeCandidateRoutes.patch(
	"/",
	authCollege,
	collegeCandidateFunc.candidateStatus
);
collegeCandidateRoutes.get(
	"/:id",
	authCollege,
	collegeCandidateFunc.candidateData
);
collegeCandidateRoutes.get(
	"/InactiveCandidate",
	authCollege,
	collegeCandidateFunc.getInactiveCandidate
);
collegeCandidateRoutes.put(
	"/",
	authCollege,
	collegeCandidateFunc.candidateUpdate
);

collegeCompanyRoutes.get("/", authCollege, collegeCompanyFunc.allCompanies);

qualificationRoutes.get("/", authenti, qualificationFunc.getQualification);
qualificationRoutes.post("/add", authenti, qualificationFunc.addQualification);
qualificationRoutes.get(
	"/:id",
	authenti,
	qualificationFunc.qualificationDetail
);
qualificationRoutes.post(
	"/update",
	authenti,
	qualificationFunc.qualificationUpdate
);
qualificationRoutes.delete(
	"/delete/:id",
	authenti,
	qualificationFunc.qualificationDelete
);

careerRoutes.get("/", authenti, careerFunc.getCareers);
careerRoutes.post("/add", authenti, careerFunc.addCareer);
careerRoutes.get("/:id", authenti, careerFunc.careerDetail);
careerRoutes.post("/update", authenti, careerFunc.careerUpdate);
careerRoutes.delete("/delete/:id", authenti, careerFunc.careerDelete);
careerRoutes.get("/all/careerObjectives", authenti, careerFunc.getAllCareer);

projectRoutes.get("/", authenti, projectFunc.getProjects);
projectRoutes.post("/add", authenti, projectFunc.addProject);
projectRoutes.get("/:id", authenti, projectFunc.projectDetail);
projectRoutes.post("/update", authenti, projectFunc.projectUpdate);
projectRoutes.delete("/delete/:id", authenti, projectFunc.projectDelete);

referenceRoutes.get("/", authenti, referenceFunc.getReferences);
referenceRoutes.post("/add", authenti, referenceFunc.addReference);
referenceRoutes.get("/:id", authenti, referenceFunc.referenceDetail);
referenceRoutes.post("/update", authenti, referenceFunc.referenceUpdate);
referenceRoutes.delete("/delete/:id", authenti, referenceFunc.referenceDelete);

apiRoutes.use("/", commonRoutes);
apiRoutes.use("/image", imageRoutes);
apiRoutes.use("/candidate", candidateRoutes);
apiRoutes.use("/career", careerRoutes);
apiRoutes.use("/project", projectRoutes);
apiRoutes.use("/reference", referenceRoutes);
apiRoutes.use("/collegeTodo", collegeTodoRoutes);
apiRoutes.use("/collegeCandidate", collegeCandidateRoutes);
apiRoutes.use("/collegeCompanies", collegeCompanyRoutes);
apiRoutes.use("/qualification", qualificationRoutes);
apiRoutes.use("/qualificationAdmin", qualificationAdminRoutes);
apiRoutes.use("/subQualificationAdmin", subQualificationAdminRoutes);
apiRoutes.use("/smsTemplates", smsTemplateRoutes);

module.exports = apiRoutes;