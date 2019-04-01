import webpack from 'webpack';
import config from '../config/webpack.config.prod';
import fs from 'fs-extra';
import { resolveApp } from '../config/kit';
import process from "process";

process.env.BABEL_ENV = "production";
process.env.NODE_ENV = "production";
process.env.BROWSERSLIST_ENV = "production";

try {
	fs.emptyDirSync(resolveApp('build'));
	fs.copySync(resolveApp('public'), resolveApp('build'), {
		dereference: true,
		filter: (file) => file !== resolveApp('public/index.html')
	});
} catch (e) {}

webpack(config as any, (err, stats) => {
	if (err || stats.hasErrors()) {
		console.error(err);
	}
	console.log(
		stats.toString({
			colors: true
		})
	);
});
