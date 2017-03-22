import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

export default {
    entry: 'index.js',
    format: 'iife',
    plugins: [
        resolve({
            jsnext: true,
            main: true,
            browser: true
        }),
        commonjs({
            include: 'node_modules/**',
            sourceMap: true,
            namedExports: {
                'file-saverjs': ['FileSaver'],
                papaparse: ['PapaParse']
            },
            exclude: ['lodash-es', 'node_modules/angular/**']
        }),
        babel({
            exclude: 'node_modules/**'
        })],
    dest: 'bundle.js',
    sourceMap: true
};