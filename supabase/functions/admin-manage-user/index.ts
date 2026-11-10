import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
const url=Deno.env.get("SUPABASE_URL")!,service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});try{
 const token=(req.headers.get("Authorization")||"").replace(/^Bearer /i,"");const {data:{user},error:ae}=await admin.auth.getUser(token);if(ae||!user)return json({error:"Invalid session"},401);
 const {data:actor}=await admin.from("profiles").select("role,active").eq("id",user.id).single();if(actor?.role!=="admin"||!actor.active)return json({error:"Administrator access required"},403);
 const {action,user_id,password,active}=await req.json();if(!user_id)return json({error:"user_id required"},400);
 const {data:target}=await admin.from("profiles").select("role").eq("id",user_id).single();if(!target||target.role==="admin")return json({error:"This account cannot be modified here"},403);
 if(action==="set_active"){const {error}=await admin.from("profiles").update({active:!!active}).eq("id",user_id);if(error)throw error;return json({message:active?"Account activated":"Account deactivated"});}
 if(action==="reset_password"){if(typeof password!=="string"||password.length<12)return json({error:"Password must be at least 12 characters"},400);const {error}=await admin.auth.admin.updateUserById(user_id,{password});if(error)throw error;return json({message:"Password reset successfully"});}
 if(action==="delete_user"){const {error}=await admin.auth.admin.deleteUser(user_id);if(error)throw error;return json({message:"Student account deleted"});}
 return json({error:"Unknown action"},400);
 }catch(e){return json({error:e.message||"Server error"},500)}});
