# Supabase Policy Game

Production‑ready React 18 + Vite + Supabase simulation game for up to 16 players in 5 rounds.

## ✨ Features
* Email magic‑link sign‑in
* Two routes – `/public` (players) and `/dm` (game‑master)
* Persistent state in Supabase Postgres with Edge Function resolver
* Tailwind CSS with shadcn/ui components
* Vertical timeline of public results
* CSV export of all moves
* Deployable to **GitHub Pages** *or* **Vercel**
* Embeddable in Notion

---

## 🖥️ Local development

```bash
git clone https://github.com/yourname/policy-game.git
cd policy-game
npm i
cp .env.example .env   # fill in keys below
npm run dev
````

### `.env.example`

```
VITE_SUPABASE_URL=https://rkqiudbxcqamwnpcqvie.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrcWl1ZGJ4Y3FhbXducGNxdmllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzk0ODUsImV4cCI6MjA2NzkxNTQ4NX0.8cBdsIGFFRtQFZo9TLVATtoIXc8C12XIp83xPWKh7TY
```

---

## 🔧 Supabase setup

1. Create a new project and note the *Project URL* and *Anon* key (add to `.env`).
2. Run the SQL from `supabase/migrations/001_init.sql` in the SQL editor.
3. Deploy **Edge Function**
   ```bash
   supabase functions deploy resolveRound --project-ref <project-id>
   ```
4. Set environment variable `SUPABASE_SERVICE_ROLE_KEY` for the function (Settings → Functions → Environment).

---

## 🚀 Deploy

### GitHub Pages

```bash
git remote add origin https://github.com/yourname/policy-game.git
npm run deploy:gh
```

*Enable GH Pages in repo → Settings → Pages → branch ****\`\`****.*

### Vercel

- Click **Import Git** → select repo.
- Set build command `npm run build` and output `dist`.
- Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Enable **Edge Functions** in settings and connect the `supabase/functions` directory.

---

## 🧩 Embed in Notion

1. Deploy site (GH Pages or Vercel).
2. Add the URLs to your Supabase **Auth** allow‑list.
3. In Notion, use **/embed** → paste `<your‑site>/public` or `<your‑site>/dm`.\
   Resize block to taste.

Enjoy!