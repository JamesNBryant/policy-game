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