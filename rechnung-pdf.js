/* Gemeinsamer Code: Rechnungs-PDF und Mailtext (für Rechnung und Rechnungen) */
(function () {
const fmt = n => n.toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
/* ---------- PDF ---------- */
const MM = v => v * 72 / 25.4, PH = 841.89;
const ANREDE = 'Sehr geehrte Damen und Herren,';
const EINLEITUNG = 'Für die von mir erbrachten pflegefachlichen Leistungen und Tätigkeiten stelle ich Ihnen nachfolgend mein vereinbartes Honorar in Rechnung.';
const logoCache = {};
const hexRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const v = m ? m[1] : '1F5A3A'; return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16)); };

async function logoBild(tint, logo) {
  const src = logo || 'logo-mark.png';
  const key = src.length + ':' + src.slice(-40) + tint.join(',');
  if (logoCache[key]) return logoCache[key];
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const h = 240, w = Math.max(1, Math.round(img.width * h / img.height));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = 'rgb(' + tint.join(',') + ')'; x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'multiply'; x.drawImage(img, 0, 0, w, h);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  return logoCache[key] = { bytes: new Uint8Array(await blob.arrayBuffer()), w, h };
}

async function baueRechnungPdf(D) {
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const { P, sum } = D;
  const nr = D.nr, name = D.name, fae = D.faellig;
  const doc = await PDFDocument.create();
  doc.setTitle('Rechnung ' + nr); if (name) doc.setAuthor(name);
  const pg = doc.addPage([595.28, PH]);
  const F = await doc.embedFont(StandardFonts.Helvetica), B = await doc.embedFont(StandardFonts.HelveticaBold);
  const c0 = hexRgb(D.farbe), GR = rgb(c0[0] / 255, c0[1] / 255, c0[2] / 255);
  const t255 = c0.map(v => Math.round(255 - (255 - v) * 0.14)), TINT = rgb(t255[0] / 255, t255[1] / 255, t255[2] / 255);
  const INK = rgb(.07, .07, .07), GRAY = rgb(.42, .47, .5), HAIR = rgb(.85, .87, .83);
  const safe = (s, f) => { let o = ''; for (const ch of String(s == null ? '' : s)) { try { f.encodeText(ch); o += ch; } catch (e) { const b = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); try { f.encodeText(b); o += b; } catch (e2) { o += '?'; } } } return o; };
  const W = (s, f, z) => f.widthOfTextAtSize(safe(s, f), z);
  const T = (s, x, y, o) => { o = o || {}; const f = o.f || F, z = o.z || 10, t = safe(s, f), w = f.widthOfTextAtSize(t, z);
    pg.drawText(t, { x: o.a === 'r' ? MM(x) - w : o.a === 'c' ? MM(x) - w / 2 : MM(x), y: PH - MM(y), size: z, font: f, color: o.c || INK }); };
  const R = (x, y, w, h, c) => pg.drawRectangle({ x: MM(x), y: PH - MM(y + h), width: MM(w), height: MM(h), color: c });
  const L = (x1, y, x2, t) => pg.drawLine({ start: { x: MM(x1), y: PH - MM(y) }, end: { x: MM(x2), y: PH - MM(y) }, thickness: t || .5, color: HAIR });
  const wrap = (s, f, z, wmm) => { const out = []; String(s).split('\n').forEach(par => { let line = ''; par.split(/\s+/).filter(Boolean).forEach(w => { const t = line ? line + ' ' + w : w; if (line && W(t, f, z) > MM(wmm)) { out.push(line); line = w; } else line = t; }); out.push(line); }); return out; };
  const wrapSeg = (segs, z, wmm) => { const lines = [[]]; let w = 0;
    segs.forEach(([t, f]) => t.split(/(\s+)/).forEach(tok => { if (!tok) return; const tw = W(tok, f, z), cur = lines[lines.length - 1];
      if (/^\s+$/.test(tok)) { if (cur.length) { const sw = W(' ', f, z); cur.push([' ', f, sw]); w += sw; } return; }
      if (w + tw > MM(wmm) && cur.length) { lines.push([]); w = 0; }
      lines[lines.length - 1].push([tok, f, tw]); w += tw; })); return lines; };

  // Kopfband
  R(0, 0, 210, 26, TINT); R(0, 24.8, 210, 1.2, GR);
  try {
    const lg = await logoBild(t255, D.logo), im = await doc.embedPng(lg.bytes);
    let hh = 18, ww = hh * lg.w / lg.h; if (ww > 70) { ww = 70; hh = ww * lg.h / lg.w; }
    pg.drawImage(im, { x: MM(15), y: PH - MM(3.5 + hh), width: MM(ww), height: MM(hh) });
  } catch (e) { if (name) T(name, 15, 15, { f: B, z: 14, c: GR }); }
  T('Honorarrechnung', 195, 16, { f: B, z: 22, c: GR, a: 'r' });

  // Daten: Empfänger links, Rechnungsdaten rechts
  const empf = D.empf.split('\n').map(s => s.trim()).filter(Boolean);
  T('Rechnungsempfänger', 15, 40, { z: 7.5, c: GRAY });
  let yl = 46; empf.forEach((l, i) => { T(l, 15, yl, { f: i ? F : B, z: 11 }); yl += 5; });
  const rows = [['Rechnungsnr.', nr, 1], ['Rechnungsdatum', D.datum], ['Leistungszeitraum', D.zeit], ['Bereich / Station', D.bereich], ['Steuernummer', D.steuer]].filter(r => r[1]);
  let yr = 40; rows.forEach(r => { T(r[0], 120, yr, { z: 9, c: GRAY }); T(r[1], 195, yr, { f: r[2] ? B : F, z: 10, a: 'r' }); L(120, yr + 1.6, 195, .4); yr += 5.6; });
  const y0 = Math.max(yl - 3, yr - 4);

  // Maße für die Anordnung
  const LH = 5.6, intro = wrap(EINLEITUNG, F, 11, 180);
  const items = P.map(p => ({ p, lines: wrap(p.t, F, 10, 101) })).map(o => Object.assign(o, { h: Math.max(9, o.lines.length * 4.6 + 4.4) }));
  const tableH = 8 + items.reduce((a, o) => a + o.h, 0) + 12;
  const pay = wrapSeg(fae ? [['Bitte überweisen Sie den Betrag bis zum ', F], [fae, B], [' unter Angabe der Rechnungsnummer auf das unten genannte Konto.', F]] : [['Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer auf das unten genannte Konto.', F]], 10, 180);
  const hint = wrap('Leistungen von Pflegefachkräften nach § 4 Nr. 14 UStG sind von der Umsatzsteuer befreit.', F, 10, 180);
  const endFor = G => y0 + G + 4 + 2 * LH + (intro.length - 1) * LH + LH + 1 + tableH + 9 + (hint.length + pay.length) * 4.8 + 6;
  let G = 33; if (endFor(G) > 258) G = Math.max(8, G - (endFor(G) - 258));

  // Anrede und Einleitung
  let y = y0 + G + 4;
  T(ANREDE, 15, y, { z: 11 });
  y += 2 * LH; intro.forEach((l, i) => T(l, 15, y + i * LH, { z: 11 })); y += (intro.length - 1) * LH + LH + 1;

  // Tabelle
  R(15, y, 180, 8, TINT);
  T('Leistung', 17, y + 5.4, { f: B, z: 9 }); T('Menge', 142, y + 5.4, { f: B, z: 9, a: 'r' }); T('Einzelpreis', 168, y + 5.4, { f: B, z: 9, a: 'r' }); T('Betrag', 193, y + 5.4, { f: B, z: 9, a: 'r' });
  y += 8;
  items.forEach(o => { const p = o.p;
    o.lines.forEach((l, i) => T(l, 17, y + 5.6 + i * 4.6, { z: 10 }));
    T(fmt(p.q) + ' ' + p.u, 142, y + 5.6, { z: 10, a: 'r' }); T(fmt(p.e) + ' €', 168, y + 5.6, { z: 10, a: 'r' }); T(fmt(Math.round(p.b * 100) / 100) + ' €', 193, y + 5.6, { z: 10, a: 'r' });
    y += o.h; L(15, y, 195, .5); });
  R(150, y + 2, 45, 9, TINT);
  T('Rechnungsbetrag', 147, y + 8.2, { f: B, z: 11, a: 'r' }); T(fmt(sum) + ' €', 193, y + 8.2, { f: B, z: 12, a: 'r' });
  y += 12 + 9;

  // Hinweis und Zahlung
  hint.forEach((l, i) => T(l, 15, y + i * 4.8, { z: 10 })); y += hint.length * 4.8 + 1.5;
  pay.forEach((ln, i) => { let x = MM(15); ln.forEach(([s, f, w]) => { pg.drawText(safe(s, f), { x, y: PH - MM(y + i * 4.8), size: 10, font: f, color: INK }); x += w; }); });

  // Fußband
  R(0, 265, 210, 32, TINT); R(0, 265, 210, 1.2, GR);
  const col = (x, kopf, zeilen) => { T(kopf.toUpperCase(), x, 272.5, { f: B, z: 6.5, c: GRAY }); let yy = 277.5; zeilen.forEach(z => { T(z.t, x, yy, { f: z.b ? B : F, z: 8.5, c: z.g ? GRAY : INK }); yy += 4.3; }); };
  const adr = D.adresse.split('\n').map(s => s.trim()).filter(Boolean);
  col(15, 'Anschrift', [{ t: name, b: 1 }].concat(adr.map(t => ({ t, g: 1 }))));
  col(72, 'Kontakt', [D.tel && 'Tel.: ' + D.tel, D.absMail].filter(Boolean).map(t => ({ t, g: 1 })));
  col(124, 'Bankverbindung', [D.kontoinhaber, D.bank, D.iban && 'IBAN: ' + D.iban, D.bic && 'BIC: ' + D.bic].filter(Boolean).map(t => ({ t })));
  return new Blob([await doc.save()], { type: 'application/pdf' });
}




function mailHref(D) {
  const dd = String(D.zeit || '').match(/\d{1,2}\.\d{1,2}\.\d{4}/g) || [];
  const zt = dd.length >= 2 ? 'für den Zeitraum vom ' + dd[0] + ' bis zum ' + dd[dd.length - 1] : dd.length === 1 ? 'für den Einsatz am ' + dd[0] : D.zeit ? 'für den Zeitraum ' + D.zeit : '';
  const body = 'Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie meine Rechnung Nr. ' + D.nr + (zt ? ' ' + zt : '') + '.\n\nIch bitte Sie, den Rechnungsbetrag in Höhe von ' + fmt(D.sum) + ' € bis zum ' + D.faellig + ' auf das in der Rechnung angegebene Konto zu überweisen.\n\nBei Rückfragen stehe ich Ihnen gerne zur Verfügung.\n\nIch bedanke mich für Ihr Vertrauen und würde mich freuen, auch künftig für Sie tätig sein zu dürfen.\n\nMit freundlichen Grüßen\n\n' + (D.mailName || D.name);
  return 'mailto:' + encodeURIComponent(D.mail || '').replace('%40', '@') + '?subject=' + encodeURIComponent('Rechnung Nr. ' + D.nr) + '&body=' + encodeURIComponent(body);
}
const pdfName = D => 'Rechnung-' + String(D.nr || 'neu').replace(/[^\w.-]+/g, '_') + '.pdf';
function recToD(rec) {
  let md = {}; try { md = JSON.parse(localStorage.getItem('meineDaten') || '{}') || {}; } catch (e) {}
  const a = rec.absender || {};
  return { nr: rec.nr, datum: rec.datum, faellig: rec.faellig, zeit: rec.zeitraum || '', empf: rec.empfaenger || '', mail: rec.mail || '', bereich: rec.bereich || '',
    P: rec.positionen || [], sum: rec.summe || 0, name: a.name || md.mName || '', mailName: md.mMailName || '', adresse: a.adresse || '', tel: a.tel || '', absMail: a.mail || '', steuer: a.steuer || '',
    kontoinhaber: a.kontoinhaber || '', bank: a.bank || '', iban: a.iban || '', bic: a.bic || '', farbe: a.farbe || md.mFarbe || '#1F5A3A', logo: md.logo || '' };
}
window.RE = { pdf: baueRechnungPdf, mailHref, pdfName, recToD };
})();
