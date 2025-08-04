import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Execute command with proper error handling and logging
 */
function executeCommand(command, description) {
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
 */
async function copyDirectory(src, dest, description) {
  console.log(`\n📁 ${description}...`);
  try {
    const srcPath = path.resolve(__dirname, '..', src);
    const destPath = path.resolve(__dirname, '..', dest);
    
    // Check if source exists
    if (!await fs.pathExists(srcPath)) {
      throw new Error(`Source directory does not exist: ${srcPath}`);
    }
    
    // Remove destination if exists
    if (await fs.pathExists(destPath)) {
      await fs.remove(destPath);
      console.log(`  Removed existing directory: ${destPath}`);
    }
    
    // Copy source to destination
    await fs.copy(srcPath, destPath);
    console.log(`  Copied ${srcPath} -> ${destPath}`);
    console.log(`✅ ${description} completed successfully`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Apply git patch with proper error handling
 */
function applyPatch(patchFile, description) {
  console.log(`\n🔧 ${description}...`);
  try {
    const patchPath = path.resolve(__dirname, '..', patchFile);
    
    // Check if patch file exists
    if (!fs.existsSync(patchPath)) {
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
 * Main update and build function
 */
async function updateAndBuild() {
  console.log('🚀 Starting FlowTune update and build process...\n');
  
  try {
    // Step 1: Update git submodules
    executeCommand(
      'git submodule update --init --recursive',
      'Updating git submodules'
    );
    
    // Step 2: Update frontend
    await copyDirectory(
      './flowgram.ai/apps/demo-free-layout/src/',
      './packages/frontend/src/',
      'Updating frontend source files'
    );
    
    applyPatch(
      './patch/frontend.patch',
      'Applying frontend patches'
    );
    
    // Step 3: Update backend
    await copyDirectory(
      './flowgram.ai/packages/runtime/nodejs/src/',
      './packages/backend/src/',
      'Updating backend source files'
    );
    
    applyPatch(
      './patch/backend.patch',
      'Applying backend patches'
    );
    
    // Step 4: Install dependencies
    executeCommand(
      'pnpm i',
      'Installing dependencies'
    );
    
    // Step 5: Build backend
    executeCommand(
      'pnpm --filter @flowtune/backend build',
      'Building backend'
    );
    
    // Step 6: Build frontend
    executeCommand(
      'pnpm --filter @flowtune/frontend build',
      'Building frontend'
    );
    
    console.log('\n🎉 All updates and builds completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Git submodules updated');
    console.log('  ✅ Frontend source files updated');
    console.log('  ✅ Backend source files updated');
    console.log('  ✅ Dependencies installed');
    console.log('  ✅ Backend built');
    console.log('  ✅ Frontend built');
    
  } catch (error) {
    console.error('\n💥 Update and build process failed:', error.message);
    process.exit(1);
  }
}

// Run the update and build process
updateAndBuild();
