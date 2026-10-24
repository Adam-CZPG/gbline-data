#!/usr/bin/env node
/**
 * Picks which channels to fetch a TV guide for: channels of the chosen
 * countries that have a live stream in iptv-org and a guide source in
 * iptv-org/epg. Writes channels.xml (input for the iptv-org/epg grabber) and
 * channel-countries.json (id → country, used by compact.mjs).
 *
 * COUNTRIES env: comma-separated ISO codes (default below).
 */
import { writeFile } from 'node:fs/promises';

const API = 'https://iptv-org.github.io/api';
const COUNTRIES = (process.env.COUNTRIES || 'CZ,SK,PL,RU,UA,DE,TR,GB,KZ,FR,IT,ES')
  .split(',')
  .map((code) => code.trim().toUpperCase())
  .filter(Boolean);
const MAX_PER_SITE = Number(process.env.MAX_PER_SITE || 400);

async function json(name) {
  const response = await fetch(`${API}/${name}`, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.json();
}

const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const [channels, streams, guides] = await Promise.all([json('channels.json'), json('streams.json'), json('guides.json')]);
const wanted = new Map();
const live = new Set(streams.map((stream) => stream.channel).filter(Boolean));
for (const channel of channels) {
  if (!COUNTRIES.includes(channel.country) || channel.closed || channel.is_nsfw || !live.has(channel.id)) continue;
  wanted.set(channel.id, channel);
}

// One guide per channel; sites are spread so no single site gets all the requests.
const perSite = new Map();
const picked = new Map();
for (const guide of guides) {
  if (!guide.channel || picked.has(guide.channel) || !wanted.has(guide.channel)) continue;
  const count = perSite.get(guide.site) || 0;
  if (count >= MAX_PER_SITE) continue;
  perSite.set(guide.site, count + 1);
  picked.set(guide.channel, guide);
}

const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<channels>'];
for (const [id, guide] of picked) {
  lines.push(`  <channel site="${escape(guide.site)}" lang="${escape(guide.lang || 'en')}" xmltv_id="${escape(id)}" site_id="${escape(guide.site_id)}">${escape(guide.site_name || wanted.get(id).name)}</channel>`);
}
lines.push('</channels>');
await writeFile('channels.xml', `${lines.join('\n')}\n`);
await writeFile('channel-countries.json', JSON.stringify(Object.fromEntries([...picked.keys()].map((id) => [id, wanted.get(id).country]))));
console.log(`${picked.size} of ${wanted.size} live channels have a guide source (${perSite.size} sites) in ${COUNTRIES.join(', ')}`);
