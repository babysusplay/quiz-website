/* Quiz -> Sus Games shared session bridge + return button. */
(() => {
  'use strict';
  const URL='https://wnjsajfahsqunfesmetu.supabase.co';
  const KEY='sb_publishable_S_ePD9oEegH0R0XR8LGvjQ_sMs9OZSm';
  const HUB='https://babysusplay.github.io/sus-games/';
  const load=()=>new Promise((resolve,reject)=>{if(window.supabase){resolve();return}const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  const boot=async()=>{try{await load();const sb=window.supabase.createClient(URL,KEY);const h=new URLSearchParams(location.hash.replace(/^#/,''));const access=h.get('access_token'),refresh=h.get('refresh_token');if(access&&refresh){const {error}=await sb.auth.setSession({access_token:access,refresh_token:refresh});if(!error)history.replaceState(null,'',location.pathname+location.search)}const {data:{session}}=await sb.auth.getSession();if(!session?.user)return;if(!document.getElementById('susHubBack')){const b=document.createElement('button');b.id='susHubBack';b.textContent='Sus Games';b.title='Back to Sus Games';b.style.cssText='position:fixed;right:18px;bottom:18px;z-index:99999;border:1px solid rgba(139,92,246,.45);background:#171a22;color:#fff;border-radius:11px;padding:9px 13px;font-weight:800;cursor:pointer;box-shadow:0 8px 25px rgba(0,0,0,.3)';b.onclick=()=>location.href=HUB;document.body.appendChild(b)}}catch(e){console.warn('[Sus Games Quiz bridge]',e)}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
