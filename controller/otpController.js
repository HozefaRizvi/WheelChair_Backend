const otpGenerator = require('otp-generator');
const OTP = require('../models/OTPModel');
const User = require('../models/User');

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user is registered
    const checkUserPresent = await User.findOne({ email });

    let otp;  // Declare otp variable here
    if (!checkUserPresent) {
      return res.status(404).json({
        success: false,
        message: 'Email does not exist',
      });
    }
    // If user is found, proceed with OTP generation
    if (checkUserPresent) {
      otp = otpGenerator.generate(4, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
    }
    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp,
      email
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
