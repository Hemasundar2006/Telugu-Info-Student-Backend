require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const ADMIN_EMAIL = 'marothihemasundar03@gmail.com';
const ADMIN_PASSWORD = 'telugustudent';
const ADMIN_NAME = 'Admin';

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = ADMIN_EMAIL.toLowerCase();
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const result = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: ADMIN_NAME,
          email,
          password: hashedPassword,
          role: 'admin',
          isVerified: true
        }
      },
      { upsert: true, new: true }
    );

    if (result) {
      console.log(result.isNew ? 'Admin user created:' : 'Existing user updated to admin:', email);
    }
    console.log('Done. You can login with:', ADMIN_EMAIL);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
