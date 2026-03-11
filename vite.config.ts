import path from "path";
import {defineConfig, LibraryFormats} from "vite";
import dts from 'vite-plugin-dts'
import license from 'rollup-plugin-license'
import packageJson from "./package.json";

const getPackageName = () => {
    return packageJson.name;
};

const getPackageNameCamelCase = () => {
    try {
        return getPackageName().replace(/-./g, char => char[1].toUpperCase());
    } catch (err) {
        throw new Error("Name property in package.json is missing.");
    }
};

const fileName: Record<string, string> = {
    es: `index.js`,
    cjs: `index.cjs`,
};

const formats = Object.keys(fileName) as LibraryFormats[];

export default defineConfig({
    base: "./",
    build: {
        outDir: "./dist",
        minify: false,
        rollupOptions: {
            treeshake: false,
            output: {
                exports: 'named',
                minifyInternalExports: false,
                preserveModules: false
            }
        },
        lib: {
            entry: path.resolve(__dirname, "lib/index.ts"),
            name: getPackageNameCamelCase(),
            formats,
            fileName: format => fileName[format],
        },
    },
    plugins: [
        dts({
            rollupTypes: true,
            include: ['lib/**/*.ts'],
            entryRoot: 'lib'
        }),
        license({
            banner: {
                commentStyle: "ignored",
                content: {
                    file: 'LICENSE',
                }
            }
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "lib"),
            "@@": path.resolve(__dirname),
        },
    },
});