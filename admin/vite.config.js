import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables with prefixes REACT_APP_ and VITE_ from local files
  const env = loadEnv(mode, process.cwd(), ['REACT_APP_', 'VITE_']);

  // Merge them with system process.env (e.g. for Vercel/CI/CD deployment)
  const mergedEnv = {
    ...process.env,
    ...env
  };

  // Convert keys starting with REACT_APP_ or VITE_ to process.env definitions
  const envDefinitions = {};
  for (const key of Object.keys(mergedEnv)) {
    if (key.startsWith('REACT_APP_') || key.startsWith('VITE_') || key === 'NODE_ENV') {
      envDefinitions[`process.env.${key}`] = JSON.stringify(mergedEnv[key]);
    }
  }

  // Also define the process.env object itself as a fallback
  envDefinitions['process.env'] = JSON.stringify(
    Object.keys(mergedEnv).reduce((acc, key) => {
      if (key.startsWith('REACT_APP_') || key.startsWith('VITE_') || key === 'NODE_ENV') {
        acc[key] = mergedEnv[key];
      }
      return acc;
    }, {})
  );

  return {
    plugins: [react()],
    define: envDefinitions,
    server: {
      port: 3001
    },
    preview: {
      host: '0.0.0.0'
    },
    build: {
      outDir: 'dist'
    }
  };
});
