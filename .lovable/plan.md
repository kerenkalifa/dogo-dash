

# Dogo — Dog Walking App

## Visual Identity
- **Colors**: Electric Purple (#8B5CF6) primary, Soft Banana Yellow (#FEF08A) accent, with Mint Green and Electric Orange as secondary highlights
- **Style**: Glassmorphism cards (semi-transparent bg + backdrop-blur), 2xl rounded corners, high-contrast borders
- **Typography**: Bold rounded sans-serif headings, large touch-friendly text
- **Mobile-first**: One-handed use optimized, sticky bottom nav bar

## Database (Supabase)
- **Dogs table**: id, name, breed, image_url, created_at
- **Walks table**: id, dog_id (FK), start_time, end_time, duration, date, notes, bathroom_break (boolean)

## Pages & Features

### 1. Dashboard (Home)
- Large "Start Walk" button — tap to select dog(s), starts a live timer
- Active walk display with elapsed time, stop button
- Recent walks list

### 2. Dogs Management
- List of dogs with photo, name, breed
- Add/edit dog form with image URL support

### 3. Manual Walk Entry
- Simple form: pick dog, date, start/end time, notes, bathroom break toggle

### 4. Stats & Reports
- **Weekly bar chart** (Recharts): minutes walked per day over last 7 days
- **Monthly summary cards per dog**: circular progress ring (days walked vs 7-day goal), walk count, total duration, bathroom break count
- **Engagement metric**: auto-label based on note keywords (e.g., "High Energy")
- Total monthly duration and walk count

### 5. Shareable Summary
- "Generate Summary" button creates an Instagram Story-style vertical card
- Aggregates monthly highlights: top stats, per-dog summaries, aesthetic layout
- Designed for screenshot & WhatsApp sharing

### 6. Bottom Navigation
- 4 tabs: Home (Home icon), Dogs (PawPrint), Stats (BarChart3), Profile (User)
- Sticky bottom bar, active state highlighting

## Tech Stack
- React + TypeScript + Tailwind CSS
- Recharts for charts
- Lucide React icons
- Supabase for database + auth (via Lovable Cloud)

