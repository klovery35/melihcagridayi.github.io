import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const EMOJIS=['❤️','🔥','👏','🤩'];
const config=window.KLOVERY_FIREBASE_CONFIG;
let db=null, auth=null, currentUser=null, initialized=false;
const subscriptions=new WeakMap();
if(config?.apiKey && config?.projectId){
  try {
    const app=initializeApp(config); db=getFirestore(app);auth=getAuth(app);
    onAuthStateChanged(auth,user=>{currentUser=user;document.querySelectorAll('.reaction-widget').forEach(mount);});
    signInAnonymously(auth).catch(err=>console.error('Anonim giriş:',err));
    initialized=true;
  } catch(err){console.error('Firebase başlatılamadı:',err);}
}
function mount(root){
  if(subscriptions.has(root))return;
  const id=root.dataset.reactionId;
  if(!id)return;
  const buttons=root.querySelector('.reaction-buttons');
  const message=root.querySelector('.reaction-message');
  buttons.replaceChildren();
  const refs=[];
  for(const emoji of EMOJIS){
    const button=document.createElement('button');button.type='button';button.className='reaction-button';button.textContent=emoji+' 0';button.setAttribute('aria-label',emoji+' tepkisi');button.disabled=!initialized||!currentUser;
    button.addEventListener('click',async()=>{
      if(!currentUser)return;
      buttons.querySelectorAll('button').forEach(b=>b.disabled=true);
      try{await setDoc(doc(db,'reactions',id,'votes',currentUser.uid),{emoji});message.textContent='Tepkin kaydedildi. İstersen değiştirebilirsin.';}
      catch(err){console.error(err);message.textContent='Tepki kaydedilemedi. Firebase ayarlarını kontrol et.';}
      finally{buttons.querySelectorAll('button').forEach(b=>b.disabled=false);}
    });buttons.append(button);refs.push(button);
  }
  if(!initialized){message.textContent='Emoji tepkileri Firebase kurulunca aktif olacak.';return;}
  if(!currentUser){message.textContent='Tepkiler hazırlanıyor...';return;}
  message.textContent='Her çalışma için bir emoji seçebilirsin.';
  const unsubscribe=onSnapshot(collection(db,'reactions',id,'votes'),snapshot=>{
    const counts=Object.fromEntries(EMOJIS.map(e=>[e,0]));let selected=null;
    snapshot.forEach(d=>{const emoji=d.data().emoji;if(emoji in counts)counts[emoji]++;if(d.id===currentUser.uid)selected=emoji;});
    EMOJIS.forEach((emoji,i)=>{refs[i].textContent=`${emoji} ${counts[emoji]}`;refs[i].setAttribute('aria-pressed',String(selected===emoji));refs[i].disabled=false;});
  },err=>{console.error(err);message.textContent='Tepkiler okunamadı. Firestore kurallarını kontrol et.';});
  subscriptions.set(root,unsubscribe);
}
window.KloveryReactions={mount};
window.dispatchEvent(new Event('klovery-reactions-ready'));
