#!/usr/bin/env node

/**
 * Test script to verify environment variables are loaded correctly
 * Run with: node scripts/test-env.js
 */

import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

console.log('🔍 Environment Variables Test');
console.log('=============================\n');

// Test Shiprocket variables
const shiprocketEmail = process.env.SHIPROCKET_EMAIL;
const shiprocketPassword = process.env.SHIPROCKET_PASSWORD;

console.log('Shiprocket Configuration:');
console.log(`  SHIPROCKET_EMAIL: ${shiprocketEmail ? '✅ Set' : '❌ Missing'}`);
console.log(`  SHIPROCKET_PASSWORD: ${shiprocketPassword ? '✅ Set' : '❌ Missing'}`);

if (!shiprocketEmail || !shiprocketPassword) {
  console.log('\n⚠️  Missing Shiprocket credentials!');
  console.log('Please add these to your .env file:');
  console.log('  SHIPROCKET_EMAIL=your-email@example.com');
  console.log('  SHIPROCKET_PASSWORD=your-password');
  console.log('\nYou can copy from env.example file.');
} else {
  console.log('\n✅ Shiprocket credentials are configured!');
}

// Test other important variables
const nodeEnv = process.env.NODE_ENV;
const port = process.env.PORT;
const mongoUri = process.env.MONGODB_URI;

console.log('\nOther Configuration:');
console.log(`  NODE_ENV: ${nodeEnv || '❌ Missing'}`);
console.log(`  PORT: ${port || '❌ Missing'}`);
console.log(`  MONGODB_URI: ${mongoUri ? '✅ Set' : '❌ Missing'}`);

// Test Shiprocket API connection (if credentials are available)
if (shiprocketEmail && shiprocketPassword) {
  console.log('\n🔗 Testing Shiprocket API connection...');
  
  const postData = JSON.stringify({
    email: shiprocketEmail,
    password: shiprocketPassword
  });
  
  const options = {
    hostname: 'apiv2.shiprocket.in',
    port: 443,
    path: '/v1/external/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (res.statusCode === 200 && response.token) {
          console.log('✅ Shiprocket API connection successful!');
          console.log('✅ Authentication working properly.');
        } else if (res.statusCode === 403) {
          console.log('❌ Shiprocket API returned 403 - Permission denied');
          console.log('   This usually means:');
          console.log('   - Account needs API permissions enabled');
          console.log('   - Contact Shiprocket support');
        } else if (res.statusCode === 401) {
          console.log('❌ Shiprocket API returned 401 - Invalid credentials');
          console.log('   Please check your email and password.');
        } else {
          console.log(`❌ Shiprocket API returned ${res.statusCode}`);
          console.log('   Response:', response);
        }
      } catch (e) {
        console.log('❌ Failed to parse API response');
        console.log('   Raw response:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.log('❌ Network error:', e.message);
  });
  
  req.write(postData);
  req.end();
} else {
  console.log('\n⚠️  Skipping API test - credentials not configured');
}

console.log('\n📝 Next Steps:');
console.log('1. If credentials are missing, add them to .env file');
console.log('2. Restart your server: npm run dev');
console.log('3. Check the logs for authentication status');
console.log('4. If 403 errors persist, contact Shiprocket support'); 