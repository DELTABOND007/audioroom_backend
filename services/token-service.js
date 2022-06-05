const jwt = require("jsonwebtoken");
const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
const refreshTokenSecret=process.env.JWT_REFRESH_TOKEN_SECRET;
const RefreshModel=require('../models/refresh-model')
class TokenService {
	generateToken(payload) {
		const accessToken = jwt.sign(payload, accessTokenSecret, {
			expiresIn: "1m", //for 1min
		});

		const refreshToken = jwt.sign(payload, refreshTokenSecret, {
			expiresIn: "5d" // 5 days
		});
		
		return {accessToken,refreshToken};
	}

	async storeRefreshToken(token, userId) {
		try {
			await RefreshModel.create({
				token,
				userId //it should be userId
			});
		} catch (err) {
			console.log(err);
		}
	}
	async verifyAccessToken(token) {
		return jwt.verify(token, accessTokenSecret);
	}
	async verifyRefreshToken(token) {
		return jwt.verify(token, refreshTokenSecret);
	}
	async findRefreshToken(userId, refreshToken) {
		return await RefreshModel.findOne({
			userId: userId,
			token: refreshToken
		});
	}

	async updateRefreshToken(userId,refreshToken) {
		return await RefreshModel.findOneAndUpdate(
			{ userId: userId },
			{ token: refreshToken },
			//{ new: true }
		);
	}

	async removeToken(refreshToken) {
		return await RefreshModel.findOneAndDelete({ token: refreshToken });
	}
}

module.exports = new TokenService();
