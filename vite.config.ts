import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import packageJson from './package.json'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageName = packageJson.name.split('/').pop() || packageJson.name


export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'lib/Graph.ts'),
            // name: 'Graph',
            name: packageName,
            // fileName: packageName,
            // the proper extensions will be added
            // fileName: 'graph',
        },
        rollupOptions: {},
    },
    plugins: [
        dts({ rollupTypes: true }),
    ]
})