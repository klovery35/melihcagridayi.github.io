import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, collection, doc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const EMOJIS = ['❤️','🔥','👏','🤩'];
let db, auth, user = null, initError = null;
const mounted = new WeakMap();

function message(root, text) {
  const target = root.querySelector('.reaction-message');
  if (target) target.textContent = text;
}
function mount(root) {
  if (mounted.has(root)) return;
  const id = root.dataset.reactionId;
  const holder = root.querySelector('.reaction-buttons');
  if (!id || !holder) return;
  if (initError) { message(root, 'Firebase bağlantısı kurulamadı. Konsolu kontrol et.'); return; }
  if (!db || !user) { message(root, 'Tepkiler yükleniyor...'); return; }
  const buttons = EMOJIS.map(emoji => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'reaction-button';
    btn.textContent = emoji + ' 0';
    btn.setAttribute('aria-label', emoji + ' tepkisi');
    btn.addEventListener('click', async () => {
      buttons.forEach(b => b.disabled = true);
      try {
        await setDoc(doc(db, 'reactions', id, 'votes', user.uid), {emoji});
        message(root, 'Tepkin kaydedildi. Başka bir emoji seçerek değiştirebilirsin.');
      } catch (err) {
        console.error('Tepki kaydı:', err);
        message(root, 'Kaydedilemedi: ' + (err.code || 'Bağlantı hatası'));
      } finally { buttons.forEach(b => b.disabled = false); }
    });
    holder.append(btn);
    return btn;
  });
  mounted.set(root, true);
  message(root, 'Her oyun veya proje için bir emoji seçebilirsin.');
  onSnapshot(collection(db, 'reactions', id, 'votes'), snapshot => {
    const counts = Object.fromEntries(EMOJIS.map(e => [e,0]));
    let selected = null;
    snapshot.forEach(vote => {
      const emoji = vote.data().emoji;
      if (Object.prototype.hasOwnProperty.call(counts, emoji)) counts[emoji]++;
      if (vote.id === user.uid) selected = emoji;
    });
    EMOJIS.forEach((emoji,i) => {
      buttons[i].textContent = `${emoji} ${counts[emoji]}`;
      buttons[i].setAttribute('aria-pressed', String(emoji === selected));
    });
  }, err => {
    console.error('Tepki okuma:', err);
    message(root, 'Tepkiler okunamadı: ' + (err.code || 'Bağlantı hatası'));
  });
}
function mountAll() { document.querySelectorAll('.reaction-widget').forEach(mount); }
window.KloveryReactions = { mount };
window.dispatchEvent(new Event('klovery-reactions-ready'));
try {
  const config = window.KLOVERY_FIREBASE_CONFIG;
  if (!config?.apiKey || !config?.projectId) throw Error('Firebase yapılandırması bulunamadı');
  const app = initializeApp(config);
  db = getFirestore(app);
  auth = getAuth(app);
  onAuthStateChanged(auth, async account => {
    if (account) { user = account; mountAll(); window.dispatchEvent(new Event('klovery-auth-ready')); }
    else {
      try { await signInAnonymously(auth); }
      catch (err) { console.error('Anonim giriş:',err); initError = err; mountAll(); }
    }
  }, err => { initError = err; console.error('Auth:',err); mountAll(); });
} catch (err) { initError = err; console.error('Firebase başlatma:',err); mountAll(); }
