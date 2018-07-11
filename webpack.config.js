const path = require('path');

module.exports = {
	mode: 'development',
	devtool: 'inline-source-map',
	entry: path.join(__dirname, 'index.js'),
	output: {
		path: path.join(__dirname, 'build'),
		filename: 'bundle.js'
	},
	module: {
		rules: [{
			test: /\.js?$/,
			exclude: /node_modules/,
			use: [{
				loader: 'babel-loader',
				options: {
					presets: ['babel-preset-env']
				}
			}]
		}]
	},
	watch: true
}