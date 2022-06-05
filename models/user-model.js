const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		phone: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			lowercase: true,
			trim: true
		},
		name: {
			type: String,
			required: false,
		},
		photo: {
			type: String,
			required: false,
			get: (photo) => {
				if (photo) {
					return `${process.env.BASE_URL}${photo}`;
				}
				return photo;
			},
		},
		activated: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
		toJSON: { getters: true },
	}
);

module.exports = mongoose.model("User", userSchema, "users");
