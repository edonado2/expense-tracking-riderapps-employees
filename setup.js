const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Uber Usage Calculator...\n');

// Create necessary directories
const directories = [
  'server/data',
  'client/public'
];

directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Create environment files if they don't exist
const envFiles = [
  {
    path: 'server/.env',
    content: `PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development`
  },
  {
    path: 'client/.env',
    content: `REACT_APP_API_URL=http://localhost:5000/api`
  }
];

envFiles.forEach(env => {
  if (!fs.existsSync(env.path)) {
    fs.writeFileSync(env.path, env.content);
    console.log(`✅ Created environment file: ${env.path}`);
  }
});

console.log('\n📦 Installing dependencies...\n');

try {
  // Install root dependencies
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Install server dependencies
  console.log('\nInstalling server dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });

  // Install client dependencies
  console.log('\nInstalling client dependencies...');
  execSync('cd client && npm install', { stdio: 'inherit' });

  console.log('\n🎉 Setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the environment files in server/.env and client/.env');
  console.log('2. Run "npm run dev" to start the application');
  console.log('3. Open http://localhost:3000 in your browser');
  console.log('\n🔑 Default login credentials:');
  console.log('Admin: admin@company.com / admin123');
  console.log('Employee: employee@company.com / employee123');

} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
}
