const crypto = require("crypto");
const hashService = require("./hash-service");

const smsSid=process.env.SMS_SID;
const smsAuthToken=process.env.SMS_AUTH_TOKEN;
const twilio=require('twilio')(smsSid,smsAuthToken,{
	lazyLoading: true,

})
class OtpService {
	generateOtp() {
		// const otp = crypto.randomInt(1000, 9999);
		const otp=12345; //just fro demo peupose
		return otp;
	}

	async sendBySms(number, otp) {
		// send OTP using some 3rd party service
		const response = await twilio.messages.create({
			to: number,
			from: process.env.SMS_FROM_NUMBER,
			body: `Your OTP is ${otp}`
		});
		// console.log(`OTP (${otp}) sent to ${number}`);
		// return response;
	}

	verifyOtp(hashedOtp, data) {
		const computedHash = hashService.hashOtp(data);

		return computedHash === hashedOtp; //either returns true or false
	}
}

module.exports = new OtpService();
