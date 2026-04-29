## Walk Reports with Period Filter and Export

Add a new "Reports" area inside the Stats page (`src/pages/Stats.tsx`) that lets the user pick a time range and view per a specific dog or all dogs together + export the matching walks.

### 1. Period selector

A pill-style toggle group right under the page title, with these presets:

- This Week
- This Month (default)
- This Quarter
- This Year
- Custom range (opens two date pickers — start / end — using the shadcn `Calendar` in a `Popover`)

Selecting a preset recomputes a `{from, to}` range using `date-fns` (`startOfWeek`, `startOfMonth`, `startOfQuarter`, `startOfYear`, and matching `endOf*`).

### 2. Data refresh

Replace the hard-coded "this month" query with a query bound to the selected `{from, to}`:

```
supabase.from('walks').select('*, dogs(name, breed)')
  .gte('date', from).lte('date', to).order('date', { ascending: false })
```

All existing widgets on the page (overview tiles, weekly chart still shows last 7 days, per-dog cards, walk list) read from the same `walks` state so they automatically reflect the chosen period. The 7-day chart keeps its fixed window since it's labeled that way; per-dog summaries and the totals tiles update to match the period (and the tile labels switch from "This Month" to dynamic labels like "This Week" / "Q2 2026" / "2026" / "Custom").

### 3. Report view

A new "Report" panel below the period selector showing:

- Range label + total walks, total minutes, total bathroom breaks, average walk length, most-walked dog
- Per-dog breakdown table (Dog, Walks, Minutes, Breaks)
- Two action buttons: **Export CSV** and **Export PDF**

### 4. Export

- **CSV**: build a string client-side (header + one row per walk: date, dog name, duration minutes, bathroom break, notes) and trigger download via a `Blob` + temporary `<a>` link. No new dependencies.
- **PDF**: add `jspdf` + `jspdf-autotable`. Generate a branded one-pager with the range, summary stats, per-dog table, and a walks table. Filename: `dogo-report-{from}_to_{to}.pdf`.

### 5. i18n

Add keys to `src/hooks/useLanguage.tsx` (EN + HE):

- `reports`, `period`, `this_week`, `this_month`, `this_quarter`, `this_year`, `custom_range`, `from`, `to`
- `export_csv`, `export_pdf`, `report_summary`, `avg_walk`, `top_dog`, `pick_start`, `pick_end`

### Technical details

- Files changed: `src/pages/Stats.tsx`, `src/hooks/useLanguage.tsx`.
- New dep: `jspdf`, `jspdf-autotable`.
- Date math: `date-fns` (already in project).
- Calendar uses `pointer-events-auto` inside `Popover` per project convention.
- RTL: ToggleGroup and buttons already inherit `dir` from `<html>`; PDF will be generated with English labels for compatibility (Hebrew fonts in jsPDF need extra setup — call this out and default PDF to English text regardless of UI language; CSV will use UTF-8 with BOM so Hebrew notes render in Excel).