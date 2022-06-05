const otpService = require("../services/otp-service");
const hashService = require("../services/hash-service");
const userService = require("../services/user-service");
const tokenService = require("../services/token-service");
const UserDto = require("../dtos/user-dto");

class AuthController {
	 async sendOtp(req, res) {
		const { phone } = req.body;

		if (!phone) {
			return res.status(400).json({
				message: "phone field is required",
			});
		}

		const otp =  await otpService.generateOtp();
		const validity = 5 * 60 * 1000; // 5 minutes
		const expires = Date.now() + validity; // curr_time + 5 minutes
		const data = `${phone}.${otp}.${expires}`; //generates hash of phone otp and expire time

		const hash = hashService.hashOtp(data);

		 try {
		//await otpService.sendBySms(phone, otp);

			res.json({
				hash: `${hash}.${expires}`,
				phone,
				otp
			});
		 } catch (err) {
		 	console.log("ERR", err);

			res.status(500).json({
				message: "could not send OTP",
			});
		 }
		//res.json({hash})
	}

	async verifyOtp(req, res) {
		const { otp, phone, hash } = req.body;

		if (!phone || !otp || !hash) {
			return res.status(400).json({
				message: "all fields are required",
			});
		}

		// check the OTP
		const [hashedOtp, expires] = hash.split(".");

		if (Date.now() > +expires) {  //for converting expires strings into number explicitly
			return res.status(400).json({
				message: "OTP expired",
			});
		}

		const data = `${phone}.${otp}.${expires}`;

		const isMatched = otpService.verifyOtp(hashedOtp, data);
		if (!isMatched) {
			return res.status(400).json({
				message: "invalid OTP",
			});
		}

		// login the user or registering new user
		let user;

		try {
			user = await userService.findUser({ phone });
			if (!user) {
				user = await userService.createUser({ phone });
			}
		} catch (err) {
			console.log("ERR", err);
			return res.status(500).json({
				message: "database error",
			});
		}

		// generate jwt tokens and set as cookie
		const { accessToken, refreshToken } = tokenService.generateToken({
			_id: user._id,
			activated:false
		});

		console.log("new user", user);
		// store refreshToken into the database for given user
		await tokenService.storeRefreshToken(refreshToken, user._id);

		res.cookie("refreshToken", refreshToken, {
			maxAge: 5 * 24 * 60 * 60 * 1000, // 5 days
			httpOnly: true
		});

		res.cookie("accessToken", accessToken, {
			maxAge: 60 * 60 * 1000, // 1 hour
			httpOnly: true
		});

		 const userDto = new UserDto(user); //creating object of class

		res.json({
			status: "success",
			user: userDto,
			auth: true
		});
	//	res.json({accessToken,user})
	}

	async refresh(req, res, next) {
		// get refresh token from cookie
		const { refreshToken: refreshTokenFromCookie } = req.cookies;
		
		// check if token is valid
		let userData;
		try {
			const decoded = await tokenService.verifyRefreshToken(
				refreshTokenFromCookie
			);
			userData = decoded;
		} catch (err) {
			return res.status(401).json({message:"invalid token"})
		}
		console.log('user', userData);
		// check if token is in database
		try {
			const token = await tokenService.findRefreshToken(
				userData._id,
				refreshTokenFromCookie
			);
			console.log('token', token);
			if (!token) { //checking for token
				return res.status(401).json({message:"invalid token"})
			}
		} catch (err) {
			return res.status(500).json({message:"Internal error"})
		}
		// // check if user is valid
		const user = await userService.findUser({ _id: userData._id });
        if (!user) {
            return res.status(404).json({ message: 'No user' });
        }

		// // generate new tokens
		const { refreshToken, accessToken } = tokenService.generateToken({
			_id: userData._id
		});

		// store updated refresh token in database
		try {
			await tokenService.updateRefreshToken(userData._id, refreshToken);
		} catch (err) {
			return res.status(500).json({message:"internal error"})
		}

		// // send them as cookie
		res.cookie("refreshToken", refreshToken, {
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
			httpOnly: true,
			sameSite: "none",
			secure: true
		});

		res.cookie("accessToken", accessToken, {
			maxAge: 15 * 60 * 1000, // 15 minutes
			httpOnly: true,
			sameSite: "none",
			secure: true
		});

		res.json({
			status: "success",
			user: new UserDto(user),
			auth: true
		});
	}
	async logout(req, res) {
        const { refreshToken } = req.cookies;
        // delete refresh token from db
        await tokenService.removeToken(refreshToken);
        // delete cookies
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        res.json({ user: null, auth: false });
    }
}
// singleton pattern
module.exports = new AuthController(); //object craeted and exported.
