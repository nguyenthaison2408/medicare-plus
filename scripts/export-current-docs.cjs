const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {convertFile}=require('./convert_md_to_docx.js');
const {markdownToHtml,renderHtmlToPdf}=require('./generate_pdfs.js');
async function run(){
  const docs=path.resolve(__dirname,'../docs');
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'medicare-current-docs-'));
  for(const name of ['09_Implementation_Audit','11_Demo_Runbook_20261123','12_Technical_Report_Current_Draft']){
    const markdown=fs.readFileSync(path.join(docs,name+'.md'),'utf8');
    const title=markdown.split(/\r?\n/)[0].replace(/^#\s*/, '');
    await convertFile(path.join(docs,name+'.md'),path.join(docs,name+'.docx'),{title});
    const html=path.join(temporary,name+'.html');
    fs.writeFileSync(html,markdownToHtml(markdown,false,false,title));
    if(!renderHtmlToPdf(html,path.join(docs,name+'.pdf'),false))throw new Error(`PDF generation failed: ${name}`);
  }
  console.log('Exported current audit, runbook and report draft; existing report files 00–08 were not regenerated.');
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
