import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server:{
    proxy:{
      // 只要请求以路径以/api开头，就转发给在本地运行的后端
      '/api':{
        target:'http://localhost:8080',
        changeOrigin:true
      }
    }
  }
})
