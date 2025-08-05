import { execSync } from 'child_process';
import fse from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Execute command with proper error handling and logging
 * @param {string} command - The command to execute
 * @param {string} description - Description of what the command does
 */
export function executeCommand(command: string, description: string) {
  console.log(`\n🔄 ${description}...`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd: path.resolve(__dirname, '..') 
    });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Copy directory with proper error handling
 * @param {string} src - Source directory path (relative to project root)
 * @param {string} dest - Destination directory path (relative to project root)
 * @param {string} description - Description of what the copy operation does
 */
export async function copyDirectory(src: string, dest: string, description: string) {
  console.log(`\n📁 ${description}...`);
  try {
    const srcPath = path.resolve(__dirname, '..', src);
    const destPath = path.resolve(__dirname, '..', dest);
    
    // Check if source exists
    if (!await fse.pathExists(srcPath)) {
      throw new Error(`Source directory does not exist: ${srcPath}`);
    }
    
    // Remove destination if exists
    if (await fse.pathExists(destPath)) {
      await fse.remove(destPath);
      console.log(`  Removed existing directory: ${destPath}`);
    }
    
    // Copy source to destination
    await fse.copy(srcPath, destPath);
    console.log(`  Copied ${srcPath} -> ${destPath}`);
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Apply git patch with proper error handling
 * @param {string} patchFile - Path to the patch file (relative to project root)
 * @param {string} description - Description of what the patch does
 */
export function applyPatch(patchFile: string, description: string) {
  console.log(`\n🔧 ${description}...`);
  try {
    const patchPath = path.resolve(__dirname, '..', patchFile);
    
    // Check if patch file exists
    if (!fse.existsSync(patchPath)) {
      console.log(`⚠️  Patch file not found: ${patchPath}, skipping...`);
      return;
    }
    
    execSync(`git apply ${patchFile}`, { 
      stdio: 'inherit', 
      cwd: path.resolve(__dirname, '..') 
    });
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    // Don't exit on patch failure, just warn
    console.log(`⚠️  Continuing despite patch failure...`);
  }
}

/**
 * Log a summary of completed operations
 * @param {string[]} operations - Array of completed operation descriptions
 */
export function logSummary(operations: string[]) {
  console.log('\n🎉 All updates and builds completed successfully!');
  console.log('\n📋 Summary:');
  operations.forEach(operation => {
    console.log(`  ✅ ${operation}`);
  });
}

/**
 * Log the start of a process
 * @param {string} processName - Name of the process being started
 */
export function logProcessStart(processName: string) {
  console.log(`🚀 Starting ${processName}...\n`);
}

/**
 * Handle process errors and log them appropriately
 * @param {Error} error - The error that occurred
 * @param {string} processName - Name of the process that failed
 */
export function handleProcessError(error: Error, processName: string) {
  console.error(`\n💥 ${processName} failed:`, error.message);
  process.exit(1);
}
