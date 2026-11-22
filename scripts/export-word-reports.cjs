const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
// Office files in docs are the maintained masters, including the user's formatting.
const REPORT_FILES=Object.freeze([
 '01_Final_Technical_Report.docx',
 '02_Project_Charter_Signed.docx',
 '03_WBS_and_WBS_Dictionary.docx',
 '04_Risk_Register_Evolution.xlsx',
 '05_Sprint_Retrospectives.docx',
 '06_Scope_Change_Control_Record.docx',
 '08_Presentation_Slide_Deck.pptx'
]);
async function exportWordReports(outputDirectory=path.join(root,'docs')){
 const sourceDirectory=path.join(root,'docs');
 const destination=path.resolve(outputDirectory);
 const inputs=REPORT_FILES.map(file=>({file,source:path.join(sourceDirectory,file)}));
 for(const item of inputs){
  if(!fs.existsSync(item.source))throw Error('Missing report master: '+item.file);
  const header=Buffer.alloc(4);const descriptor=fs.openSync(item.source,'r');
  try{fs.readSync(descriptor,header,0,4,0);}finally{fs.closeSync(descriptor);}
  if(header.readUInt32LE(0)!==0x04034b50)throw Error('Invalid Office file: '+item.file);
 }
 fs.mkdirSync(destination,{recursive:true});
 const results=[];
 for(const item of inputs){
  const output=path.join(destination,item.file);
  if(path.resolve(item.source).toLowerCase()!==path.resolve(output).toLowerCase())fs.copyFileSync(item.source,output);
  const bytes=fs.readFileSync(output);
  results.push({file:item.file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
 }
 const manifestDirectory=path.join(root,'artifacts/report-export');
 fs.mkdirSync(manifestDirectory,{recursive:true});
 fs.writeFileSync(path.join(manifestDirectory,'word-export-manifest.json'),JSON.stringify({source:'docs Office masters',wordFiles:5,excelFiles:1,presentationFiles:1,files:results},null,2)+'\n');
 console.log(JSON.stringify({wordFiles:5,excelFiles:1,presentationFiles:1,outputDirectory:destination}));
 return results;
}
if(require.main===module)exportWordReports(process.argv[2]?path.resolve(process.argv[2]):undefined).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={exportWordReports,REPORT_FILES};
