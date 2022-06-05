const Jimp = require("jimp");
const path = require("path");
const UserDto = require("../dtos/user-dto");
const userService = require("../services/user-service");

class ActivateController {
	async activate(req, res) {
		const { name, photo } = req.body;

		if (!name || !photo) {
			res.status(400).json({
				message: "all fields are required",
			});
		}

		// store image (base64)
		const buffer = Buffer.from(
			photo.replace(/^data:image\/(png|jpg|jpeg);base64,/, ""),
			"base64"
		);

		const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;

		// compress image before storing
		try {
			const jimpResponse = await Jimp.read(buffer);

			jimpResponse
				.resize(150, Jimp.AUTO)
				.write(path.resolve(__dirname, `../storage/${imagePath}`));  
		} catch (err) {
			res.status(500).json({
				message: "could not process image",
			});
		}

		const userId = req.user._id;
		// update user
		try {
			const user = await userService.findUser({ _id:userId});
			if (!user) {
				return res.status(404).json({
					message: "user not found",
				});
			}
			
			user.activated = true;
			user.name = name;
			user.photo= `/storage/${imagePath}`;
			
			await user.save();

			res.json({
				user: new UserDto(user),
				auth: true,
			});
		} catch (err) {
			res.status(500).json({
				message: "something went wrong",
			});
		}
	}
}

module.exports = new ActivateController();
