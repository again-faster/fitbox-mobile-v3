const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

// Read the current version number from package.json
const version = packageJson.version;

// ===== ANDROID VERSION UPDATE =====
const updateAndroidVersion = () => {
  const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
  let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');

  // Update versionName
  buildGradleContent = buildGradleContent.replace(/versionName ".*?"/, `versionName "${version}"`);

  // Increment versionCode
  const currentVersionCodeMatch = buildGradleContent.match(/versionCode (\d+)/);
  const currentVersionCode = currentVersionCodeMatch ? parseInt(currentVersionCodeMatch[1], 10) : 1;
  const newVersionCode = currentVersionCode + 1;
  buildGradleContent = buildGradleContent.replace(/versionCode \d+/, `versionCode ${newVersionCode}`);

  // Write the updated content back to build.gradle
  fs.writeFileSync(buildGradlePath, buildGradleContent, 'utf8');
  console.log(`Android: Updated versionCode to ${newVersionCode}, versionName to ${version}`);
};

// ===== iOS VERSION UPDATE =====
const updateIOSVersion = () => {
  const infoPlistPath = path.join(__dirname, '..', 'ios', 'fitbox', 'Info.plist');
  let infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');

  // Update CFBundleShortVersionString
  infoPlistContent = infoPlistContent.replace(/<key>CFBundleShortVersionString<\/key>\s*<string>.*?<\/string>/,
    `<key>CFBundleShortVersionString</key><string>${version}</string>`);

  // Increment CFBundleVersion
  const currentBuildNumberMatch = infoPlistContent.match(/<key>CFBundleVersion<\/key>\s*<string>(\d+)<\/string>/);
  const currentBuildNumber = currentBuildNumberMatch ? parseInt(currentBuildNumberMatch[1], 10) : 1;
  const newBuildNumber = currentBuildNumber + 1;
  infoPlistContent = infoPlistContent.replace(/<key>CFBundleVersion<\/key>\s*<string>\d+<\/string>/,
    `<key>CFBundleVersion</key><string>${newBuildNumber}</string>`);

  // Write the updated content back to Info.plist
  fs.writeFileSync(infoPlistPath, infoPlistContent, 'utf8');
  console.log(`iOS: Updated CFBundleVersion to ${newBuildNumber}, CFBundleShortVersionString to ${version}`);
};

// ===== GIT COMMIT AND TAG =====
const commitAndTag = () => {
  try {
    // Add all modified files to staging
    execSync('git add .', { stdio: 'inherit' });

    // Amend the most recent commit (no new commit)
    execSync('git commit --amend --no-edit', { stdio: 'inherit' });

    console.log(`Successfully amended version ${version}`);
  } catch (error) {
    console.error('Error during git operations:', error.message);
  }
};

// ===== RUN UPDATES =====
updateAndroidVersion();
updateIOSVersion();
commitAndTag();
console.log('Version updates and git operations completed successfully!');
