const tokenService = require("../services/token-service");
const userService = require("../services/user-service");
//const AppError = require("../utils/AppError");

module.exports = async (req, res, next) => {
	try {
		const { accessToken } = req.cookies;

		console.log(accessToken);
		
		// if token not found in cookie
		 if (!accessToken) {
			throw new Error("token not found", 401);
		 }
		// // if token does not verify
		 const userData = await tokenService.verifyAccessToken(accessToken);
		
		
		 if (!userData) {
			throw new Error("invalid token", 401);
		}
		// // if the user associated with token no longer exist
		 //const user = await userService.findUser({ _id: userData.id });
		// if (!user) {
		// 	throw new Error("user no longer exit", 401);
		// }

		req.user = userData;
		//console.log(userData)
		next();
	} catch (err) {
		// for every error originated from here, send response code "401" so that client can invoke refresh route
		//const error = new Error(err.message, 401);
		res.status(401).json({message:"inavalid token"})
		//next();
	}
};