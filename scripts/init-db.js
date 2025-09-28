#!/usr/bin/env node

/**
 * Database Initialization Script
 * This script initializes the database schema and creates the default admin user
 */

import { execSync } from 'child_process';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';

const DEFAULT_ADMIN = {
  email: 'admin@email.com',
  username: 'admin',
  password: 'admin',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
};

async function initializeDatabase() {
  console.log('🚀 Initializing database...');
  
  try {
    // Step 1: Push database schema
    console.log('📋 Creating database schema...');
    execSync('npm run db:push', { stdio: 'inherit' });
    console.log('✅ Database schema created successfully');
    
    // Step 2: Create admin user
    console.log('👤 Creating default admin user...');
    await createAdminUser();
    console.log('✅ Admin user created successfully');
    
    console.log('🎉 Database initialization completed!');
    console.log('');
    console.log('🔐 Default login credentials:');
    console.log(`   Email: ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log('');
    console.log('⚠️  Remember to change the default password after first login!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

async function createAdminUser() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Check if admin user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [DEFAULT_ADMIN.email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('ℹ️  Admin user already exists, skipping creation');
      return;
    }
    
    // Create password hash
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    
    // Insert admin user
    await pool.query(`
      INSERT INTO users (email, username, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      DEFAULT_ADMIN.email,
      DEFAULT_ADMIN.username,
      passwordHash,
      DEFAULT_ADMIN.firstName,
      DEFAULT_ADMIN.lastName,
      DEFAULT_ADMIN.role
    ]);
    
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
}

export { initializeDatabase };