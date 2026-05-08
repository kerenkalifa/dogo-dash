## Multi-dog walk timer with countdown

On a new feature branch, upgrade the home screen "Start Walk" flow with countdown duration selection, an animated dual-timer walk session, sound/vibration/popup alerts, and richer walk history.

### 1. Pre-walk setup (Dog Picker dialog)

Extend the existing dialog (`src/pages/Index.tsx` + `DogSelector.tsx`) with two new sections under the dog grid:

- **Duration chips**: 15 / 30 / 45 / 60 min — pill buttons in the purple/yellow palette, single-select, one chip preselected (30 min).
- **Custom minutes**: a small numeric input that activates a "Custom" chip when filled.
- **Notification sound picker**: a row of 3–4 pill chips (Chime, Bell, Soft Alarm, Dog Bark) with a small play button on each for preview. Selection persists in `localStorage` so the user only picks once.

The "Let's go" button stays disabled until at least one dog AND a valid duration are chosen.

### 2. Active walk session (new `WalkTimer.tsx`)

Two stacked counters inside the existing glass card:

- **Elapsed time** (existing behavior, mm:ss).
- **Animated countdown ring** — a circular SVG progress ring around the remaining mm:ss, draining from full to empty. Uses `--primary` (purple) normally.

Below the ring: a horizontal scroll row of small rounded avatar chips for each active dog (name + 🐕 emoji), reusing the dog card styling.

Buttons: **Stop Walk** (existing) + **+5 min** to extend the countdown if needed.

**Warning state (< 5 min remaining):**

- Ring + digits switch to a warning color (warm amber, new `--warning` token in `index.css`).
- Subtle pulse animation on the ring (reuse `animate-pulse-slow` + a new `animate-ring-pulse` keyframe in `tailwind.config.ts`).

### 3. Countdown completion

When remaining hits 0:

- Play the chosen sound on loop (max ~10s) via an `<audio>` element.
- `navigator.vibrate([400, 200, 400, 200, 400])` if supported.
- Show a fullscreen `Dialog` (modal) with the message  
**"Walk time is over! Time to bring the dogs home 🐶"**  
and two buttons: **Stop Walk** (ends + saves) and **Add 5 minutes** (dismisses + extends).
- If the browser tab supports it, also fire a Web Notification (`Notification.requestPermission()` is requested the first time the user starts a countdown). This makes the alert visible when the tab is backgrounded on desktop and Android Chrome.

### 4. Background behavior (best-effort web)

- Use **timestamp math** (`endTime = startTime + duration`) instead of an interval counter so the countdown is accurate after the tab is suspended.
- On `visibilitychange`, recompute remaining time; if the deadline already passed while hidden, fire the alert immediately on return.
- Request a `navigator.wakeLock.request('screen')` while the walk is active (released on stop) to keep the screen alive when the tab is foreground.
- Honest user-facing note in a small "i" tooltip on the picker: *"For reliable alerts when your phone is locked, keep Dogo open in the foreground."* iOS Safari cannot play sound or fire timers in the background from a web app — this limitation is acknowledged.

### 5. Persistence

Active walk state (start time, duration, dog ids, sound id) is mirrored to `localStorage` under `dogo:active-walk`. On `Index` mount, if a non-expired walk exists, it auto-restores. If it expired while away, the completion alert fires on load.

### 6. Walk history

Add three columns to the `walks` table via a migration:

- `planned_duration` (integer, seconds, nullable)
- `completed_on_time` (boolean, nullable) — true if user stopped after countdown reached zero, false if stopped early
- `dogs_count` (integer, nullable) — convenience for multi-dog rows

Each dog still gets its own row (preserves the existing per-dog stats), but all rows from one session share `start_time` so they group naturally. Existing screens keep working; Stats/History pages are not changed in this task.

### 7. Sound assets

Add four short MP3s (~1–2s each, royalty-free) to `public/sounds/`:
`chime.mp3`, `bell.mp3`, `soft-alarm.mp3`, `dog-bark.mp3`. Bundled, no network needed at playback time.

### 8. Styling

Stays in the current Nunito + glassmorphism + 2xl rounded system. New tokens added to `index.css`:

- `--warning: 38 95% 55%` (amber)
- `--warning-foreground: 30 40% 15%`

No third-party UI libs added; ring is a 12-line SVG.

### Technical details

**Files created**

- `public/sounds/{chime,bell,soft-alarm,dog-bark}.mp3`
- `src/components/CountdownRing.tsx` — pure SVG progress ring
- `src/components/SoundPicker.tsx` — chip row with preview
- `src/components/WalkOverDialog.tsx` — fullscreen completion modal
- `src/hooks/useCountdown.ts` — timestamp-based countdown + visibility handling
- `src/hooks/useActiveWalkPersistence.ts` — localStorage round-trip
- `supabase/migrations/<ts>_walks_countdown.sql` — adds 3 columns

**Files edited**

- `src/pages/Index.tsx` — picker UI for duration + sound, pass new props to `WalkTimer`, persistence wiring, save new fields on stop
- `src/components/WalkTimer.tsx` — accept `plannedDurationSec` + `soundId`, render countdown ring, dog chips, warning state, +5 min, fire completion
- `src/components/DogSelector.tsx` — unchanged grid; just consumed
- `src/index.css` — warning color tokens
- `tailwind.config.ts` — `ring-pulse` keyframe + `warning` color mapping
- `src/hooks/useLanguage.ts` (or translations file) — new strings: `pick_duration`, `custom_minutes`, `notification_sound`, `time_remaining`, `add_5_min`, `walk_over_title`, `walk_over_body`, `keep_app_open_hint`

**Out of scope** (called out per your earlier choice of "best-effort web only")

- Server-pushed notifications when the app is fully closed
- Native iOS background alerts (would require Capacitor)
- Editing Stats / History UI to display the new columns (data is saved; UI surfacing can be a follow-up)