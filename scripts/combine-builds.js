const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const frontendBuild = path.join(__dirname, '..', 'frontend', 'build');
const adminBuild = path.join(__dirname, '..', 'admin', 'dist');

// Clean dist directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}

// Copy frontend build to dist root
copyRecursive(frontendBuild, distDir);

// Copy admin build to dist/admin
const adminDist = path.join(distDir, 'admin');
copyRecursive(adminBuild, adminDist);

console.log('Builds combined successfully!');
console.log(`- Frontend: ${frontendBuild} -> ${distDir}`);
console.log(`- Admin: ${adminBuild} -> ${adminDist}`);

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source directory not found: ${src}`);
    process.exit(1);
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}