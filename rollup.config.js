import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';

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
                jquery: ['jQuery'],
                'file-saverjs': ['FileSaver'],
                papaparse: ['PapaParse']
            },
            exclude: ['lodash-es']
        }),
        babel({
            exclude: 'node_modules/**'
        })],
    dest: 'bundle.js',
    sourceMap: true
};