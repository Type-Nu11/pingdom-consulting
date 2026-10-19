import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    env.VITE_PROXY_TARGET || env.VITE_API_BASE_URL || 'https://www.typenull.xyz'

  return {
    plugins: [react()],
    build: {
      sourcemap: false,
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/_pingdom': {
          target: proxyTarget,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', (proxyReq, request) => {
              // 로컬 동일 출처 검증 요청만 대상 Origin으로 변환합니다.
              // 외부 출처와 cross-site 요청은 원래 값을 유지해 서버가 거부하게 합니다.
              if (!request.url?.startsWith('/_pingdom/pingcha/') ||
                !request.headers.origin || request.headers['sec-fetch-site'] === 'cross-site') return
              try {
                const origin = new URL(request.headers.origin)
                if ((origin.protocol === 'http:' || origin.protocol === 'https:') &&
                  origin.host === request.headers.host) {
                  proxyReq.setHeader('Origin', new URL(proxyTarget).origin)
                }
              } catch { /* 잘못된 Origin은 변환하지 않습니다. */ }
            })
          },
        },
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // 백엔드 /auth 쿠키를 개발 프록시 경로에서도 전송합니다.
          cookiePathRewrite: { '/auth': '/api/auth' },
          cookieDomainRewrite: '',
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
