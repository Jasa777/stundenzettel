(function () {
  var p = location.pathname.split('/').pop() || 'index.html';
  var cur = { 'index.html': 'index', 'stundenzettel.html': 'stz', 'rechnung.html': 're', 'rechnungen.html': 're', 'adressbuch.html': 'kd', 'sicherung.html': 'si' }[p] || '';
  var I = {
    index: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    stz: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    re: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    kd: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c2.8.2 4.5 2.2 4.5 5"/>',
    si: '<path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.8 3.8 0 0 1 17 18z"/><path d="M12 16v-6M9.5 12.5L12 10l2.5 2.5"/>'
  };
  var T = [['index.html', 'index', 'Start'], ['stundenzettel.html', 'stz', 'Stundenzettel'], ['rechnungen.html', 're', 'Rechnungen'], ['adressbuch.html', 'kd', 'Kunden'], ['sicherung.html', 'si', 'Sicherung']];
  var h = document.createElement('a');
  h.className = 'appbar'; h.href = 'index.html'; h.setAttribute('aria-label', 'Zur Startseite');
  h.innerHTML = '<img src="logo-mark.png" alt=""><i></i><b>Semira Faktura</b>';
  document.body.insertBefore(h, document.body.firstChild);
  var n = document.createElement('nav');
  n.className = 'tabbar'; n.setAttribute('aria-label', 'Hauptmenü');
  n.innerHTML = T.map(function (t) {
    return '<a href="' + t[0] + '"' + (t[1] === cur ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + I[t[1]] + '</svg>' + t[2] + '</a>';
  }).join('');
  document.body.appendChild(n);
})();
