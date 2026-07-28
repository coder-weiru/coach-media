# mock.coach — Landing demo video: storyboard, script & production kit

> **Note (superseded):** this is the original creative brief (5-act, with AI-generated human scenes). The
> **shipped cut is product-only** — see [`README.md`](README.md) for the actual structure and pipeline.
> Kept here for the shot ideas, AI-video prompts, and assembly reference.


**Goal.** A ~58-second hero video for the landing page (`web/src/components/DemoVideo.tsx`) that opens
on the mission, walks through the real product (interviewer builds → candidate practices → gets a scored
report), pays it off with a confident real interview, and closes back on the mission.

**Mission / motto (opens & closes the film):**

> ### Every day, a little more confident than the day before.

*(English-only on screen. Original Chinese source of the mission: 每天都比前一天自信一点。)*

---

## 0. Hard constraints (read first — they shape every decision)

| Constraint | Consequence for the edit |
|---|---|
| **Autoplays *muted*** (browser policy; see `DemoVideo.tsx` `muted loop playsInline`) | **The story must read with zero audio.** Every beat carries an on-screen caption. Music is a bonus, never load-bearing. |
| **Loops** (`loop`) | Last frame should sit comfortably next to the first — close on the motto, which is also the open. No hard cut-to-black at the tail. |
| **Poster frame** shows before play (`poster="/demo-poster.jpg"`) | Export a strong still (recommend the motto hero frame) as the poster. |
| **~60s ceiling** (target **58s**) | Budget is tight; keep every human clip 2–4s and every UI beat 3–5s. |
| **16:9, 1920×1080, 30fps** | The landing slot is a widescreen card. Master at 1080p. |
| **Real people, not cartoon** | The 3 human scenes come from an **AI text-to-video tool** (Sora / Veo 3 / Runway Gen-3 / Kling). The app scenes are **real screen-recordings** of the running product. |

**Deliverables the code already expects** (drop-in, no code change — see `DemoVideo.tsx` header):
- `web/public/demo.webm` — primary
- `web/public/demo.mp4` — Safari/iOS fallback
- `web/public/demo-poster.jpg` — poster + reduced-motion fallback frame

---

## 1. The arc (emotional throughline)

Nervous → **prepared** → practiced → **confident** → aced. The product is what turns the first into the
last. We never *say* that; the cut says it.

```
ACT 1  Mission          0:00 ─ 0:05   motto animation (already built)
ACT 2  The interviewer  0:05 ─ 0:22   a pro builds a grounded interview (Wizard)
ACT 3  The candidate    0:22 ─ 0:41   a student practices → scored report + feedback
ACT 4  The real thing   0:41 ─ 0:53   student faces a live panel, answers well, aced
ACT 5  Mission (reprise)0:53 ─ 0:58   back to the motto + CTA
```

---

## 2. Shot-by-shot storyboard

Legend for **Source**: 🎞️ = AI-generated human clip (prompt in §3) · 🖥️ = real app screen-recording
(capture guide in §4) · ✨ = the motto animation (`video/motto-scene.html`).

### ACT 1 — Mission (0:00–0:05) ✨
| # | t | Visual | On-screen text | Source |
|---|----|--------|----------------|--------|
| 1 | 0:00–0:05 | Motto animation intro: bloom → rising confidence bars → "OUR MISSION" eyebrow → **Every day, a little more confident than the day before.** rises per-word (gradient) + sheen sweep | *(baked into the animation)* | ✨ record `motto-scene.html` |

*Cut on the sheen sweep — momentum carries into Act 2.*

### ACT 2 — The interviewer builds an interview (0:05–0:22)
| # | t | Visual | On-screen caption | Source |
|---|----|--------|-------------------|--------|
| 2 | 0:05–0:08 | A professional (30s–40s, smart-casual) at a laptop in a bright office, decisive, slight smile | **"Interviewers build the real thing."** | 🎞️ prompt A1 |
| 3 | 0:08–0:12 | Wizard **Basics**: typing a title ("Senior Frontend — React"), picking a category, adding tags | **"From your own docs."** | 🖥️ Wizard step 1 |
| 4 | 0:12–0:16 | Wizard **grounding**: dragging in a JD / résumé / knowledge-base file; upload confirms | **"Grounded in the JD, résumé & KB."** | 🖥️ Wizard upload |
| 5 | 0:16–0:19 | Wizard **Delivery**: set visibility, invite a roster by email, cap attempts | **"Invite candidates. Set the rules."** | 🖥️ Wizard delivery |
| 6 | 0:19–0:22 | Click **Publish** → interview card appears in the catalog with its badge | **"Published."** | 🖥️ publish → catalog |

### ACT 3 — The candidate practices (0:22–0:41)
| # | t | Visual | On-screen caption | Source |
|---|----|--------|-------------------|--------|
| 7 | 0:22–0:25 | A student (20s, hoodie/headphones, dorm or café), a touch nervous, opens a laptop | **"Candidates practice on their schedule."** | 🎞️ prompt B1 |
| 8 | 0:25–0:28 | Cursor clicks the **Practice →** button on an interview card | **"One click to practice."** | 🖥️ catalog → practice |
| 9 | 0:28–0:33 | The interview loop: an AI question appears; mic-pulse; a live answer types out | **"Real questions. Real answers."** | 🖥️ interview loop |
| 10 | 0:33–0:37 | The **scored report**: overall score dial + per-competency bars animate up | **"A scored report, every time."** | 🖥️ evaluation |
| 11 | 0:37–0:41 | Scroll the **feedback**: strengths, gaps, recommendations; student nods, re-reads | **"Specific feedback. What to fix next."** | 🖥️ feedback + 🎞️ B2 (reaction, 1s inset) |

### ACT 4 — The real interview, aced (0:41–0:53)
| # | t | Visual | On-screen caption | Source |
|---|----|--------|-------------------|--------|
| 12 | 0:41–0:44 | Same student, now sharp (blazer), walks into a real interview room; a **panel of 3** looks up | *(none — let it breathe)* | 🎞️ prompt C1 |
| 13 | 0:44–0:48 | Over-shoulder on the panel: the student speaks, calm and confident, gesturing naturally | **"Then the day comes."** | 🎞️ prompt C2 |
| 14 | 0:48–0:51 | Panel members nod, exchange an impressed glance, one smiles and notes something | **"You've done this before."** | 🎞️ prompt C3 |
| 15 | 0:51–0:53 | A warm handshake / the student walks out lighter, quietly triumphant | **"Aced it."** | 🎞️ prompt C4 |

### ACT 5 — Mission reprise + CTA (0:53–0:58) ✨
| # | t | Visual | On-screen text | Source |
|---|----|--------|----------------|--------|
| 16 | 0:53–0:57 | Motto animation returns and settles; logo + wordmark hold | Every day, a little more confident than the day before. | ✨ motto-scene tail |
| 17 | 0:56–0:58 | CTA line + wordmark; hold on a loop-friendly frame | **mock.coach** · *Start free →* | ✨ + edit |

*Because the file loops, frame 17 lives happily next to frame 1 — both are the dark motto field.*

---

## 3. AI video prompts (copy-paste)

Each generator caps clips at ~4–10s, so every human beat is its own prompt. **Generate silent, no
on-screen text, no logos** — captions/branding are added in the edit. Keep the **same student**
(scene B, C) consistent: reuse a seed/character-reference if your tool supports it, or describe the same
person identically. Grade everything toward the brand's cool violet/blue later (§5).

**Global style suffix — append to every prompt below:**
> *Cinematic, shallow depth of field, natural soft lighting, realistic skin texture, subtle handheld
> motion, 16:9, 1080p, photorealistic, no on-screen text, no captions, no watermark, no logo.*

### A — The interviewer
**A1 (3s):**
> A confident professional in their thirties, smart-casual (soft knit over a collared shirt), sits at a
> clean modern laptop in a bright airy office with plants and warm window light. They type briefly, then
> look up with a small satisfied smile as if they've just finished setting something up. Slow push-in.

### B — The candidate practicing
**B1 (3s):**
> A university student in their early twenties wearing a hoodie and over-ear headphones, in a cozy dorm
> room or quiet café with warm lamp light, opens a laptop and settles in. A flicker of nerves, then a
> small determined breath. Warm, intimate, hopeful. Medium close-up, slight handheld.

**B2 (1–2s, reaction inset):**
> The same young student reads their laptop screen, eyes tracking down a list, then nods slowly to
> themselves and gives a quiet, encouraged half-smile. Tight close-up on the face, warm light.

### C — The real interview (keep the SAME student as B, now polished)
**C1 (3s):**
> The same young person, now in a crisp blazer, walks into a bright corporate interview room. Three
> professional interviewers sit behind a table and look up welcomingly. The candidate stands tall, calm.
> Wide-to-medium shot, glass-walled modern office, cool daylight.

**C2 (4s):**
> Over-the-shoulder from behind the interview panel toward the candidate: the young person speaks with
> calm confidence, natural hand gestures, relaxed posture and steady eye contact. Believable, warm,
> composed. Shallow focus on the candidate.

**C3 (3s):**
> Close on a three-person interview panel: they listen, nod approvingly, exchange an impressed glance,
> and one leans in and jots a note with a small smile. Professional, warm, encouraging.

**C4 (2–3s):**
> A young professional in a blazer shakes hands warmly with an interviewer, then turns and walks down a
> sunlit modern corridor, exhaling with a quiet, relieved, triumphant smile. Backlit, hopeful, golden.

> **Diversity & casting note:** cast the interviewer, candidate and panel to reflect a real, varied user
> base. Whatever you pick, keep the candidate identical across B and C so the arc reads as one person.

---

## 4. Capturing the real app scenes (🖥️)

These are recordings of the actual running product — the most credible footage in the film.

**Setup**
1. Run the stack locally (stub LLM is fine and faster): `docker compose up` (see repo root
   `docker-compose.yml`). Seed one clean, good-looking interview + one candidate so the data looks real.
2. Browser at **1920×1080**, 100% zoom, hide bookmarks bar. Dark theme is the app default.
3. Record the region at 60fps (macOS: **CleanShot X**, **Screen Studio** — Screen Studio auto-smooths the
   cursor and is ideal here; or QuickTime + a cursor-highlight tool).

**Capture list** (record generously, trim in edit):
- **Wizard** — Basics (title/category/tags) · file upload (JD/résumé/KB) · Delivery (visibility/invite/attempts) · **Publish** → the new card landing in the catalog.
- **Practice entry** — hover + click **Practice →** on a catalog card.
- **Interview loop** — a question rendering, the mic-pulse, an answer appearing.
- **Evaluation** — the scored report loading: score + per-competency bars animating in.
- **Feedback** — a slow scroll through strengths / gaps / recommendations.

**Tips:** move the cursor deliberately and slowly; pause 1s on each result before moving on; prefer
**Screen Studio's** auto-zoom on clicks so small UI reads on a landing card. Keep each raw clip ≤8s.

*(Offer: I can run the compose stack and script these captures for you in a follow-up — say the word.)*

---

## 5. Assembly guide

**Editor:** CapCut (free, fastest), DaVinci Resolve (free, pro-grade), or Premiere. Timeline **1920×1080
@ 30fps**.

**Order & pacing** — lay the 17 beats from §2 on the timeline; hold human clips 2–4s, UI beats 3–5s.
Cross-dissolve (150–200ms) between human↔UI; hard-cut within a UI sequence.

**Captions** — one line at a time, lower-third, generous size (readable on a phone-sized card). Font:
system sans / Inter, weight 600, color `#f2f4f8`, with a soft `#0f1116` shadow for contrast. Fade each in
~200ms. These carry the story (muted autoplay).

**Grade** — nudge everything toward the brand: lift shadows slightly cool (violet `#8b5cf6` / blue
`#4f74ff`), keep skin natural. This makes AI clips + dark UI feel like one film.

**Music (optional, muted by default so purely for un-mute / social cuts)** — a soft, rising,
hopeful ambient/piano bed. **Use a licensed/royalty-free source** (e.g. Uppbeat, Artlist, YouTube Audio
Library) — do not use copyrighted tracks.

**Motto bookends** — screen-record `video/motto-scene.html` fullscreen (or ask me to render it to a clean
1080p clip). Use its first ~5s for Act 1 and its settle for Act 5.

**Export → encode to the 3 drop-in assets** (matches `DemoVideo.tsx` sources). From a master `master.mp4`:

```bash
# primary: VP9 webm (small, modern browsers)
ffmpeg -i master.mp4 -c:v libvpx-vp9 -b:v 0 -crf 33 -an web/public/demo.webm

# fallback: H.264 mp4 (Safari/iOS) — faststart so it streams
ffmpeg -i master.mp4 -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p \
  -movflags +faststart -an web/public/demo.mp4

# poster: the motto hero frame (grab a strong still, e.g. at 0:03)
ffmpeg -i master.mp4 -ss 00:00:03 -frames:v 1 -q:v 3 web/public/demo-poster.jpg
```

*(`-an` strips audio — the landing plays muted; drop it if you want a soundtrack for the mp4 on social.)*

**Drop in & ship** — put the three files in `web/public/`. `DemoVideo` auto-detects them: it lazy-loads,
muted-autoplays on scroll-into-view, and shows the play/pause toggle for replay. No code change. It falls
back to the "coming soon" placeholder if a file is missing, so you can ship partials.

---

## 6. Checklist

- [ ] Render motto bookends from `motto-scene.html` (Act 1 + Act 5)
- [ ] Generate 🎞️ clips A1, B1, B2, C1–C4 (keep candidate consistent across B/C)
- [ ] Capture 🖥️ Wizard / Practice / Interview loop / Evaluation / Feedback on the live stack
- [ ] Assemble to 58s, add lower-third captions, cool grade, optional music bed
- [ ] Export master → encode `demo.webm` / `demo.mp4` / `demo-poster.jpg`
- [ ] Drop into `web/public/`, verify autoplay + replay on the landing page
