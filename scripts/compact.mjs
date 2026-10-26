#!/usr/bin/env node
/**
 * Turns the grabbers' guide XML files (one per shard) into one small JSON per
 * country for the GBLiNE app: { generated_at, channels: { "<channel id>": [[startMinute, lengthMinutes, "Title"], …] } }
 * Times are minutes since 1970 (UTC). Only programmes from 3 hours ago to
 * 3 days ahead are kept. A channel grabbed from two sites ("<id>" and the
 * backup "<id>@GBALT") keeps the list that covers the most programmes.
 *
 *   node scripts/compact.mjs <outDir> guide-0.xml guide-1.xml …
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const [outDir = 'out/epg', ...inputs] = process.argv.slice(2);
if (!inputs.length) inputs.push('guide.xml');
const countries = JSON.parse(await readFile('channel-countries.json', 'utf8'));
const now = Date.now();
const from = now - 3 * 3600e3;
const to = now + 3 * 86400e3;

const decode = (text) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&')
    .trim();

function parseTime(value) {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?\s*([+-]\d{4})?/.exec(value || '');
  if (!m) return NaN;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  if (!m[7]) return utc;
  const sign = m[7][0] === '-' ? -1 : 1;
  const offset = sign * (parseInt(m[7].slice(1, 3), 10) * 60 + parseInt(m[7].slice(3), 10));
  return utc - offset * 60e3;
}

// "<id>" or "<id>@GBALT" (or an old-style "<id>@<feed>") → programmes, from every input file.
const bySource = new Map();
const re = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/g;
for (const input of inputs) {
  let xml;
  try {
    xml = await readFile(input, 'utf8');
  } catch {
    console.warn(`skipped ${input} (missing)`);
    continue;
  }
  let match;
  while ((match = re.exec(xml))) {
    const attrs = Object.fromEntries([...match[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
    const source = decode(attrs.channel || '');
    if (!countries[source.split('@')[0]]) continue;
    const start = parseTime(attrs.start);
    const stop = parseTime(attrs.stop);
    if (!(stop > from && start < to) || !(stop > start)) continue;
    const title = decode((/<title[^>]*>([\s\S]*?)<\/title>/.exec(match[2]) || [])[1] || '');
    if (!title) continue;
    const list = bySource.get(source) || [];
    list.push([Math.round(start / 60e3), Math.round((stop - start) / 60e3), title.slice(0, 120)]);
    bySource.set(source, list);
  }
}

// Per channel, the source that covers the most minutes from now on wins.
const minuteNow = Math.round(now / 60e3);
const coverage = (list) => list.reduce((sum, [start, length]) => sum + Math.max(0, start + length - Math.max(start, minuteNow)), 0);
const best = new Map();
for (const [source, list] of bySource) {
  const id = source.split('@')[0];
  const seen = new Set();
  const clean = list
    .sort((a, b) => a[0] - b[0])
    .filter(([start]) => !seen.has(start) && seen.add(start));
  const current = best.get(id);
  if (!current || coverage(clean) > coverage(current)) best.set(id, clean);
}

const byCountry = {};
let total = 0;
for (const [id, list] of best) {
  (byCountry[countries[id]] ||= {})[id] = list;
  total += list.length;
}

await mkdir(outDir, { recursive: true });
const index = {};
for (const [country, channels] of Object.entries(byCountry)) {
  await writeFile(`${outDir}/${country}.json`, JSON.stringify({ generated_at: new Date().toISOString(), channels }));
  index[country] = Object.keys(channels).length;
}
await writeFile(`${outDir}/index.json`, JSON.stringify({ generated_at: new Date().toISOString(), countries: index }));
console.log(`${total} programmes for ${Object.values(index).reduce((a, b) => a + b, 0)} channels:`, index);
