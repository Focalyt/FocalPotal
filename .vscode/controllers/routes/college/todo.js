const express = require("express");
const { CollegeTodo } = require("../../models");

const { isCollege, auth1 } = require("../../../helpers");

const router = express.Router();

router.use(isCollege);

router
	.route("/")
	.get(auth1, async (req, res) => {
		try {
			const todoLists = await CollegeTodo.find({ status: true });
			return res.render(`${req.vPath}/college/todo`, { todoLists });
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	})
	.post(auth1, async (req, res) => {
		try {
			const { labels, title, description, isImp, isStar } = req.body;
			// console.log('www', req.body)
			const isImportant = isImp === "true";
			const isStarred = isStar === "true";
			const todo = await CollegeTodo.create({
				title,
				labels,
				description,
				isImportant,
				isStarred,
			});
			if (!todo) throw req.ykError("Todo not created!");
			req.flash("success", "Todo added successfully!");
			return res.redirect("/college/todo");
		} catch (err) {
			req.flash("error", err.message || "Something went wrong!");
			return res.redirect("back");
		}
	});

router.get("/add", auth1, async (req, res) => {
	try {
		// console.log('2', req.body);
		req.flash("success", "Todo list added successfully!");
		return res.redirect("/college/todo");
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

router.post("/add", auth1, async (req, res) => {
	try {
		// console.log('2', req.body)
		req.flash("success", "Todo list added successfully!");
		return res.redirect("/college/todo");
	} catch (err) {
		req.flash("error", err.message || "Something went wrong!");
		return res.redirect("back");
	}
});

module.exports = router;
