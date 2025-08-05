import { defineConfig } from "vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  resolve: {
    mainFields: ['module', 'jsnext:main', 'jsnext'],
    conditions: ['node']
  },
  build: {
    target: 'node22',
    rollupOptions: {
      input: path.join(__dirname, 'src', 'main.ts'),
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
      entry: path.join(__dirname, 'src', 'main.ts'),
      name: 'main',
      formats: ['cjs'],
      fileName: (format) => `main.js`,
    },
    outDir: path.join(__dirname, 'build'),
    minify: false,
    ssr: true,
    emptyOutDir: false
  },
  ssr: {
    noExternal: true
  }
});
