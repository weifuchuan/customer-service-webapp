import process from 'process';
import fs from 'fs';
import chalk from 'chalk';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import pagesConfig from '../src/pages-config';
import { resolveApp } from '../config/kit';
import createDevServerConfig from '../config/webpackDevServer.config';
import config from '../config/webpack.config.dev';

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

process.on('unhandledRejection', (err) => {
  throw err;
});

const clearConsole = require('react-dev-utils/clearConsole');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');

const useYarn = fs.existsSync(resolveApp('yarn.lock'));
const isInteractive = process.stdout.isTTY;

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(
    `Learn more here: ${chalk.yellow('https://bit.ly/CRA-advanced-config')}`
  );
  console.log();
}

const { checkBrowsers } = require('react-dev-utils/browsersHelper');
checkBrowsers(resolveApp('.'), isInteractive)
  .then(() => {
    return choosePort(HOST, DEFAULT_PORT);
  })
  .then((port: number | null) => {
    if (port == null) {
      return;
    } 
    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require('package.json').name;
    const useTypeScript = fs.existsSync('tsconfig.json');
    const urls = prepareUrls(protocol, HOST, port);
    const devSocket = {
      warnings: (warnings: any) =>
        (devServer as any).sockWrite(
          (devServer as any).sockets,
          'warnings',
          warnings
        ),
      errors: (errors: any) =>
        (devServer as any).sockWrite(
          (devServer as any).sockets,
          'errors',
          errors
        )
    }; 
    const compiler = createCompiler({
      appName,
      config,
      devSocket,
      urls,
      useYarn,
      useTypeScript:false,
      webpack
    });
    const serverConfig = createDevServerConfig(void 0, urls.lanUrlForConfig);
    const devServer = new WebpackDevServer(compiler, serverConfig);
    devServer.listen(port, HOST, (err) => {
      if (err) {
        return console.log(err);
      }
      if (isInteractive) {
        clearConsole();
      }
      console.log(chalk.cyan('Starting the development server...\n'));
      openBrowser(urls.localUrlForBrowser + pagesConfig[0].name + '.html');
    });

    [ 'SIGINT', 'SIGTERM' ].forEach(function(sig: any) {
      process.on(sig, function() {
        devServer.close();
        process.exit();
      });
    });
  })
  .catch((err: any) => {
    console.error(err)
    if (err && err.message) {
      console.log(err.message);
    }
    process.exit(1);
  });
