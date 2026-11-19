const fs=require('node:fs');
const path=require('node:path');
const {convertMarkdown}=require('./convert_md_to_docx.js');
const root=path.resolve(__dirname,'..');
const sourcePath=path.join(__dirname,'report-data/report-source.json');
async function exportWordReports(outputDirectory=path.join(root,'docs')){
  const data=JSON.parse(fs.readFileSync(sourcePath,'utf8').replace(/^\uFEFF/,''));
  const documents=data.documents.slice().sort((a,b)=>a.stem.localeCompare(b.stem,'en'));
  if(documents.length!==12||new Set(documents.map(d=>d.stem)).size!==12)throw new Error('Expected 12 unique Word reports.');
  const report=documents.find(d=>d.stem==='01_Final_Technical_Report');
  if(!report||(report.content.match(/^## CHƯƠNG [1-7]\./gm)||[]).length!==7)throw new Error('Main report must contain seven chapters.');
  for(const item of documents){
    if(!/^\d{2}_[A-Za-z0-9_]+$/.test(item.stem)||item.stem.startsWith('07_'))throw new Error('Unexpected report name.');
    if(item.content.includes('{{'))throw new Error('Unresolved report placeholder.');
  }
  fs.mkdirSync(outputDirectory,{recursive:true});
  const results=[];
  for(const item of documents){
    const output=path.join(outputDirectory,item.stem+'.docx');
    await convertMarkdown(item.content,output,{...item.options,title:item.title});
    results.push({file:path.basename(output),bytes:fs.statSync(output).size});
  }
  const manifestDirectory=path.join(root,'artifacts/report-export');
  fs.mkdirSync(manifestDirectory,{recursive:true});
  fs.writeFileSync(path.join(manifestDirectory,'word-export-manifest.json'),JSON.stringify({version:data.version,files:results},null,2)+'\n');
  console.log(JSON.stringify({wordFiles:results.length,outputDirectory}));
  return results;
}
if(require.main===module)exportWordReports(process.argv[2]?path.resolve(process.argv[2]):undefined).catch(error=>{console.error(error.stack);process.exitCode=1;});
module.exports={exportWordReports};
