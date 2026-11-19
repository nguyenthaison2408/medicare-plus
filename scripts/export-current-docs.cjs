const {exportWordReports}=require('./export-word-reports.cjs');
exportWordReports().catch(error=>{console.error(error.stack||error.message);process.exitCode=1;});
