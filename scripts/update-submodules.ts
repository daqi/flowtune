import { 
  executeCommand, 
  copyDirectory, 
  applyPatch, 
  logSummary, 
  logProcessStart, 
  handleProcessError 
} from './utils';

/**
 * Main update and build function
 */
async function updateAndBuild() {
  logProcessStart('FlowTune update and build process');
  
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
    
    // Log completion summary
    logSummary([
      'Git submodules updated',
      'Frontend source files updated',
      'Backend source files updated',
      'Dependencies installed',
      'Backend built',
      'Frontend built'
    ]);
    
  } catch (error) {
    handleProcessError(error, 'Update and build process');
  }
}

// Run the update and build process
updateAndBuild();
