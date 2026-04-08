import { defineConfig, transformWithOxc } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Plugin chặn trước OXC, báo cho OXC biết file .js này chứa JSX
    {
      name: 'treat-js-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!id.match(/\.js$/) || id.includes('node_modules')) return null
        // Dùng transformWithOxc native của Vite 8, ép lang = 'jsx'
        return transformWithOxc(code, id, { lang: 'jsx' })
      },
    },
    react(),
  ],
})



