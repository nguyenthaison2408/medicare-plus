import http from 'k6/http';
import {check,sleep} from 'k6';
import {summarize} from './summary.js';
if(!__ENV.PROJECT_URL||!__ENV.PUBLIC_KEY||!__ENV.TEST_DATE)throw new Error('Project configuration is required.');
export const options={scenarios:{catalog:{executor:'constant-vus',vus:100,duration:'30s',gracefulStop:'10s'}},
  thresholds:{http_req_duration:['p(95)<400'],http_req_failed:['rate==0'],checks:['rate==1']}};
const headers={apikey:__ENV.PUBLIC_KEY,'Content-Type':'application/json'};
export default function(){
  const doctors=http.get(`${__ENV.PROJECT_URL}/rest/v1/clinic_doctors?select=id,name,specialty,hospital`,{headers,tags:{endpoint:'catalog'}});
  check(doctors,{'doctor catalog responds 200':response=>response.status===200});
  const slots=http.post(`${__ENV.PROJECT_URL}/rest/v1/rpc/clinic_slot_availability`,JSON.stringify({p_doctor_id:'doc-4',p_date:__ENV.TEST_DATE}),{headers,tags:{endpoint:'availability'}});
  check(slots,{'availability responds 200':response=>response.status===200});
  sleep(0.5);
}
export function handleSummary(data){return summarize(data,'Supabase catalog and availability — 100 virtual users, 30 seconds',
  'Read-only catalog/availability benchmark. Does not measure 100 independent patient journeys, UI rendering, email or booking throughput. Target: p95 under 400 ms, zero HTTP errors.');}
