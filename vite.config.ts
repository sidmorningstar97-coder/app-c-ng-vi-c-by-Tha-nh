import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 1. Tải tất cả biến môi trường
    const env = loadEnv(mode, '.', '');
    // FIX API KEY: Fallback to the key provided by the user for GH Pages support
    const API_KEY_VALUE = env.VITE_GEMINI_API_KEY || 'AIzaSyCe0LMlRYGy6RY9mmeaNmXdbE8yLAaRvoM'; 

    return {
        // FIX LỖI 404: Dùng đường dẫn tuyệt đối của tên Repository (Cách ổn định nhất cho GH Pages)
        base: '/app-c-ng-vi-c-by-Tha-nh/', 
        
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        
        plugins: [react()],
        
        // FIX API KEY: Đảm bảo khóa được nhúng vào code
        define: {
            'process.env.API_KEY': JSON.stringify(API_KEY_VALUE),
            'process.env.VITE_GEMINI_API_KEY': JSON.stringify(API_KEY_VALUE),
        },
        
        resolve: {
            alias: {
                '@': path.resolve('.'),
            }
        },
        
        build: {
            rollupOptions: {
                output: {}
            }
        }
    };
});