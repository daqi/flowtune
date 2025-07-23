#!/usr/bin/env node

/**
 * FlowTune 插件系统演示脚本
 * Plugin System Demo Script for FlowTune
 */

const { runPluginSystemExample } = require('./example.ts');

async function main() {
  try {
    console.log('🚀 Starting FlowTune Plugin System Demo...\n');
    await runPluginSystemExample();
    console.log('\n✅ Demo completed successfully!');
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
