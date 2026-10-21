import http from 'node:http';
const req=http.get({hostname:'127.0.0.1',port:process.env.PORT||4173,path:'/api/health',headers:{Host:new URL(process.env.PUBLIC_ORIGIN).host},timeout:4000},res=>{let body='';res.on('data',part=>body+=part);res.once('end',()=>{try{process.exit(res.statusCode===200&&JSON.parse(body).ok===true?0:1);}catch{process.exit(1);}});});
req.once('timeout',()=>req.destroy());req.once('error',()=>process.exit(1));
