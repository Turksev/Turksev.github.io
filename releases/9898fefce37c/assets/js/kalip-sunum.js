/* Kalıpların metnini ve sırasını koruyarak iki görünürlük grubuna ayırır. */
(function (root) {
  'use strict';
  function ozet(pairs) {
    var text = JSON.stringify(pairs.map(function (p) { return [p.en, p.tr]; }));
    var hash = 2166136261;
    for (var i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(16);
  }
  function ayir(word, pairs, metadata) {
    pairs = Array.isArray(pairs) ? pairs : [];
    var result = { temel: pairs.slice(), diger: [] };
    var data = metadata || root.KALIP_SUNUM;
    if (!data || data.schema_version !== 1 || !data.words ||
        !Object.prototype.hasOwnProperty.call(data.words, word)) return result;
    var rule = data.words[word];
    if (!rule || typeof rule !== 'object') return result;
    var indices = rule.secondary;
    // Eski/eksik sunum verisi herhangi bir kalıbı gizlememeli.
    if (rule.count !== pairs.length || rule.hash !== ozet(pairs) || !Array.isArray(indices) ||
        !indices.length || indices.length >= pairs.length ||
        indices.some(function (n, i) { return !Number.isInteger(n) || n < 0 || n >= pairs.length || indices.indexOf(n) !== i; })) return result;
    result.temel = []; result.diger = [];
    pairs.forEach(function (pair, i) { (indices.indexOf(i) === -1 ? result.temel : result.diger).push(pair); });
    return result;
  }
  function escape(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function liste(pairs, options, primary) {
    if (!pairs.length) return '';
    if (options.list) return '<ul class="sozluk-kalip' + (primary ? ' kalip-temel' : '') + '">' + pairs.map(function (p) {
      return '<li><b lang="en">' + escape(p.en) + '</b> ' + escape(p.tr) + '</li>';
    }).join('') + '</ul>';
    return '<div class="kalip' + (options.centered ? ' ust' : '') + (primary ? ' kalip-temel' : '') + '">' + pairs.map(function (p) {
      return '<span><b lang="en">' + escape(p.en) + '</b><i>' + escape(p.tr) + '</i></span>';
    }).join('') + '</div>';
  }
  function html(word, pairs, options) {
    options = options || {};
    var groups = ayir(word, pairs), primary = options.part !== 'secondary' ? liste(groups.temel, options, true) : '';
    if (options.part === 'primary' || !groups.diger.length) return primary;
    return primary + '<details class="kalip-diger"><summary>Diğer kullanımlar <span class="kalip-adet">(' +
      groups.diger.length + ')</span></summary>' + liste(groups.diger, options, false) + '</details>';
  }
  var api = { ozet: ozet, ayir: ayir, html: html };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.YDS = root.YDS || {}; root.YDS.KalipSunum = api;
})(typeof window === 'object' ? window : globalThis);
