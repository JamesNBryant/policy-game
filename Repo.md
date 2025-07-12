package.json

```json
{
  "name": "supabase-policy-game",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy:gh": "npm run build && npx gh-pages -d dist",
    "deploy:vercel": "vercel --prod"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.23.1",
    "react-vertical-timeline-component": "^3.5.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.371.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.20",
    "@types/react-dom": "^18.2.8",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.0",
    "vite": "^5.0.12",
    "gh-pages": "^6.1.1"
  }
}
```

tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "lib": ["DOM", "DOM.Iterable", "ES2021"],
    "types": ["vite/client"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "noEmit": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

tailwind.config.ts

```ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
} satisfies Config
```

postcss.config.cjs

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173
  },
  base: process.env.GH_PAGES ? '/' + (process.env.GH_REPO || '') + '/' : '/'
})
```

public/index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Policy Game</title>
  </head>
  <body class="bg-gray-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

src/main.tsx

```ts
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
```

src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

src/lib/supabaseClient.ts

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  }
})
```

src/contexts/AuthContext.tsx

```ts
import React, { createContext, useEffect, useState, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

interface AuthContextProps {
  user: User | null
  session: Session | null
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  session: null
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user: session?.user ?? null,
    session
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
```

src/App.tsx

```ts
import { Routes, Route, Navigate } from 'react-router-dom'
import PublicView from './routes/PublicView'
import DMView from './routes/DMView'
import Login from './routes/Login'
import { AuthProvider, AuthContext } from './contexts/AuthContext'
import React, { useContext } from 'react'

const ProtectedRoute = ({
  adminOnly,
  children
}: {
  adminOnly?: boolean
  children: JSX.Element
}) => {
  const { user } = useContext(AuthContext)
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.user_metadata?.admin !== true) return <Navigate to="/public" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dm"
          element={
            <ProtectedRoute adminOnly>
              <DMView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/public"
          element={
            <ProtectedRoute>
              <PublicView />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/public" replace />} />
      </Routes>
    </AuthProvider>
  )
}
```

src/routes/Login.tsx

```ts
import { supabase } from '../lib/supabaseClient'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) setMessage(error.message)
    else setMessage('Check your email for the magic link!')
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-2xl shadow-xl space-y-4 w-96">
        <h1 className="text-2xl font-bold text-center">Sign in</h1>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">
          Send magic link
        </Button>
        {message && <p className="text-center text-sm">{message}</p>}
      </form>
    </div>
  )
}
```

src/routes/PublicView\.tsx

```ts
import { supabase } from '../lib/supabaseClient'
import { useEffect, useState, useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component'
import 'react-vertical-timeline-component/style.min.css'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Round {
  id: string
  number: number
  publicBrief: string
  publicResults: string | null
  createdAt: string
}

export default function PublicView() {
  const { user } = useContext(AuthContext)
  const [rounds, setRounds] = useState<Round[]>([])

  useEffect(() => {
    const fetchRounds = async () => {
      const { data, error } = await supabase
        .from('Rounds')
        .select('*')
        .order('number')
        .match({ isOpen: false })
      if (error) console.error(error)
      else setRounds(data)
    }
    fetchRounds()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Public Results</h1>
        <Button onClick={handleLogout}>Log out</Button>
      </div>
      <VerticalTimeline lineColor="#e5e7eb">
        {rounds.map(r => (
          <VerticalTimelineElement
            key={r.id}
            date={`Round ${r.number}`}
            iconStyle={{ background: '#4f46e5', color: '#fff' }}
          >
            <Card>
              <CardHeader>{r.publicBrief}</CardHeader>
              <CardContent>{r.publicResults ?? 'Pending...'}</CardContent>
            </Card>
          </VerticalTimelineElement>
        ))}
      </VerticalTimeline>
    </div>
  )
}
```

src/routes/DMView\.tsx

```ts
import { supabase } from '../lib/supabaseClient'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component'
import 'react-vertical-timeline-component/style.min.css'

interface Round {
  id: string
  number: number
  publicBrief: string
  publicResults: string | null
  dmNotes: string | null
  isOpen: boolean
  createdAt: string
}

export default function DMView() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRounds = async () => {
    const { data, error } = await supabase.from('Rounds').select('*').order('number')
    if (error) console.error(error)
    else setRounds(data)
  }

  useEffect(() => {
    fetchRounds()
  }, [])

  const closeRound = async (roundId: string) => {
    setLoading(true)
    const { error } = await supabase.functions.invoke('resolveRound', { body: { roundId } })
    if (error) console.error(error)
    else await fetchRounds()
    setLoading(false)
  }

  const downloadCsv = async () => {
    const { data, error } = await supabase.rpc('export_moves_csv')
    if (error) {
      console.error(error)
      return
    }
    const blob = new Blob([data as string], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'moves.csv')
    document.body.appendChild(link)
    link.click()
    link.parentNode?.removeChild(link)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">DM Dashboard</h1>
        <div className="space-x-2">
          <Button onClick={downloadCsv}>Export CSV</Button>
          <Button onClick={fetchRounds} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>
      <VerticalTimeline lineColor="#e5e7eb">
        {rounds.map(r => (
          <VerticalTimelineElement
            key={r.id}
            date={`Round ${r.number}`}
            iconStyle={{ background: r.isOpen ? '#fbbf24' : '#10b981', color: '#fff' }}
          >
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <span>{r.publicBrief}</span>
                  {r.isOpen && (
                    <Button variant="outline" size="sm" onClick={() => closeRound(r.id)}>
                      Close round
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-2">
                  <strong>DM Notes:</strong> {r.dmNotes ?? '—'}
                </p>
                <p>
                  <strong>Public Results:</strong> {r.publicResults ?? '—'}
                </p>
              </CardContent>
            </Card>
          </VerticalTimelineElement>
        ))}
      </VerticalTimeline>
    </div>
  )
}
```

supabase/migrations/001\_init.sql

```sql
create extension if not exists "pgcrypto";

create table Teams (
  id uuid primary key default gen_random_uuid(),
  name text,
  createdAt timestamptz default now()
);

create table Rounds (
  id uuid primary key default gen_random_uuid(),
  number int check (number between 1 and 5),
  publicBrief text,
  publicResults text,
  dmNotes text,
  isOpen boolean default true,
  createdAt timestamptz default now()
);

create table Users (
  id uuid primary key references auth.users (id) on delete cascade,
  teamId uuid references Teams(id),
  displayName text
);

create table Moves (
  id uuid primary key default gen_random_uuid(),
  roundId uuid references Rounds(id) on delete cascade,
  userId uuid references Users(id) on delete cascade,
  role text,
  submission text,
  assistantsAllocated int,
  resources int,
  createdAt timestamptz default now(),
  unique (roundId, userId)
);

create table HiddenState (
  id uuid primary key default gen_random_uuid(),
  roundId uuid references Rounds(id) on delete cascade,
  variableName text,
  value jsonb
);

create table EventsDeck (
  id serial primary key,
  title text,
  description text,
  effectCode text
);

-- Row level security
alter table Rounds enable row level security;
alter table Moves enable row level security;
alter table HiddenState enable row level security;

create policy "rounds_participant_view"
  on Rounds
  for select
  using (isOpen OR createdAt < now());

create policy "moves_participant_view"
  on Moves
  for select
  using (auth.uid() = userId);

create policy "moves_participant_insert"
  on Moves
  for insert
  with check (auth.uid() = userId);

create or replace function export_moves_csv()
returns text
language plpgsql
security definer
as $$
declare
  csv text;
begin
  select string_agg(format('%s,%s,%s,%s,%s,%s',
    m.id, m.roundId, m.userId, m.role, m.submission, m.createdAt), E'\n')
  into csv
  from Moves m
  order by m.createdAt;
  return csv;
end $$;

grant execute on function export_moves_csv() to anon, authenticated;
```

supabase/functions/resolveRound/index.ts

```ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from 'supabase-js'

export const handler = async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { roundId } = await req.json()

  const { data: round, error: roundErr } = await supabase
    .from('Rounds')
    .select('*')
    .eq('id', roundId)
    .single()

  if (roundErr) {
    return new Response(JSON.stringify({ error: roundErr.message }), { status: 400 })
  }

  const { data: moves, error: movesErr } = await supabase
    .from('Moves')
    .select('*')
    .eq('roundId', roundId)

  if (movesErr) {
    return new Response(JSON.stringify({ error: movesErr.message }), { status: 400 })
  }

  const assistantFactor = Math.random() * 0.6 + 0.7 // 0.7–1.3
  let stakeholderInfluenceDelta = 0
  let publicSentimentDelta = 0
  let policyQualityDelta = 0

  moves.forEach(move => {
    stakeholderInfluenceDelta += (move.assistantsAllocated ?? 0) * assistantFactor
    policyQualityDelta += (move.resources ?? 0) * 0.1
  })

  publicSentimentDelta += Math.round(Math.random() * 20 - 10)

  await supabase.from('HiddenState').insert([
    { roundId, variableName: 'StakeholderInfluenceDelta', value: stakeholderInfluenceDelta },
    { roundId, variableName: 'PublicSentimentDelta', value: publicSentimentDelta },
    { roundId, variableName: 'PolicyQualityDelta', value: policyQualityDelta }
  ])

  const publicResults = `Stakeholder influence changed by ${stakeholderInfluenceDelta.toFixed(
    1
  )}. Public sentiment ${publicSentimentDelta >= 0 ? 'improved' : 'declined'} by ${Math.abs(
    publicSentimentDelta
  )}. Policy quality changed by ${policyQualityDelta.toFixed(1)}.`

  await supabase.from('Rounds').update({ isOpen: false, publicResults }).eq('id', roundId)

  return new Response(JSON.stringify({ success: true }))
}

Deno.serve(handler)
```

README.md

````markdown
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

```
```
