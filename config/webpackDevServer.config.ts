const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
const ignoredFiles = require('react-dev-utils/ignoredFiles');
import config from './webpack.config.dev';
import { resolveApp } from './kit';
import express from 'express';
import beforeMiddlewareSetter from './beforeMiddlewareSetter';
import afterMiddlewareSetter from './afterMiddlewareSetter';

const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
const host = process.env.HOST || '0.0.0.0';

export default function createDevServerConfig(proxy: any, allowedHost: any) {
  return {
    disableHostCheck: true,
    compress: true,
    clientLogLevel: 'none' as 'none' | 'error' | 'warning' | 'info' | undefined,
    contentBase: resolveApp('public'),
    watchContentBase: true,
    hot: true,

    publicPath: config.output!.publicPath,
    quiet: true,
    watchOptions: {
      ignored: ignoredFiles(resolveApp('src'))
    },
    https: protocol === 'https',
    host: host,
    overlay: false,
    historyApiFallback: {
      disableDotRule: true
    },
    public: allowedHost,
    proxy,

    before(app: express.Application, server: any) {
      app.use(evalSourceMapMiddleware(server));
      app.use(errorOverlayMiddleware());
      app.use(noopServiceWorkerMiddleware());
    },

    after(app: express.Application) {
      afterMiddlewareSetter(app);
    }
  };
}
