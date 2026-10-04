/* ============================================================
   Firebase yapılandırması — cihazlar arası eşitleme için

   Değerler Firebase konsolundaki "Web uygulaması" ekranından alınır
   (Project settings → Your apps → SDK setup and configuration).

   Bu dosya null olduğu sürece eşitleme TAMAMEN kapalıdır: site
   bugünkü gibi, yalnız tarayıcının kendi deposuyla çalışır.

   Not: apiKey gizli bir anahtar değildir — tarayıcıya zaten inen,
   projeyi tanıtan bir kimliktir. Veriyi koruyan şey Firestore
   güvenlik kurallarıdır (bkz. README).
   ============================================================ */
window.FIREBASE_AYAR = {
  apiKey: "AIzaSyAh68raW4JmQ8x94wkOuq_I2m9M5eD_JOk",
  authDomain: "yds-hazirlik-d05ce.firebaseapp.com",
  projectId: "yds-hazirlik-d05ce",
  storageBucket: "yds-hazirlik-d05ce.firebasestorage.app",
  messagingSenderId: "706491696405",
  appId: "1:706491696405:web:2891ef99dd426c84c9d51c"
};
