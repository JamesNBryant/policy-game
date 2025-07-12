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