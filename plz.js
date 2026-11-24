/* Bundesland aus Postleitzahl und Ort erkennen (Näherung, für Feiertage) */
(function () {
  var NAMEN = { BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen', MV: 'Mecklenburg-Vorpommern', NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland', SN: 'Sachsen', ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thüringen' };
  var Z = {};
  function zone(von, bis, land) { for (var i = von; i <= bis; i++) Z[(i < 10 ? '0' : '') + i] = land; }
  zone(1, 2, 'SN'); zone(3, 3, 'BB'); zone(4, 4, 'SN'); zone(6, 6, 'ST'); zone(7, 7, 'TH'); zone(8, 9, 'SN');
  zone(10, 13, 'BE'); zone(14, 16, 'BB'); zone(17, 19, 'MV'); zone(20, 20, 'HH'); zone(21, 21, 'NI'); zone(22, 25, 'SH');
  zone(26, 31, 'NI'); zone(32, 33, 'NW'); zone(34, 36, 'HE'); zone(37, 38, 'NI'); zone(39, 39, 'ST');
  zone(40, 48, 'NW'); zone(49, 49, 'NI'); zone(50, 53, 'NW'); zone(54, 56, 'RP'); zone(57, 59, 'NW');
  zone(60, 65, 'HE'); zone(66, 66, 'SL'); zone(67, 67, 'RP'); zone(68, 79, 'BW'); zone(80, 87, 'BY');
  zone(88, 89, 'BW'); zone(90, 97, 'BY'); zone(98, 99, 'TH');
  /* Ausnahmen, wo Postleitzahlgebiete über Landesgrenzen reichen: [von, bis, Land] */
  var A = [[1945, 1998, 'BB'], [4600, 4639, 'TH'], [4890, 4999, 'BB'], [6556, 6578, 'TH'], [7919, 7919, 'SN'], [7952, 7952, 'SN'], [7985, 7985, 'SN'],
    [12529, 12529, 'BB'], [14000, 14199, 'BE'], [17268, 17268, 'BB'], [17279, 17279, 'BB'], [17291, 17291, 'BB'], [17326, 17326, 'BB'], [17337, 17337, 'BB'],
    [19309, 19309, 'BB'], [19322, 19359, 'BB'], [21029, 21039, 'HH'], [21073, 21149, 'HH'], [21465, 21529, 'SH'], [22041, 22769, 'HH'], [23930, 23999, 'MV'],
    [27498, 27498, 'SH'], [27568, 27580, 'HB'], [28195, 28779, 'HB'], [29410, 29416, 'ST'], [34346, 34355, 'NI'], [34414, 34439, 'NW'], [36404, 36469, 'TH'],
    [37213, 37299, 'HE'], [37308, 37359, 'TH'], [38820, 38899, 'ST'], [48455, 48455, 'NI'], [48465, 48465, 'NI'], [48480, 48480, 'NI'], [48499, 48499, 'NI'], [48527, 48529, 'NI'],
    [49477, 49549, 'NW'], [53400, 53579, 'RP'], [57500, 57699, 'RP'], [63700, 63999, 'BY'], [66480, 66509, 'RP'], [66840, 66999, 'RP'],
    [68519, 68519, 'HE'], [68623, 68649, 'HE'], [69434, 69434, 'HE'], [69483, 69483, 'HE'], [69509, 69518, 'HE'], [76720, 76999, 'RP'],
    [88130, 88179, 'BY'], [89200, 89499, 'BY'], [96500, 96529, 'TH'], [97877, 97877, 'BW'], [97896, 97897, 'BW'], [97920, 97999, 'BW']];
  var STADT = [[/^bremerhaven|^bremen\b/, 'HB'], [/^hamburg\b/, 'HH'], [/^berlin\b/, 'BE']];
  function land(plz, ort) {
    var o = String(ort || '').trim().toLowerCase();
    for (var s = 0; s < STADT.length; s++) if (STADT[s][0].test(o)) return STADT[s][1];
    var n = parseInt(plz, 10); if (isNaN(n)) return '';
    for (var i = 0; i < A.length; i++) if (n >= A[i][0] && n <= A[i][1]) return A[i][2];
    return Z[String(plz).slice(0, 2)] || '';
  }
  /* sucht die letzte fünfstellige Postleitzahl im Text (Anschrift) und den Ort dahinter */
  function detect(text) {
    var re = /(^|[^\d])(\d{5})(?!\d)[ \t]*([^\n,]*)/g, m, last = null;
    while ((m = re.exec(String(text || '')))) last = m;
    return last ? land(last[2], last[3]) : '';
  }
  window.PLZ = { NAMEN: NAMEN, land: land, detect: detect };
})();
