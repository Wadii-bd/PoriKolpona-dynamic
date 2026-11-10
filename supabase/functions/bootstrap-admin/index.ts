import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const url=Deno.env.get("SUPABASE_URL")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 const {login_id,password,name,bootstrap_secret}=await req.json();
 if(!Deno.env.get("BOOTSTRAP_SECRET")||bootstrap_secret!==Deno.env.get("BOOTSTRAP_SECRET"))return json({error:"Invalid setup secret"},403);
 const {count,error:ce}=await admin.from("profiles").select("id",{count:"exact",head:true}).eq("role","admin");if(ce)throw ce;if((count||0)>0)return json({error:"An administrator already exists. Bootstrap is closed."},409);
 if(!/^[a-zA-Z0-9._-]{3,48}$/.test(login_id||"")||typeof password!=="string"||password.length<12)return json({error:"Use a 3-48 character Login ID and a password of at least 12 characters."},400);
 const email=login_id.toLowerCase()+"@login.porikolpona.app";const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{login_id:login_id.toLowerCase(),name:name||"PoriKolpona Admin"}});if(error)throw error;
 const {error:ue}=await admin.from("profiles").update({role:"admin",name:name||"PoriKolpona Admin"}).eq("id",data.user.id);if(ue)throw ue;
 return json({success:true,login_id:login_id.toLowerCase(),message:"Admin created. Remove BOOTSTRAP_SECRET after setup."});
 }catch(e){return json({error:e.message||"Server error"},500)}});
