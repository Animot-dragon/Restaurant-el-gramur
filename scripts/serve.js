/* Servidor estático mínimo para desarrollo: node scripts/serve.js [puerto] */
const http=require("http"),fs=require("fs"),path=require("path"),zlib=require("zlib");
const root=path.resolve(__dirname,"..");
const types={".html":"text/html; charset=utf-8",".css":"text/css",".js":"text/javascript",".svg":"image/svg+xml",".woff2":"font/woff2",".png":"image/png",".json":"application/json"};
http.createServer((q,r)=>{
 let p=decodeURIComponent(q.url.split("?")[0]);if(p==="/")p="/index.html";
 const f=path.join(root,p);
 if(!f.startsWith(root)||f.includes("node_modules")){r.writeHead(403);return r.end()}
 fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end("No encontrado")}const h={"Content-Type":types[path.extname(f)]||"application/octet-stream"};if(/\.(html|css|js|svg)$/.test(f)&&/gzip/.test(q.headers["accept-encoding"]||"")){d=zlib.gzipSync(d);h["Content-Encoding"]="gzip"}r.writeHead(200,h);r.end(d)});
}).listen(+process.argv[2]||process.env.PORT||8780,()=>console.log("http://localhost:"+(process.argv[2]||process.env.PORT||8780)));
