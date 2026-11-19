import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {root,database} from './cloud-config.mjs';
const db=database();
try {
  await db.connect();
  const applied=new Map((await db.query('select name,sha256 from clinic_private.schema_migrations')).rows.map(row=>[row.name,row.sha256]));
  for(const name of fs.readdirSync(path.join(root,'supabase/migrations')).filter(name=>/^\d+_[a-z_]+\.sql$/.test(name)).sort()) {
    const sql=fs.readFileSync(path.join(root,'supabase/migrations',name),'utf8').replace(/\r\n/g,'\n');
    const hash=crypto.createHash('sha256').update(sql).digest('hex');
    if(applied.has(name)) {
      if(applied.get(name)!==hash) throw new Error(`An applied migration changed: ${name}`);
      continue;
    }
    await db.query('begin');
    try {
      await db.query(sql.replace(/^\s*begin;\s*/i,'').replace(/\s*commit;\s*$/i,''));
      await db.query('insert into clinic_private.schema_migrations(name,sha256) values($1,$2)',[name,hash]);
      await db.query('commit');console.log(`Applied ${name}`);
    } catch(error) {await db.query('rollback');throw error;}
  }
} catch(error) {console.error(error.message);process.exitCode=1;}
finally {await db.end();}
