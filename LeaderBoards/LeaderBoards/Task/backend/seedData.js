const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({path: "./.env.example"});

const sampleUsers = [
  { name: 'Rahul', totalPoints: 1200, avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Kamal', totalPoints: 1100, avatarUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Sanak', totalPoints: 1050, avatarUrl: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Priya', totalPoints: 980, avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Arjun', totalPoints: 950, avatarUrl: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Sneha', totalPoints: 900, avatarUrl: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Vikram', totalPoints: 850, avatarUrl: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Anita', totalPoints: 800, avatarUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Rohit', totalPoints: 750, avatarUrl: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=300' },
  { name: 'Kavya', totalPoints: 700, avatarUrl: 'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=300' }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leaderboard');
    console.log('Connected to MongoDB');
    
    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');
    
    // Insert sample users
    await User.insertMany(sampleUsers);
    console.log('Sample users inserted successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();