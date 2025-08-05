import { defineConfig } from "vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  build: {
    target: 'node22',
    rollupOptions: {
      input: path.join(__dirname, 'src', 'preload.ts'),
      external: (id) => {
        // 动态判断外部依赖
        const builtins = [
          "electron", "async_hooks",
          "fs", "path", "os", "crypto", "events", "stream", "util",
          "url", "querystring", "http", "https", "net", "tls", "zlib",
          "buffer", "child_process", "cluster", "dgram", "dns",
          "readline", "repl", "worker_threads", "timers", "assert",
          "constants", "module", "perf_hooks", "process", "v8", "vm"
        ];
        
        return builtins.includes(id) || id.startsWith("node:");
      },
    },
    lib: {
      entry: path.join(__dirname, 'src', 'preload.ts'),
      name: 'preload',
      formats: ['cjs'],
      fileName: (format) => `preload.js`,
    },
    outDir: path.join(__dirname, 'build'),
    minify: false,
    ssr: true,
    emptyOutDir: false
  },
  ssr: {
    resolve: {
      conditions: ['module', 'browser', 'development|production'],
      mainFields: ['browser', 'module', 'jsnext:main', 'jsnext']
    },
    noExternal: true
  },
});
