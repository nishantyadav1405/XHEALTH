/** Run only against a dedicated hackathon Supabase project. All accounts and data are fictional. */
import 'dotenv/config';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
const url=process.env.SUPABASE_URL!,key=process.env.SUPABASE_SERVICE_ROLE_KEY!;
if(!url||!key)throw new Error('Missing Supabase admin configuration');
if(process.env.ALLOW_DEMO_SEED!=='true')throw new Error('Set ALLOW_DEMO_SEED=true to seed synthetic accounts');
const db=createClient(url,key,{auth:{persistSession:false}});
async function check<T>(p:PromiseLike<{data:T,error:any}>):Promise<T>{const {data,error}=await p;if(error)throw error;return data;}
const organizations=['Sunrise Family Clinic','CityCare Diagnostics','Greenfield Multispecialty Hospital'];
for(const name of organizations)await check(db.from('healthcare_organizations').upsert({name,is_synthetic:true},{onConflict:'name'}).select());
const orgs=await check(db.from('healthcare_organizations').select('id,name').in('name',organizations));
const org=(name:string)=>orgs.find(x=>x.name===name)!.id;
async function account(email:string,password:string,display_name:string,role:'patient'|'doctor',organization_id:string|null){
 const {data:{users},error}=await db.auth.admin.listUsers({perPage:1000});if(error)throw error;
 let user=users.find(x=>x.email===email);
 if(!user){const result=await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{demo:true}});if(result.error)throw result.error;user=result.data.user;}
 await check(db.from('profiles').upsert({id:user.id,display_name,role,organization_id,is_synthetic:true},{onConflict:'id'}).select());return user.id;
}
const patient=await account('rahul.demo@carebridge.example','DemoPatient!2026','Rahul Sharma','patient',null);
const doctor=await account('doctor.demo@carebridge.example','DemoDoctor!2026','Dr. Ananya Mehta','doctor',org('Sunrise Family Clinic'));
const docs=[
 {title:'Initial clinic consultation',category:'clinical_note',provider:'Sunrise Family Clinic',date:'2025-01-12',facts:{symptoms:'Follow-up visit for routine health review',note:'Synthetic encounter note'}},
 {title:'Prescription record',category:'prescription',provider:'Sunrise Family Clinic',date:'2025-01-12',facts:{medications:[{name:'Metformin',dose:'500 mg, as documented in fictional record'}]}},
 {title:'Laboratory report January',category:'laboratory',provider:'CityCare Diagnostics',date:'2025-01-15',facts:{observations:[{test:'HbA1c',value:'7.2',unit:'%'},{test:'Fasting glucose',value:'132',unit:'mg/dL'}]}},
 {title:'Follow-up consultation',category:'clinical_note',provider:'Sunrise Family Clinic',date:'2025-03-18',facts:{note:'Fictional follow-up; source record only'}},
 {title:'Hospital discharge summary',category:'discharge',provider:'Greenfield Multispecialty Hospital',date:'2025-05-10',facts:{note:'Fictional short inpatient stay; no clinical conclusions implied'}},
 {title:'Laboratory report August',category:'laboratory',provider:'CityCare Diagnostics',date:'2025-08-20',facts:{observations:[{test:'HbA1c',value:'6.9',unit:'%'},{test:'Fasting glucose',value:'125',unit:'mg/dL'}]}}
];
for(const d of docs){
 const {data:existing,error}=await db.from('medical_records').select('id').eq('patient_id',patient).eq('title',d.title).limit(1);if(error)throw error;if(existing?.length)continue;
 const documentId=randomUUID();const path=`${patient}/${documentId}/synthetic-report.txt`;
 const content=`CAREBRIDGE AI — SYNTHETIC DEMO RECORD\n${d.title}\n${d.provider}\n${d.date}\n${JSON.stringify(d.facts,null,2)}\nNOT A REAL MEDICAL RECORD`;
 await check(db.storage.from('medical-documents').upload(path,new TextEncoder().encode(content),{contentType:'text/plain',upsert:false}));
 await check(db.from('medical_documents').insert({id:documentId,patient_id:patient,title:d.title,category:d.category,provider_name:d.provider,document_date:d.date,storage_path:path,content_type:'text/plain',processing_status:'processed',verification_status:'unverified'}).select());
 const record=await check(db.from('medical_records').insert({patient_id:patient,source_document_id:documentId,title:d.title,category:d.category,provider_name:d.provider,record_date:d.date,verification_status:'unverified',structured_data:{...d.facts,synthetic:true,source_document_id:documentId}}).select('id').single());
 for(const x of ('observations' in d.facts ? d.facts.observations : [])??[])await check(db.from('observations').insert({patient_id:patient,record_id:record.id,test_name:x.test,value_text:x.value,unit:x.unit,observed_at:`${d.date}T10:00:00Z`}).select());
 for(const x of ('medications' in d.facts ? d.facts.medications : [])??[])await check(db.from('medications').insert({patient_id:patient,record_id:record.id,name:x.name,dose_text:x.dose,status:'documented'}).select());
}
console.log('Synthetic demo seeded. Patient:',patient,'Doctor:',doctor);
console.log('DEMO ACCOUNTS ONLY: rahul.demo@carebridge.example / DemoPatient!2026 and doctor.demo@carebridge.example / DemoDoctor!2026');
