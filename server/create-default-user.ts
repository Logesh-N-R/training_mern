
import { connectToDatabase } from './db';
import bcrypt from 'bcryptjs';

async function createDefaultUser() {
  try {
    console.log('Creating default super admin user...');
    const db = await connectToDatabase();
    
    // Check if any users exist
    const existingUsers = await db.collection('users').countDocuments();
    if (existingUsers > 0) {
      console.log('Users already exist, skipping creation');
      return;
    }
    
    // Create default super admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const defaultUser = {
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'superadmin',
      createdAt: new Date(),
    };
    
    await db.collection('users').insertOne(defaultUser);
    
    console.log('✅ Default super admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating default user:', error);
    process.exit(1);
  }
}

createDefaultUser();
