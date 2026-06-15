require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/User');

async function createAdmin() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@example.com' });
    if (existing) {
        console.log('Admin already exists');
        await mongoose.disconnect();
        return;
    }

    const hash = await bcrypt.hash('admin123', 10);
    await User.create({
        email: 'admin@example.com',
        password: hash,
        storage_type: 'mongodb',
        role: 'admin'
    });

    console.log('Admin created: admin@example.com / admin123');
    await mongoose.disconnect();
}

createAdmin().catch(console.error);