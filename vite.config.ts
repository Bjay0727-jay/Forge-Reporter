/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Manual chunks for code-splitting heavy dependencies
        manualChunks: {
          // OSCAL schema and validation (heavy - 2154 lines of JSON schema)
          'oscal': [
            './src/utils/oscalExport.ts',
            './src/utils/oscalImport.ts',
            './src/utils/oscalValidator.ts',
          ],
          // PDF generation libraries
          'pdf': [
            './src/utils/pdfExport.ts',
          ],
          // AI service
          'ai': [
            './src/services/ai.ts',
          ],
          // Vendor chunks for large libraries
          'vendor-ajv': ['ajv', 'ajv-formats'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
          'vendor-xml': ['js2xmlparser'],
        },
      },
    },
    // Increase warning limit slightly for remaining main chunk
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'json-summary', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
})
