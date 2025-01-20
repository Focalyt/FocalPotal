const bcrypt = require("bcryptjs");
const { sign, verify } = require("jsonwebtoken");
const { Schema, model } = require("mongoose");

const { jwtSecret } = require("../../config");

const { ObjectId } = Schema.Types;

const userSchema = new Schema(
	{
		name: { type: String, trim: true },
		email: {
			type: String,
			lowercase: true,
			trim: true,
		},
		mobile: {
			type: Number,
			trim: true,
			// unique: "Mobile number already exists!",
		},
		whatsapp: {
			type: Number,
			trim: true,
			// unique: "Mobile number already exists!",
		},
		_zone: [{ type: ObjectId, ref: "Zone" }],
		cityId: String,
		stateId: String,
		countryId: String,
		address: String,
		designation: String,
		authTokens: [String],
		password: {
			type: String,
			required: false,
		},
		passReset: {
			type: Boolean,
			default: false,
		},
		role: { type: Number, trim: true }, // 0-admin, 1-company, 2-college 3-student
		status: {
			type: Boolean,
			default: true,
		},
		isDeleted: {
			type: Boolean,
			default: false,
		},
		isImported: {
			type: Boolean,
			default: false,
		}
	},
	{ timestamps: true }
);

userSchema.pre("save", function preSave(next) {
	if (this.isModified("password")) {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(this.password, salt, (err2, hash) => {
				this.password = hash;
				next();
			});
		});
	} else {
		next();
	}
});

userSchema.methods = {
	validPassword: function validPassword(password) {
		return bcrypt.compareSync(password, this.password);
	},
	generateAuthToken: async function generateAuthToken() {
		const data = { id: this._id.toHexString() };
		const token = sign(data, jwtSecret).toString();
		if (!this.authTokens || !Array.isArray(this.authTokens))
			this.authTokens = [];
		this.authTokens.push(token);
		await this.save();
		return token;
	},
};

userSchema.statics = {
	deleteToken(token) {
		this.findOneAndUpdate(
			{ authTokens: token },
			{ $pull: { authTokens: token } }
		).exec();
	},

	findByToken(token) {
		try {
			const decoded = verify(token, jwtSeceret);
			return this.findOne({ _id: decoded.id, authTokens: token });
		} catch (err) {
			this.deleteToken(token);
			throw err;
		}
	},
};
module.exports = model("User", userSchema);
