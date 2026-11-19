const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../client/dist');
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json',
  '.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'};
http.createServer((request,response) => {
  let pathname;
  try {pathname=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);} catch {response.writeHead(400).end();return;}
  let file=path.resolve(root,'.'+pathname);
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
  if(!path.extname(file)) file=path.join(root,'index.html');
  fs.stat(file,(error,stat)=>{
    if(error||!stat.isFile()){response.writeHead(404).end();return;}
    response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    fs.createReadStream(file).pipe(response);
  });
}).listen(4173,'127.0.0.1',()=>console.log('MediCare Plus preview: http://127.0.0.1:4173'));
