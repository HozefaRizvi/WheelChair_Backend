// Import required modules
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Notification = require('../models/Notifications');
const router = express.Router();
const loginLimiter = require('../Middleware/loginLimiter ');
const authMiddleware = require('../Middleware/authmiddleware');
const dotenv = require("dotenv");
dotenv.config();

// Function to create a notification
const createNotification = async (notificationBody, notificationTo) => {
  try {
    const notification = new Notification({
      notificationBody,
      notificationTo,
    });
    await notification.save();
    console.log("Notification saved", notification);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Signup Route with myPhoneNumber
router.post('/signup', async (req, res) => {
  const {
    name,
    email,
    password,
    usertype,
    disabilityType,
    familyPhoneNumber,
    currentLocation,
    disableFamilyPersonPhoneNumber,
    myPhoneNumber,
  } = req.body;

  try {
    // Normalize phone numbers
    const normalizePhoneNumber = (phone) => phone.replace(/\s+/g, '').replace(/-/g, '');

    const normalizedFamilyPhoneNumber = familyPhoneNumber ? normalizePhoneNumber(familyPhoneNumber) : null;
    const normalizedDisableFamilyPhoneNumber = disableFamilyPersonPhoneNumber
      ? normalizePhoneNumber(disableFamilyPersonPhoneNumber)
      : null;
    const normalizedMyPhoneNumber = myPhoneNumber ? normalizePhoneNumber(myPhoneNumber) : null;

    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      usertype,
      disabilityType: usertype === 'disabled' ? disabilityType : undefined,
      familyPhoneNumber: usertype === 'disabled' ? normalizedFamilyPhoneNumber : undefined,
      currentLocation: usertype === 'disabled' ? currentLocation : undefined,
      disableFamilyPersonPhoneNumber: usertype === 'family' ? normalizedDisableFamilyPhoneNumber : undefined,
      myPhoneNumber: normalizedMyPhoneNumber, // Save normalized phone number
    });

    await user.save();

    // Notification logic based on normalized phone numbers
    if (usertype === 'disabled' && normalizedFamilyPhoneNumber) {
      const familyMember = await User.findOne({ myPhoneNumber: normalizedFamilyPhoneNumber });
      if (familyMember) {
        await createNotification(`${name} has added you as a family member.`, familyMember._id);
      }
    } else if (usertype === 'family' && normalizedDisableFamilyPhoneNumber) {
      const disabledUser = await User.findOne({ myPhoneNumber: normalizedDisableFamilyPhoneNumber });
      if (disabledUser) {
        await createNotification(`${name} has added you as a family member.`, disabledUser._id);
      }
    }

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


// Get family members or linked disabled user
router.get('/myfamilymembers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Fetch linked members based on usertype
    let linkedUsers;
    if (user.usertype === 'disabled') {
      linkedUsers = await User.find({ disableFamilyPersonPhoneNumber: user.myPhoneNumber })
        .select('-password -__v');
    } else if (user.usertype === 'family') {
      linkedUsers = await User.find({ familyPhoneNumber: user.myPhoneNumber })
        .select('-password -__v');
    } else {
      return res.status(400).json({ message: 'Invalid user type.' });
    }

    // If no linked users are found
    if (!linkedUsers || linkedUsers.length === 0) {
      return res.status(404).json({ message: 'No linked members found.' });
    }

    res.status(200).json(linkedUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Login Route
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Verify the password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate a token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '6d' });

    // Construct response data
    const responseData = {
      name: user.name,
      usertype: user.usertype,
      email: user.email,
      token,
      userId: user._id,
    };

    if (user.usertype === 'disabled') {
      responseData.disabilityType = user.disabilityType;
    }

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Reset Password Route
router.post('/resetpassword', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route to get notifications
router.get('/notifications/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch notifications for the given user ID
    const notifications = await Notification.find({ notificationTo: id })
      .sort({ createdAt: -1 })
      .select('-__v');

    // If no notifications are found
    if (!notifications.length) {
      return res.status(404).json({ message: 'No notifications found for this user.' });
    }

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});
router.put('/update-location', async (req, res) => {
  const { _id, longitude, latitude } = req.body;

  if (!_id || longitude === undefined || latitude === undefined) {
    return res.status(400).json({ message: 'Missing required fields: _id, longitude, or latitude.' });
  }

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.currentLocation = { longitude, latitude };
    await user.save();
    createNotification(`Your Location has been updated`, _id);
    res.status(200).json({ message: 'Location updated successfully.', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error });
  }
});

// Export the router
module.exports = router;
