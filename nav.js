(function () {
  var p = location.pathname.split('/').pop() || 'index.html';
  var cur = { 'index.html': 'index', 'stundenzettel.html': 'stz', 'rechnung.html': '', 'rechnungen.html': 're', 'adressbuch.html': 'kd', 'sicherung.html': 'si', 'meine-daten.html': '' }[p] || '';
  var I = {
    index: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    stz: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    re: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    kd: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14c2.8.2 4.5 2.2 4.5 5"/>',
    si: '<path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.8 3.8 0 0 1 17 18z"/><path d="M12 16v-6M9.5 12.5L12 10l2.5 2.5"/>'
  };
  var T = [['index.html', 'index', 'Start'], ['stundenzettel.html', 'stz', 'Stundenzettel'], ['rechnungen.html', 're', 'Übersicht'], ['adressbuch.html', 'kd', 'Kunden'], ['sicherung.html', 'si', 'Sicherung']];
  var h = document.createElement('a');
  h.className = 'appbar'; h.href = 'index.html'; h.setAttribute('aria-label', 'Zur Startseite');
  h.innerHTML = '<img src="logo-mark.png" alt=""><i></i><b>SemiraCareOffice</b>' + (cur === 'index' ? '' : '<span class="back">‹ Startseite</span>');
  document.body.insertBefore(h, document.body.firstChild);
  var n = document.createElement('nav');
  n.className = 'tabbar'; n.setAttribute('aria-label', 'Hauptmenü');
  n.innerHTML = T.map(function (t) {
    return '<a href="' + t[0] + '"' + (t[1] === cur ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + I[t[1]] + '</svg>' + t[2] + '</a>';
  }).join('');
  document.body.appendChild(n);
})();

/* ---------- App-Sperre, Version, Betrieb ohne Netz ---------- */
(function () {
  var VERSION = '2026-11-23.2', LOCK_MS = 5 * 60000;
  window.APP_VERSION = VERSION;
  var ls = window.localStorage, ss = window.sessionStorage;
  function pinSet() { try { return !!ls.getItem('pinHash'); } catch (e) { return false; } }
  function touch() { try { ss.setItem('unlockedUntil', String(Date.now() + LOCK_MS)); } catch (e) {} }
  function needLock() { try { return pinSet() && Date.now() > +(ss.getItem('unlockedUntil') || 0); } catch (e) { return false; } }
  async function hashPin(pin, salt) {
    var txt = salt + ':' + pin;
    if (window.crypto && crypto.subtle) {
      var b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
      return Array.from(new Uint8Array(b)).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    }
    var h = 5381; for (var i = 0; i < txt.length; i++) h = ((h << 5) + h + txt.charCodeAt(i)) | 0; return 'x' + h;
  }
  async function verify(pin) { return (await hashPin(pin, ls.getItem('pinSalt') || '')) === ls.getItem('pinHash'); }
  async function setPin(pin) {
    var salt = Array.from(crypto.getRandomValues ? crypto.getRandomValues(new Uint8Array(12)) : [Date.now() % 255]).join('-');
    ls.setItem('pinSalt', salt); ls.setItem('pinHash', await hashPin(pin, salt)); ls.removeItem('pinFail'); touch();
  }
  function clearPin() { ls.removeItem('pinHash'); ls.removeItem('pinSalt'); ls.removeItem('pinFail'); }
  window.AppLock = { verify: verify, setPin: setPin, clearPin: clearPin, touch: touch, isSet: pinSet };

  function unlock() {
    var o = document.getElementById('lock'); if (o) o.remove();
    var h = document.getElementById('lockhide'); if (h) h.remove();
    touch();
  }
  function showLock() {
    if (document.getElementById('lock')) return;
    var o = document.createElement('div'); o.id = 'lock';
    o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'App gesperrt');
    o.style.cssText = 'position:fixed;inset:0;z-index:2000;background:#FBF7EC;visibility:visible;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,sans-serif;color:#1B2B22;touch-action:manipulation';
    o.innerHTML = '<img src="logo-mark.png" alt="" style="height:64px;margin-bottom:8px"><div style="font:600 1.3rem Georgia,serif;color:#1F5A3A">SemiraCareOffice</div>' +
      '<p style="margin:14px 0 8px">Bitte Code eingeben</p><div id="ldots" style="display:flex;gap:14px;margin:6px 0 10px"></div>' +
      '<p id="lmsg" role="alert" style="min-height:1.4em;color:#B42318;margin:0 0 8px;text-align:center"></p>' +
      '<div id="lpad" style="display:grid;grid-template-columns:repeat(3,76px);gap:12px"></div>' +
      '<button id="lforgot" style="margin-top:18px;background:none;border:0;color:#1F5A3A;text-decoration:underline;font:inherit;padding:10px">Code vergessen?</button>';
    document.body.appendChild(o);
    var code = '', busy = false, dots = o.querySelector('#ldots'), msg = o.querySelector('#lmsg');
    function draw() { dots.innerHTML = [0, 1, 2, 3].map(function (i) { return '<span style="width:16px;height:16px;border-radius:50%;border:2px solid #1F5A3A;background:' + (i < code.length ? '#1F5A3A' : 'transparent') + '"></span>'; }).join(''); }
    function fail() { try { return JSON.parse(ls.getItem('pinFail') || '{"n":0,"until":0}'); } catch (e) { return { n: 0, until: 0 }; } }
    async function pruefen() {
      var f = fail(), now = Date.now();
      if (now < f.until) { msg.textContent = 'Zu viele Versuche. Bitte ' + Math.ceil((f.until - now) / 1000) + ' Sekunden warten.'; code = ''; draw(); return; }
      busy = true; var ok = await verify(code); busy = false;
      if (ok) { ls.removeItem('pinFail'); unlock(); return; }
      f.n++; if (f.n % 5 === 0) f.until = now + Math.min(900000, 30000 * Math.pow(2, f.n / 5 - 1));
      ls.setItem('pinFail', JSON.stringify(f));
      msg.textContent = 'Falscher Code.' + (f.n % 5 === 0 ? ' Bitte kurz warten.' : ''); code = ''; draw();
    }
    function press(d) { if (busy) return; msg.textContent = ''; if (d === 'x') code = code.slice(0, -1); else if (code.length < 4) code += d; draw(); if (code.length === 4) pruefen(); }
    var pad = o.querySelector('#lpad');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'x'].forEach(function (d) {
      if (d === '') { pad.appendChild(document.createElement('span')); return; }
      var b = document.createElement('button'); b.type = 'button'; b.textContent = d === 'x' ? '⌫' : d; b.setAttribute('aria-label', d === 'x' ? 'Löschen' : 'Ziffer ' + d);
      b.style.cssText = 'height:60px;border-radius:16px;border:1.5px solid #1F5A3A;background:#fff;color:#1B2B22;font:600 1.4rem system-ui,sans-serif';
      b.addEventListener('click', function () { press(d); }); pad.appendChild(b);
    });
    o.addEventListener('keydown', function (e) { if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('x'); });
    o.querySelector('#lforgot').addEventListener('click', function () {
      if (!confirm('Code vergessen?\n\nDer Code lässt sich nicht wiederherstellen. Es bleibt nur, ALLE Daten auf diesem Gerät zu löschen und danach deine Sicherung einzuspielen.\n\nAlle Daten auf diesem Gerät löschen?')) return;
      if (!confirm('Letzte Bestätigung: Wirklich ALLE Daten auf diesem Gerät löschen? Zurück geht es nur mit einer Sicherung.')) return;
      ls.clear(); ss.clear(); location.href = 'sicherung.html';
    });
    draw();
  }
  if (needLock()) showLock(); else { var h = document.getElementById('lockhide'); if (h) h.remove(); if (pinSet()) touch(); }
  var last = 0;
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { var n = Date.now(); if (n - last > 5000 && !needLock()) { last = n; touch(); } }, { passive: true });
  });
  setInterval(function () { if (needLock()) showLock(); }, 5000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && needLock()) showLock(); });
  window.addEventListener('pageshow', function () { if (needLock()) showLock(); });

  var v = document.getElementById('ver'); if (v) v.textContent = 'Version ' + VERSION;
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js').catch(function () {});
})();

/* ---------- Sicherung mit einem Tipp (wird nach einer Rechnung angeboten) ---------- */
(function () {
  var KEYS = ['stundenzettel', 'meineDaten', 'rechnungen', 'adressbuch', 'geloeschtLog'];
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); }
  window.AppBackup = {
    sichern: async function () {
      var jetzt = new Date().toISOString(), o = { _app: 'pflege-abrechnung', _stand: jetzt };
      KEYS.forEach(function (k) { var v = localStorage.getItem(k); if (v) o[k] = JSON.parse(v); });
      var name = 'sicherung-' + jetzt.slice(0, 10) + '.json', file = new File([JSON.stringify(o)], name, { type: 'application/json' });
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'Sicherung SemiraCareOffice' });
        else { var a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
        localStorage.setItem('sicherungInfo', JSON.stringify({ hash: hash(KEYS.map(function (k) { return localStorage.getItem(k) || ''; }).join('|')), zeit: jetzt }));
        return 'ok';
      } catch (e) { return e && e.name === 'AbortError' ? 'abbruch' : 'fehler'; }
    }
  };
})();
