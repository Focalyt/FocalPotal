const promisify=require('util');
const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const methodOverride = require("method-override");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const moment = require("moment");
const flash = require("connect-flash");
const session = require("cookie-session");
const expSanitizer = require("express-sanitizer");
const path = require("path");
const http = require("http");
const fileupload = require("express-fileupload");
const tunnel=require('tunnel-ssh');
const {v4:uuidv4}=require('uuid');
const axios = require("axios");
//upload('
NODE_TLS_REJECT_UNAUTHORIZED = "0";
const {
	port,
	env,
	mongodbUri,
	ykError,
	cookieSecret,
	msg91AuthKey,
	blackListIps
} = require("./config");

const app = express();
const server = http.createServer(app);
const sess = {
	maxAge: 1000 * 60 * 60 * 24 * 30,
	keys: [cookieSecret]
};
const viewsPath = path.resolve(__dirname, "views");
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);
mongoose.connect(mongodbUri, (err) => {
	if (err) ykError(err);
	server.listen(port, () => {
		console.log(`connected ${port}`);
		process.send = process.send || ((f) => f);
		process.send("ready");
	});
},
{socketTimeoutMS : 300000}
);

mongoose.Promise = global.Promise;

process.on("SIGINT", () => {
	server.close((err) => {
		if (err) process.exit(1);
		mongoose.connection.close(() => process.exit(0));
	});
});

// Middleware to block a specific IP address
const blockIPMiddleware = (req, res, next) => {
	const ipAddress = req.header('x-forwarded-for') || req.socket.remoteAddress || req.ipAddress;
	let blacklist =  blackListIps?.split(',')
	if(blacklist?.includes(ipAddress)){
		console.log('blacklist=== ', blacklist, ipAddress)
    // IP address is blocked, 
    return res.status(200).send('');
  }

  // IP address is not blocked, proceed to the next middleware or route handler
  next();
};

app.set("view engine", "ejs");
app.use(blockIPMiddleware);
app.use(express.static(path.resolve(__dirname, "public")));
app.use(session(sess));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "15mb" }));
app.use(expSanitizer());
app.use(methodOverride());
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(flash());
app.use(fileupload());
app.use((req, res, next) => {		
	res.locals.currentUser = req.session.user;
	res.locals.companyUser = req.session.company;
	res.locals.collegeUser = req.session.college;
	res.locals.candidateUser = req.session.candidate;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	res.locals.info = req.flash("info");
	res.locals.formData = req.session.formData;
	res.locals.moment = moment;
	req.vPath = viewsPath;
	req.errFunc = (error) => {
		let err = error;
		if (typeof error !== "object") err = req.ykError(error);
		let { message } = err;
		if (err.name === "CastError" && err.value === req.params.id)
			message = "Invalid unique ID";
		return res.status(200).send({ status: false, message });
	};
	req.requireFields = (data, obj) => {
		const mFields = Object.keys(obj).filter((x) => !data[x]);
		if (mFields.length === 0) return null;
		return `${obj[mFields[0]]} is required!`;
	};
	req.ykError = ykError;
	req.msg91Options = {
		method: "POST",
		hostname: "api.msg91.com",
		port: null,
		path: "/api/v2/sendsms",
		headers: {
			authkey: msg91AuthKey,
			"content-type": "application/json",
		},
	};
	next();
});

if (env !== "production") app.use(morgan("dev"));
const routes = require("./controllers/routes");
const helperRoutes = require("./helpers");

app.use("/", routes);
app.use("/admin/helper", helperRoutes);
app.use("/panel/helper", helperRoutes);

app.use(express.static(path.join(__dirname, "/angular-app/")));
// app.use(/^((?!(api|public|helper|app-assets)).)*/, (req, res) => {
//   res.sendFile(path.join(__dirname, '/angular-app/index.html'));
// });

// app.use("/app", (req, res) => {
// 	res.sendFile(path.join(__dirname, "/angular-app/index.html"));
// });

app.get("*", (req, res) =>
	res.status(200).send({ status: false, message: "Page not found!" })
);