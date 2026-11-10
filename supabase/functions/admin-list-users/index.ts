import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const url=Deno.env.get("SUPABASE_URL")!, service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer /i,"");const {data:{user},error:ae}=await admin.auth.getUser(token);if(ae||!user)return json({error:"Invalid session"},401);
 const {data:actor}=await admin.from("profiles").select("role,active").eq("id",user.id).single();if(actor?.role!=="admin"||!actor.active)return json({error:"Administrator access required"},403);
 const {data,error}=await admin.from("profiles").select("id,login_id,role,active,name,academic_year,college,created_at").order("created_at",{ascending:false});if(error)throw error;return json({users:data});
 }catch(e){return json({error:e.message||"Server error"},500)}});
