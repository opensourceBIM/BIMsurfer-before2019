import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import babel from 'rollup-plugin-babel';

export default [{
	input: 'bimsurfer/src/index.js',
	name: 'bimsurfer',
	output: {
		file: 'build/bimsurfer.umd.js',
		format: 'umd'
	},
	external: ['bimserverapi', 'xeogl'],
	globals: {
		bimserverapi: 'BimServerClient'
	},
	plugins: [
		resolve({
			jsnext: true,
			main: true,
			preferBuiltins: true,
			browser: true
		}),
		commonjs({
			sourceMap: false
		}),
		builtins(),
		babel({
			exclude: ['node_modules/**']
		})
	]
}];