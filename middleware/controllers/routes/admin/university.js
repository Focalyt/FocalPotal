const express = require("express");
const { University } = require("../../models");
const { isAdmin } = require("../../../helpers");
const router = express.Router();
router.use(isAdmin);
const university = [
	"University of Delhi",
	"Indian Institute of Technology Bombay",
	"Indian Institute of Technology Kanpur",
	"Indian Institute of Technology Madras",
	"Indian Institute of Technology Delhi",
	"Indian Institute of Technology Kharagpur",
	"Indian Institute of Science",
	"Jawaharlal Nehru University",
	"Savitribai Phule Pune University",
	"Vellore Institute of Technology",
	"Manipal Academy of Higher Education",
	"Amrita Vishwa Vidyapeetham",
	"Narendra Dev University of Agriculture and Technology",
	"Amity University",
	"International Institute of Information Technology, Hyderabad",
	"Narsee Monjee Institute of Management and Higher Studies",
	"Birla Institute of Technology and Science",
	"Anna University",
	"Lovely Professional University",
	"All India Institute of Medical Sciences Delhi",
	"SRM Institute of Science and Technology",
	"Tata Institute of Fundamental Research",
	"University of Mumbai",
	"Indian Institute of Technology Guwahati",
	"Tata Institute of Social Sciences",
	"Chandigarh University",
	"University of Lucknow",
	"Jamia Millia Islamia",
	"Tamil Nadu Agricultural University",
	"Indian Statistical Institute",
	"National Institute of Mental Health and Neuro Sciences",
	"Indian Institute of Technology Roorkee",
	"Banaras Hindu University",
	"Panjab University",
	"Bangalore University",
	"Christ University",
	"University of Madras",
	"National Institute of Design",
	"Osmania University",
	"Dr. A.P.J. Abdul Kalam Technical University",
	"Aligarh Muslim University",
	"Baba Ghulam Shah Badhshah University",
	"Gujarat Technological University",
	"National Institute of Fashion Technology",
	"Guru Gobind Singh Indraprastha University",
	"Kurukshetra University",
	"Visvesvaraya Technological University",
	"CSK Himachal Pradesh Krishi Vishvavidyalaya",
	"Cochin University of Science and Technology",
	"University of Calcutta",
	"Chaudhary Charan Singh Haryana Agricultural University",
	"National Institute of Technology, Tiruchirappalli",
	"National Institute of Technology, Rourkela",
	"Indian Institute of Technology Gandhinagar",
	"Indian Institute of Technology Hyderabad",
	"University of Petroleum and Energy Studies",
	"Gandhi Institute of Technology and Management",
	"Chitkara University, Punjab",
	"University of Allahabad",
	"The Maharaja Sayajirao University of Baroda",
	"University of Hyderabad",
	"University of Rajasthan",
	"University of Mysore",
	"University of Engineering and Management, Kolkata",
	"Sharda University",
	"Gulbarga University",
	"Maulana Abul Kalam Azad University of Technology, West Bengal",
	"Chhatrapati Shahu Ji Maharaj University",
	"Birla Institute of Technology",
	"Jadavpur University",
	"University of Kerala",
	"National Institute of Technology, Silchar",
	"Nirma University",
	"KIIT University",
	"Tamil Nadu Veterinary and Animal Sciences University",
	"SASTRA University",
	"Jawaharlal Nehru Technological University",
	"International Institute of Information Technology Bangalore",
	"Mahatma Gandhi University",
	"Post Graduate Institute of Medical Education and Research",
	"National Institute of Technology, Calicut",
	"National Institute of Technology, Karnataka",
	"Chennai Mathematical Institute",
	"Indian Maritime University",
	"Gauhati University",
	"Thapar Institute of Engineering and Technology",
	"Indian Institute of Information Technology Allahabad",
	"Madurai Kamaraj University",
	"National Law School of India University",
	"Jain University",
	"O.P. Jindal Global University",
	"Patna University",
	"Lalit Narayan Mithila University",
	"Delhi Technological University",
	"APJ Abdul Kalam Technological University",
	"Indian Institute of Foreign Trade",
	"Indian Institute of Science Education and Research, Pune",
	"Rajiv Gandhi Proudyogiki Vishwavidyalaya",
	"Chaudhary Charan Singh University",
	"Devi Ahilya Vishwavidyalaya",
	"Indian School of Mines",
	"Ashoka University",
	"Indira Gandhi Institute of Development Research",
	"Indian Institute of Technology, BHU",
	"Alagappa University",
	"Motilal Nehru National Institute of Technology Allahabad",
	"Guru Nanak Dev University",
	"University of Calicut",
	"North Eastern Hill University",
	"Tamil Nadu Teacher Education University",
	"Azim Premji University",
	"Annamalai University",
	"Andhra University",
	"Jawaharlal Nehru Centre for Advanced Scientific Research",
	"Jawaharlal Institute of Postgraduate Medical Education and Research",
	"Indian Institute of Technology Mandi",
	"Symbiosis International University",
	"Veer Narmad South Gujarat University",
	"Malaviya National Institute of Technology, Jaipur",
	"Kerala Agricultural University",
	"Bharathiar University",
	"Dr. B R Ambedkar National Institute of Technology Jalandhar",
	"Indraprastha Institute of Information Technology",
	"University of Burdwan",
	"Gujarat University",
	"Pondicherry University",
	"CEPT University",
	"Shiv Nadar University",
	"K L University",
	"Govind Ballabh Pant University of Agriculture and Technology",
];

router
	.route("/")
	.get(async (req, res) => {
		try {
			let view = false
		if(req.session.user.role === 10){
			view = true
		}
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const uniName = "";
			const count = await University.countDocuments({});

			const universities = await University.find({})
				.select("name status type")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/universitySetting`, {
				uniName,
				universities,
				perPage,
				totalPages,
				page,
				university,
				menu:'university',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	// .post(async (req, res) => {
	// 	try {
	// 		const { name } = req.body;
	// 		console.log("-------------------");
	// 		console.log(req.body);
	// 		const university = await University.findOne({ name });

	// 		if (university) throw req.ykError("University already exist!");
	// 		University.create({ name });
	// 		req.flash("success", "University added successfully!");
	// 		return res.redirect("/admin/university");
	// 	} catch (err) {
	// 		req.flash("error", err.message || "Something went wrong!");
	// 		return res.redirect("back");
	// 	}
	// });
	.post(async (req, res) => {
        try {
            const { name, name1 } = req.body;
            if (name1) {
                const university = await University.findOne({
                    name1,
					
                });
                if (university) throw req.ykError("University already exist!");
                const createCustom = await University.create({
                    type: true,
                    name: name1,
                });
            }
            if (name) {
                const university1 = await University.findOne({
                    name,
                });
                if (university1) throw req.ykError("University already exist!");
                const createCustom = await University.create({
                    name: name,
                });
            }
            // if (university1) throw req.ykError("University already exist!");
            // University.create({ name1 });
            req.flash("success", "University added successfully!");
            return res.redirect("/admin/university");
        } catch (err) {
            req.flash("error", err.message || "Something went wrong!");
            return res.redirect("back");
        }
    });
router
	.route("/edit/:id")
	.get(async (req, res) => {
		try {
			let view = false
		if(req.session.user.role === 10){
			view = true
		}
			const perPage = 5;
			const p = parseInt(req.query.page, 10);
			const page = p || 1;
			const uniData = await University.findById(req.params.id).select(
				"name"
			);
			const uniName = uniData.name ? uniData.name : "";
			const count = await University.countDocuments({});
			const universities = await University.find({})
				.select("name status")
				.sort({ createdAt: -1 })
				.skip(perPage * page - perPage)
				.limit(perPage);
			const totalPages = Math.ceil(count / perPage);
			return res.render(`${req.vPath}/admin/universitySetting`, {
				universities,
				uniName,
				perPage,
				totalPages,
				page,
				university,
				menu:'university',
				view
			});
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(async (req, res) => {
		try {
			const { name } = req.body;

			const uni = await University.findOne({
				_id: { $ne: req.params.id },
				name,
			});
			if (uni) throw new Error("University already exist!");
			const pdata = await University.findByIdAndUpdate(
				req.params.id,
				{ name },
				{ new: true }
			);
			if (!pdata) req.ykError("University not update now!");
			req.flash("success", "University updated successfully!");
			return res.redirect("/admin/university");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

module.exports = router;
