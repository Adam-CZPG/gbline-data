#!/usr/bin/env node
/**
 * Picks which channels to fetch a TV guide for and splits the work into shards
 * that the workflow grabs in parallel.
 *
 * Channels: every channel in iptv-org that has a live stream (the same pool the
 * GBLiNE catalog is built from), in every country, minus closed and 18+ ones.
 * Each channel gets its best guide source plus one backup from another site;
 * compact.mjs later keeps whichever of the two actually delivered more.
 *
 * Sites are kept whole inside one shard (so no site is hit from several jobs at
 * once) and shards are balanced by channel count.
 *
 * Writes:
 *   shards/channels-<n>.xml   input for the iptv-org/epg grabber, one per shard
 *   shards/matrix.json        ["0","1",…] for the workflow matrix
 *   channel-countries.json    channel id → country (used by compact.mjs)
 *
 * Env:
 *   COUNTRIES     optional comma-separated ISO codes (empty = all countries)
 *   SHARDS        number of parallel grab jobs (default 12)
 *   MAX_PER_SITE  cap per guide site (default 1500)
 *   API_DIR       read the iptv-org API from this folder instead of the web
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const API = 'https://iptv-org.github.io/api';
const COUNTRIES = (process.env.COUNTRIES || '')
  .split(',')
  .map((code) => code.trim().toUpperCase())
  .filter(Boolean);
const SHARDS = Math.max(1, Number(process.env.SHARDS || 12));
const MAX_PER_SITE = Number(process.env.MAX_PER_SITE || 1500);
// Second source for a channel: its programmes are stored under "<id>@GBALT" so they never mix with the first.
const ALT_SUFFIX = '@GBALT';

async function json(name) {
  if (process.env.API_DIR) return JSON.parse(await readFile(`${process.env.API_DIR}/${name}`, 'utf8'));
  const response = await fetch(`${API}/${name}`, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.json();
}

const escape = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const [channels, streams, guides] = await Promise.all([json('channels.json'), json('streams.json'), json('guides.json')]);
const live = new Set(streams.map((stream) => stream.channel).filter(Boolean));
const wanted = new Map();
for (const channel of channels) {
  if (channel.closed || channel.is_nsfw || !live.has(channel.id)) continue;
  if (COUNTRIES.length && !COUNTRIES.includes(channel.country)) continue;
  wanted.set(channel.id, channel);
}

// Candidate guides per channel. Sites that cover many of our channels come first:
// they are usually the big, well-kept grabbers (and fewer sites means fewer failures).
const candidates = new Map();
const siteReach = new Map();
for (const guide of guides) {
  if (!guide.channel || !guide.site || !guide.site_id || !wanted.has(guide.channel)) continue;
  const list = candidates.get(guide.channel) || [];
  if (list.some((item) => item.site === guide.site)) continue;
  list.push(guide);
  candidates.set(guide.channel, list);
  siteReach.set(guide.site, (siteReach.get(guide.site) || 0) + 1);
}

const perSite = new Map();
const entries = []; // { xmltvId, guide }
for (const [id, list] of candidates) {
  list.sort((a, b) => (siteReach.get(b.site) || 0) - (siteReach.get(a.site) || 0));
  let used = 0;
  for (const guide of list) {
    if (used === 2) break;
    const count = perSite.get(guide.site) || 0;
    if (count >= MAX_PER_SITE) continue;
    perSite.set(guide.site, count + 1);
    entries.push({ xmltvId: used === 0 ? id : `${id}${ALT_SUFFIX}`, channelId: id, guide });
    used += 1;
  }
}

// Whole sites into shards, biggest first, each into the currently lightest shard.
const bySite = new Map();
for (const entry of entries) {
  const list = bySite.get(entry.guide.site) || [];
  list.push(entry);
  bySite.set(entry.guide.site, list);
}
const shards = Array.from({ length: SHARDS }, () => []);
for (const list of [...bySite.values()].sort((a, b) => b.length - a.length)) {
  shards.reduce((min, shard) => (shard.length < min.length ? shard : min), shards[0]).push(...list);
}

await mkdir('shards', { recursive: true });
const used = [];
for (const [n, shard] of shards.entries()) {
  if (!shard.length) continue;
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<channels>'];
  for (const { xmltvId, channelId, guide } of shard) {
    const name = guide.site_name || wanted.get(channelId).name;
    lines.push(`  <channel site="${escape(guide.site)}" lang="${escape(guide.lang || 'en')}" xmltv_id="${escape(xmltvId)}" site_id="${escape(guide.site_id)}">${escape(name)}</channel>`);
  }
  lines.push('</channels>');
  await writeFile(`shards/channels-${n}.xml`, `${lines.join('\n')}\n`);
  used.push(String(n));
  console.log(`shard ${n}: ${shard.length} entries, ${new Set(shard.map((entry) => entry.guide.site)).size} sites`);
}
await writeFile('shards/matrix.json', JSON.stringify(used));
await writeFile('channel-countries.json', JSON.stringify(Object.fromEntries([...candidates.keys()].map((id) => [id, wanted.get(id).country]))));
console.log(`${candidates.size} of ${wanted.size} live channels have a guide source; ${entries.length} entries on ${bySite.size} sites in ${used.length} shards.`);
