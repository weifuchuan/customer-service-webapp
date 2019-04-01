import webpack from 'webpack';
import config from '../config/webpack.config.prod';
import fs from 'fs-extra';
import { resolveApp } from '../config/kit';

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
