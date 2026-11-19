import http from 'k6/http';
import {check} from 'k6';
import {Counter} from 'k6/metrics';
import {summarize} from './summary.js';
const booked=new Counter('booking_success');
const conflicts=new Counter('booking_conflict');
const unexpected=new Counter('booking_unexpected');
export const options={scenarios:{booking:{executor:'per-vu-iterations',vus:50,iterations:1,maxDuration:'30s'}},
  thresholds:{booking_success:['count==1'],booking_conflict:['count==49'],booking_unexpected:['count==0'],checks:['rate==1']}};
http.setResponseCallback(http.expectedStatuses(200,409));
export default function(){
  const response=http.post(`${__ENV.PROJECT_URL}/rest/v1/rpc/clinic_book_appointment`,
    JSON.stringify({p_doctor_id:'doc-4',p_starts_at:__ENV.STARTS_AT,p_payment_method:'at_clinic'}),
    {headers:{apikey:__ENV.PUBLIC_KEY,Authorization:`Bearer ${__ENV.AUTH_TOKEN}`,'Content-Type':'application/json'}});
  let body;try{body=response.json();}catch{body={};}
  const success=response.status===200&&typeof body.booking_code==='string';
  const conflict=response.status===409&&body.code==='23505';
  booked.add(success?1:0);conflicts.add(conflict?1:0);unexpected.add(success||conflict?0:1);
  check(response,{'a valid booking or expected occupied-slot conflict':()=>success||conflict});
}
export function handleSummary(data){return summarize(data,'Supabase booking contention — 50 concurrent requests to one slot',
  'One synthetic authenticated patient token is shared by 50 virtual users. Expected business result: one HTTP 200 booking and 49 HTTP 409 occupied-slot conflicts. This is not a sustained 100-user booking benchmark.');}
