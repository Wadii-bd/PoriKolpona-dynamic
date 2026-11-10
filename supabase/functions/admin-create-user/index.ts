import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const url=Deno.env.get("SUPABASE_URL")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer /i,"");if(!token)return json({error:"Authentication required"},401);
 const {data:{user},error:ae}=await admin.auth.getUser(token);if(ae||!user)return json({error:"Invalid session"},401);
 const {data:actor,error:pe}=await admin.from("profiles").select("role,active").eq("id",user.id).single();if(pe||actor.role!=="admin"||!actor.active)return json({error:"Administrator access required"},403);
 const {login_id,password,name,academic_year,college}=await req.json();if(!/^[a-zA-Z0-9._-]{3,48}$/.test(login_id||"")||typeof password!=="string"||password.length<12)return json({error:"Login ID must be 3-48 characters, password at least 12 characters."},400);
 const email=login_id.toLowerCase()+"@login.porikolpona.app";const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{login_id:login_id.toLowerCase(),name:name||"Student"}});if(error)throw error;
 const {error:ue}=await admin.from("profiles").update({name:name||"Student",academic_year:academic_year||"HSC 2027",college:college||""}).eq("id",data.user.id);if(ue)throw ue;
 await admin.from("activity_logs").insert({user_id:user.id,event:"created_student",details:{new_user_id:data.user.id,login_id:login_id.toLowerCase()}});
 return json({success:true,login_id:login_id.toLowerCase()});
 }catch(e){return json({error:e.message||"Server error"},500)}});
