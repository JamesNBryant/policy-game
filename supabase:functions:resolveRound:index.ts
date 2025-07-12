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