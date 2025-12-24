import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 배포를 위한 base 경로 설정
  // 리포지토리 이름이 'jtrip'인 경우: base: '/jtrip/'
  // 루트 도메인에 배포하는 경우: base: '/'
  base: process.env.GITHUB_REPOSITORY 
    ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
    : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 파일명에 해시 추가하여 캐시 무효화
    rollupOptions: {
      output: {
        // 파일명에 해시 포함 (기본적으로 활성화되어 있음)
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
  },
})
