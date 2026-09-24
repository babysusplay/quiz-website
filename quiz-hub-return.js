/* Quiz -> Sus Games shared session bridge. */
(() => {
  'use strict';
  const URL='https://wnjsajfahsqunfesmetu.supabase.co';
  const KEY='sb_publishable_S_ePD9oEegH0R0XR8LGvjQ_sMs9OZSm';
  const HUB='https://babysusplay.github.io/sus-games/';
  const load=()=>new Promise((resolve,reject)=>{if(window.supabase){resolve();return}const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  const boot=async()=>{try{await load();const sb=window.supabase.createClient(URL,KEY);const h=new URLSearchParams(location.hash.replace(/^#/,''));const access=h.get('access_token'),refresh=h.get('refresh_token');if(access&&refresh){const {error}=await sb.auth.setSession({access_token:access,refresh_token:refresh});if(!error)history.replaceState(null,'',location.pathname+location.search)}const {data:{session}}=await sb.auth.getSession();if(!session?.user)return;if(history.state?.susQuizBack!==true){history.pushState({susQuizBack:true},'',location.href)}window.addEventListener('popstate',()=>{location.href=HUB})}catch(e){console.warn('[Sus Games Quiz bridge]',e)}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
