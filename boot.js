/* Blendet die Seite sofort aus, wenn die App gesperrt ist (kein Aufblitzen der Daten) */
(function () {
  try {
    if (localStorage.getItem('pinHash') && Date.now() > +(sessionStorage.getItem('unlockedUntil') || 0)) {
      var s = document.createElement('style'); s.id = 'lockhide'; s.textContent = 'body{visibility:hidden}';
      document.head.appendChild(s);
    }
  } catch (e) {}
})();
