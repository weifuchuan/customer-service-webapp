import merge from 'webpack-merge';
import baseConfig from './webpack.config.base';
import path from 'path';
import webpack from 'webpack';
import { resolveApp } from './kit';
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');

const entry: any = baseConfig.entry;
for (let name in entry) {
	entry[name].unshift(require.resolve('react-dev-utils/webpackHotDevClient'));
}

export default merge.smart(baseConfig as any, {
	mode: 'development',
	devtool: 'eval-source-map', 

	output: {
		path: resolveApp('dist/'),
		pathinfo: true,
		filename: 'static/js/[name]/bundle.js',
		chunkFilename: 'static/js/[name].chunk.js',
		publicPath: '/',

		devtoolModuleFilenameTemplate: (info) => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/')
	},

	plugins: [
		new webpack.NamedModulesPlugin(),
		new webpack.HotModuleReplacementPlugin(),
		new WatchMissingNodeModulesPlugin(resolveApp('node_modules'))
	],

	performance: {
		hints: false
	},

	optimization:{
		minimize:false
	}
});
