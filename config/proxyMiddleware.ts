import proxy from 'http-proxy-middleware'

export default undefined; 

// export default proxy('/api/', {
//   target: "http://localhost:8080",
//   changeOrigin: true,
//   ws: true,
//   pathRewrite: function (path, req) {

//     return path.substring(4); // trim left /api
//   }
// });
