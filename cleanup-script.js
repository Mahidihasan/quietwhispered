#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);

// Read the analysis report
const reportPath = path.join(projectRoot, 'improved-unused-report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// Configuration
const config = {
  adminDir: path.join(projectRoot, 'admin'),
  frontendDir: path.join(projectRoot, 'frontend'),
  safeToDeletePatterns: [
    'temp_*.txt',
    'analyze-unused.js',
    'improved-analysis.js',
    'cleanup-script.js',
    'unused-code-report.json',
    'improved-unused-report.json',
    'analysis-summary.md'
  ],
  // Files that should never be deleted
  neverDeleteFiles: [
    'package.json',
    'package-lock.json',
    '.env',
    'firebase.json',
    'vercel.json',
    'firestore.rules',
    'storage.rules',
    'index.html',
    'public/index.html',
    'src/index.js',
    'src/main.jsx',
    'src/App.js',
    'src/App.jsx'
  ]
};

// Utility functions
function isSafeToDelete(filePath) {
  const relativePath = path.relative(projectRoot, filePath);

  // Check if it matches safe to delete patterns
  if (config.safeToDeletePatterns.some(pattern =>
    relativePath.includes(pattern) || path.basename(relativePath).match(pattern))) {
    return true;
  }

  // Check if it's a never-delete file
  if (config.neverDeleteFiles.some(neverDelete =>
    relativePath.includes(neverDelete) || path.basename(relativePath) === neverDelete)) {
    return false;
  }

  // Check file size - if very small, might be safe
  try {
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return true; // Empty files are safe to delete
    }
  } catch (error) {
    return false;
  }

  return false;
}

function checkFileReferences(filePath) {
  const relativePath = path.relative(projectRoot, filePath);
  const fileName = path.basename(filePath);

  // Check if file is referenced in HTML files
  const htmlFiles = [
    path.join(config.adminDir, 'index.html'),
    path.join(config.frontendDir, 'public', 'index.html')
  ];

  for (const htmlFile of htmlFiles) {
    if (fs.existsSync(htmlFile)) {
      try {
        const htmlContent = fs.readFileSync(htmlFile, 'utf8');
        if (htmlContent.includes(fileName) || htmlContent.includes(relativePath)) {
          return true;
        }
      } catch (error) {
        // Skip
      }
    }
  }

  // Check if file is referenced in CSS files
  const cssFiles = report.required
    .filter(f => f.path.endsWith('.css'))
    .map(f => path.join(projectRoot, f.path));

  for (const cssFile of cssFiles) {
    try {
      const cssContent = fs.readFileSync(cssFile, 'utf8');
      if (cssContent.includes(fileName) || cssContent.includes(relativePath)) {
        return true;
      }
    } catch (error) {
      // Skip
    }
  }

  // Check if file is referenced in configuration files
  const configFiles = [
    path.join(projectRoot, 'firebase.json'),
    path.join(projectRoot, 'vercel.json'),
    path.join(config.adminDir, 'vite.config.js'),
    path.join(config.frontendDir, 'package.json'),
    path.join(config.adminDir, 'package.json')
  ];

  for (const configFile of configFiles) {
    if (fs.existsSync(configFile)) {
      try {
        const configContent = fs.readFileSync(configFile, 'utf8');
        if (configContent.includes(fileName) || configContent.includes(relativePath)) {
          return true;
        }
      } catch (error) {
        // Skip
      }
    }
  }

  return false;
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function deleteFileSafely(filePath) {
  try {
    fs.unlinkSync(filePath);
    return { success: true, path: filePath };
  } catch (error) {
    return { success: false, path: filePath, error: error.message };
  }
}

function deleteEmptyDirectories(dir) {
  let deletedDirs = [];

  try {
    const files = fs.readdirSync(dir);
    if (files.length === 0) {
      fs.rmdirSync(dir);
      deletedDirs.push(dir);

      // Check parent directory
      const parentDir = path.dirname(dir);
      const parentDeleted = deleteEmptyDirectories(parentDir);
      deletedDirs = deletedDirs.concat(parentDeleted);
    }
  } catch (error) {
    // Directory not empty or other error
  }

  return deletedDirs;
}

function main() {
  console.log('Starting cleanup process...');

  // Categorize files for cleanup
  const filesToReview = [];
  const filesSafeToDelete = [];
  const filesToKeep = [];

  // Analyze probably unused files
  report.probablyUnused.forEach(item => {
    const filePath = path.join(projectRoot, item.path);

    if (!fs.existsSync(filePath)) {
      console.log(`File no longer exists: ${item.path}`);
      return;
    }

    // Check if file is safe to delete
    if (isSafeToDelete(filePath)) {
      filesSafeToDelete.push({
        ...item,
        path: item.path,
        fullPath: filePath,
        size: getFileSize(filePath)
      });
    }
    // Check if file is referenced elsewhere
    else if (checkFileReferences(filePath)) {
      filesToKeep.push({
        ...item,
        path: item.path,
        fullPath: filePath,
        reason: 'Referenced in HTML, CSS, or configuration'
      });
    }
    // Needs manual review
    else {
      filesToReview.push({
        ...item,
        path: item.path,
        fullPath: filePath,
        size: getFileSize(filePath)
      });
    }
  });

  console.log('\nCleanup Analysis Results:');
  console.log(`- Files safe to delete: ${filesSafeToDelete.length}`);
  console.log(`- Files needing review: ${filesToReview.length}`);
  console.log(`- Files to keep (referenced): ${filesToKeep.length}`);

  // Generate cleanup report
  const cleanupReport = {
    timestamp: new Date().toISOString(),
    filesSafeToDelete,
    filesToReview,
    filesToKeep,
    unusedDependencies: report.unusedDependencies,
    duplicateFiles: report.duplicateFiles
  };

  // Save cleanup report
  const cleanupReportPath = path.join(projectRoot, 'cleanup-report.json');
  fs.writeFileSync(cleanupReportPath, JSON.stringify(cleanupReport, null, 2));
  console.log(`\nCleanup report saved to: ${cleanupReportPath}`);

  // Generate human-readable cleanup summary
  const cleanupSummaryPath = path.join(projectRoot, 'cleanup-summary.md');
  const totalSafeSize = filesSafeToDelete.reduce((sum, file) => sum + file.size, 0);

  const summaryContent = `# Cleanup Summary

## Files Safe to Delete (${filesSafeToDelete.length} files, ${formatFileSize(totalSafeSize)})

${filesSafeToDelete.length > 0 ? '| File Path | Type | Size | Reason |' : ''}
${filesSafeToDelete.length > 0 ? '|----------|------|------|--------|' : ''}
${filesSafeToDelete.map(file => `| ${file.path} | ${file.type} | ${formatFileSize(file.size)} | ${file.reason} |`).join('\n')}

## Files Needing Manual Review (${filesToReview.length} files)

${filesToReview.length > 0 ? '| File Path | Type | Size | Reason |' : ''}
${filesToReview.length > 0 ? '|----------|------|------|--------|' : ''}
${filesToReview.slice(0, 20).map(file => `| ${file.path} | ${file.type} | ${formatFileSize(file.size)} | ${file.reason} |`).join('\n')}
${filesToReview.length > 20 ? `\\n... and ${filesToReview.length - 20} more files` : ''}

## Files to Keep (${filesToKeep.length} files)

These files are referenced in HTML, CSS, or configuration:

${filesToKeep.length > 0 ? '| File Path | Type | Reason |' : ''}
${filesToKeep.length > 0 ? '|----------|------|--------|' : ''}
${filesToKeep.map(file => `| ${file.path} | ${file.type} | ${file.reason} |`).join('\n')}

## Unused Dependencies (${report.unusedDependencies.length})

${report.unusedDependencies.length > 0 ? '| Package | Version | Reason |' : ''}
${report.unusedDependencies.length > 0 ? '|---------|---------|--------|' : ''}
${report.unusedDependencies.map(dep => `| ${dep.package} | ${dep.version || 'N/A'} | ${dep.reason} |`).join('\n')}

## Duplicate Files (${report.duplicateFiles.length})

${report.duplicateFiles.map(dup => `- ${dup.reason}: ${dup.files.join(', ')}`).join('\n')}

## Recommendations

1. **Review files marked for manual review** before deleting anything
2. **Test the application** after removing confirmed unused files
3. **Update package.json** to remove unused dependencies
4. **Run build process** to ensure nothing breaks
5. **Consider consolidating** duplicate components between admin and frontend

## Next Steps

1. Review the detailed cleanup report in ${path.relative(projectRoot, cleanupReportPath)}
2. Manually verify files in the "Files Needing Manual Review" section
3. Delete files marked as "Safe to Delete"
4. Remove unused dependencies from package.json
5. Run \`npm install\` to update package-lock.json
6. Test the application thoroughly
`;

  fs.writeFileSync(cleanupSummaryPath, summaryContent);
  console.log(`Cleanup summary saved to: ${cleanupSummaryPath}`);

  // Ask for confirmation before actually deleting files
  console.log('\n⚠️  IMPORTANT: This script has identified files that can be safely deleted.');
  console.log('Please review the cleanup reports before proceeding with deletion.');
  console.log('\nTo actually delete the safe files, run:');
  console.log('node cleanup-script.js --delete-safe');

  console.log('\nCleanup process completed successfully!');
}

main();