const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
for(const [v,f] of [['breakdown','05_vista_explosionada_3d'],['map','06_mapa_ruta_3d'],['mini','07_minimalista_lineal'],['cartoon','08_animacion_2d_dibujada']]){
 await p.goto('file://'+process.argv[2]+'/estilos.html?v='+v);await p.waitForTimeout(400);
 await p.screenshot({path:process.argv[3]+'/'+f+'.png'});}
await b.close();})();
