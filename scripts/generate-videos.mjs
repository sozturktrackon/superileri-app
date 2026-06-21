#!/usr/bin/env node
// Generate exercise demo videos on a remote ComfyUI (Wan 2.2 T2V + 4-step LoRA)
// and save each as <exerciseId>.mp4 — ready for `make upload-videos`.
//
// Usage:
//   node scripts/generate-videos.mjs --base http://192.168.21.236:8082 --only traditional-push-up,burpees
//   node scripts/generate-videos.mjs --base http://192.168.21.236:8082 --all
//   node scripts/generate-videos.mjs --sample            # first 3 exercises
//
// Options: --width 640 --height 640 --length 81 --fps 16 --out ./generated-videos --seed 12345

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promptFor, NEGATIVE } from './exercise-prompts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ---- args ----
const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d;
};
const has = (k) => argv.includes(`--${k}`);

const BASE = (arg('base', process.env.COMFY_BASE || 'http://192.168.21.236:8082')).replace(/\/$/, '');
const OUT = path.resolve(arg('out', path.join(ROOT, 'generated-videos')));
const WIDTH = +arg('width', 480);
const HEIGHT = +arg('height', 480);
const LENGTH = +arg('length', 49);
const FPS = +arg('fps', 16);
const SEED0 = +arg('seed', 42);

const exercises = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content', 'exercises.json'), 'utf8')
).groups.flatMap((g) => g.exercises);

let targets;
if (has('all')) targets = exercises;
else if (has('sample')) targets = exercises.slice(0, 3);
else if (arg('only')) {
  const ids = new Set(arg('only').split(','));
  targets = exercises.filter((e) => ids.has(e.id));
} else {
  console.error('Specify --all, --sample, or --only id1,id2');
  process.exit(1);
}
if (targets.length === 0) {
  console.error('No matching exercises.');
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
const CLIENT_ID = `superileri-${Date.now()}`;

// ---- workflow (API format) ----
const buildWorkflow = (prompt, seed, prefix) => ({
  clip: { class_type: 'CLIPLoader', inputs: { clip_name: 'umt5_xxl_fp8_e4m3fn_scaled.safetensors', type: 'wan' } },
  vae: { class_type: 'VAELoader', inputs: { vae_name: 'wan_2.1_vae.safetensors' } },
  unet_high: { class_type: 'UNETLoader', inputs: { unet_name: 'wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors', weight_dtype: 'default' } },
  unet_low: { class_type: 'UNETLoader', inputs: { unet_name: 'wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors', weight_dtype: 'default' } },
  lora_high: { class_type: 'LoraLoaderModelOnly', inputs: { model: ['unet_high', 0], lora_name: 'wan2.2_t2v_lightx2v_4steps_lora_v1.1_high_noise.safetensors', strength_model: 1.0 } },
  lora_low: { class_type: 'LoraLoaderModelOnly', inputs: { model: ['unet_low', 0], lora_name: 'wan2.2_t2v_lightx2v_4steps_lora_v1.1_low_noise.safetensors', strength_model: 1.0 } },
  ms_high: { class_type: 'ModelSamplingSD3', inputs: { model: ['lora_high', 0], shift: 5.0 } },
  ms_low: { class_type: 'ModelSamplingSD3', inputs: { model: ['lora_low', 0], shift: 5.0 } },
  pos: { class_type: 'CLIPTextEncode', inputs: { clip: ['clip', 0], text: prompt } },
  neg: { class_type: 'CLIPTextEncode', inputs: { clip: ['clip', 0], text: NEGATIVE } },
  latent: { class_type: 'EmptyHunyuanLatentVideo', inputs: { width: WIDTH, height: HEIGHT, length: LENGTH, batch_size: 1 } },
  ks_high: { class_type: 'KSamplerAdvanced', inputs: { model: ['ms_high', 0], add_noise: 'enable', noise_seed: seed, steps: 4, cfg: 1.0, sampler_name: 'euler', scheduler: 'simple', positive: ['pos', 0], negative: ['neg', 0], latent_image: ['latent', 0], start_at_step: 0, end_at_step: 2, return_with_leftover_noise: 'enable' } },
  ks_low: { class_type: 'KSamplerAdvanced', inputs: { model: ['ms_low', 0], add_noise: 'disable', noise_seed: 0, steps: 4, cfg: 1.0, sampler_name: 'euler', scheduler: 'simple', positive: ['pos', 0], negative: ['neg', 0], latent_image: ['ks_high', 0], start_at_step: 2, end_at_step: 4, return_with_leftover_noise: 'disable' } },
  decode: { class_type: 'VAEDecode', inputs: { samples: ['ks_low', 0], vae: ['vae', 0] } },
  video: { class_type: 'CreateVideo', inputs: { images: ['decode', 0], fps: FPS } },
  save: { class_type: 'SaveVideo', inputs: { video: ['video', 0], filename_prefix: prefix, format: 'auto', codec: 'auto' } },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const queue = async (workflow) => {
  const res = await fetch(`${BASE}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow, client_id: CLIENT_ID }),
  });
  const body = await res.json();
  if (!res.ok || body.error || (body.node_errors && Object.keys(body.node_errors).length)) {
    throw new Error('queue failed: ' + JSON.stringify(body.error || body.node_errors));
  }
  return body.prompt_id;
};

// Release ComfyUI's cached GPU memory between clips so it doesn't accumulate
// across a long batch (keeps models resident for speed; frees intermediates).
const freeMemory = async (unloadModels = false) => {
  try {
    await fetch(`${BASE}/free`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ free_memory: true, unload_models: unloadModels }),
    });
  } catch {
    /* best effort */
  }
};

const waitForOutput = async (promptId, timeoutMs = 720000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE}/history/${promptId}`);
    const hist = await res.json();
    const entry = hist[promptId];
    if (entry) {
      if (entry.status?.status_str === 'error') {
        throw new Error('execution error: ' + JSON.stringify(entry.status.messages?.slice(-3)));
      }
      const files = [];
      for (const out of Object.values(entry.outputs || {})) {
        for (const arr of Object.values(out)) {
          if (Array.isArray(arr)) {
            for (const f of arr) if (f && f.filename) files.push(f);
          }
        }
      }
      if (files.length) return files;
    }
    await sleep(2000);
  }
  throw new Error('timed out waiting for output');
};

const download = async (file, destPath) => {
  const q = new URLSearchParams({
    filename: file.filename,
    subfolder: file.subfolder || '',
    type: file.type || 'output',
  });
  const res = await fetch(`${BASE}/view?${q}`);
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buf);
  return buf.length;
};

console.log(`ComfyUI: ${BASE}`);
console.log(`Output:  ${OUT}`);
console.log(`Targets: ${targets.length} exercise(s) @ ${WIDTH}x${HEIGHT}x${LENGTH} ${FPS}fps\n`);

let ok = 0;
for (let i = 0; i < targets.length; i++) {
  const ex = targets[i];
  const label = `[${i + 1}/${targets.length}] ${ex.id}`;
  try {
    const prompt = promptFor(ex);
    const wf = buildWorkflow(prompt, SEED0 + i, `superileri/${ex.id}`);
    process.stdout.write(`${label} queuing…`);
    const pid = await queue(wf);
    process.stdout.write(` running…`);
    const files = await waitForOutput(pid);
    const vid = files.find((f) => /\.(mp4|webm|mov|gif)$/i.test(f.filename)) || files[0];
    const ext = path.extname(vid.filename) || '.mp4';
    const dest = path.join(OUT, `${ex.id}${ext}`);
    const bytes = await download(vid, dest);
    console.log(` ✓ ${(bytes / 1e6).toFixed(1)}MB -> ${path.basename(dest)}`);
    ok++;
  } catch (e) {
    console.log(` ✗ ${e.message}`);
    await freeMemory(true); // a failure may mean OOM — unload models to fully reset
  }
  await freeMemory(); // free cache between every clip to prevent accumulation
}

console.log(`\nDone: ${ok}/${targets.length} generated in ${OUT}`);
console.log(`Next: review them, then  make upload-videos DIR=${OUT}`);
