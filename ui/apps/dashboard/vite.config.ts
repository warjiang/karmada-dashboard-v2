/*
Copyright 2024 The Karmada Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { dynamicBase } from 'vite-plugin-dynamic-base';
import banner from 'vite-plugin-banner';
import { getLicense } from '@karmada/utils';
import { visualizer } from 'rollup-plugin-visualizer';

const replacePathPrefixPlugin = (): Plugin => {
  return {
    name: 'replace-path-prefix',
    transformIndexHtml: async (html) => {
      if (process.env.NODE_ENV !== 'production') {
        return html.replace('{{PathPrefix}}', '');
      }
      return html;
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const license = getLicense();
  const isAnalyze = process.env.ANALYZE === 'true';

  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: process.env.NODE_ENV === 'development' ? '' : '/static',

    plugins: [
      banner(license) as Plugin,
      react(),
      svgr(),
      replacePathPrefixPlugin(),
      dynamicBase({
        publicPath: 'window.__dynamic_base__',
        transformIndexHtml: true,
      }),
      // Bundle analyzer
      isAnalyze && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'dist/stats.html',
      }),
    ].filter(Boolean) as Plugin[],
    
    resolve: {
      alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
    },

    build: {
      // Enable source maps for debugging
      sourcemap: mode !== 'production',
      
      // Optimize chunk size
      chunkSizeWarningLimit: 500,
      
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks(id: string) {
            // React and related packages
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') || 
                id.includes('node_modules/react-router')) {
              return 'react-vendor';
            }
            
            // Ant Design
            if (id.includes('node_modules/antd') || 
                id.includes('node_modules/@ant-design')) {
              return 'ui-vendor';
            }
            
            // Data fetching
            if (id.includes('node_modules/@tanstack/react-query') || 
                id.includes('node_modules/zustand')) {
              return 'data-vendor';
            }
            
            // Monaco Editor
            if (id.includes('node_modules/monaco-editor')) {
              return 'monaco-editor';
            }
            
            // Utilities
            if (id.includes('node_modules/dayjs') || 
                id.includes('node_modules/lodash') || 
                id.includes('node_modules/js-yaml') ||
                id.includes('node_modules/classnames') ||
                id.includes('node_modules/tailwind-merge')) {
              return 'utils-vendor';
            }
          },
          
          // Optimize chunk naming
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name || '';
            if (info.endsWith('.css')) {
              return 'assets/[name]-[hash][extname]';
            }
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(info)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|ttf|otf|eot)$/i.test(info)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      
      // Minification options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
        },
      },
    },

    // Optimize dependencies pre-bundling
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd',
        '@ant-design/icons',
        '@tanstack/react-query',
        'dayjs',
        'js-yaml',
      ],
      exclude: [
        // Exclude heavy Monaco Editor from pre-bundling
        'monaco-editor',
      ],
    },

    server: {
      proxy: {
        '^/api/v1/terminal/sockjs*': {
          target: 'ws://localhost:8000',
          changeOrigin: false,
          secure: false,
          ws: true,
        },
        '^/api/v1.*': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          headers: {
            // cookie: env.VITE_COOKIES,
            // Authorization: `Bearer ${env.VITE_TOKEN}`
          },
        },
        '^/clusterapi/*': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          headers: {
            // cookie: env.VITE_COOKIES,
            // Authorization: `Bearer ${env.VITE_TOKEN}`
          },
        },
        '^/clusterapi/[^/]+/api/v1/terminal/sockjs': {
          target: 'ws://localhost:8000',
          changeOrigin: false,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
