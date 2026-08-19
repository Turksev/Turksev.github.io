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
window.FIREBASE_AYAR = null;
