import proxyMiddleware from "./proxyMiddleware"
import express from 'express'

export default function (app: express.Application) {
	proxyMiddleware && app.use(proxyMiddleware as any);	
}
 