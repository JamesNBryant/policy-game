import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request): Promise<Response> => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { roundId } = await req.json()

    // 1️⃣ Fetch the round
    const { data: round, error: roundErr } = await supabase
      .from('Rounds')
      .select('*')
      .eq('id', roundId)
      .single()

    if (roundErr || !round) {
      return new Response(
        JSON.stringify({ error: roundErr?.message ?? 'Round not found' }),
        { status: 400 }
      )
    }

    // 2️⃣ Fetch moves for this round
    const { data: moves, error: movesErr } = await supabase
      .from('Moves')
      .select('*')
      .eq('roundId', roundId)

    if (movesErr) {
      return new Response(JSON.stringify({ error: movesErr.message }), { status: 400 })
    }

    // 3️⃣ Business logic: aggregate deltas
    const assistantFactor = Math.random() * 0.6 + 0.7 // 0.7 – 1.3
    let stakeholderInfluenceDelta = 0
    let publicSentimentDelta = 0
    let policyQualityDelta = 0

    for (const move of moves) {
      stakeholderInfluenceDelta += (move.assistantsAllocated ?? 0) * assistantFactor
      policyQualityDelta += (move.resources ?? 0) * 0.1
    }

    publicSentimentDelta += Math.round(Math.random() * 20 - 10)

    // 4️⃣ Persist hidden deltas
    const hiddenRows = [
      { roundId, variableName: 'StakeholderInfluenceDelta', value: stakeholderInfluenceDelta },
      { roundId, variableName: 'PublicSentimentDelta', value: publicSentimentDelta },
      { roundId, variableName: 'PolicyQualityDelta', value: policyQualityDelta }
    ]
    const { error: hiddenErr } = await supabase.from('HiddenState').insert(hiddenRows)
    if (hiddenErr) {
      return new Response(JSON.stringify({ error: hiddenErr.message }), { status: 400 })
    }

    // 5️⃣ Craft public results text
    const publicResults = `Stakeholder influence changed by ${stakeholderInfluenceDelta.toFixed(
      1
    )}. Public sentiment ${
      publicSentimentDelta >= 0 ? 'improved' : 'declined'
    } by ${Math.abs(publicSentimentDelta)}. Policy quality changed by ${policyQualityDelta.toFixed(
      1
    )}.`

    // 6️⃣ Close the round
    const { error: roundUpdateErr } = await supabase
      .from('Rounds')
      .update({ isOpen: false, publicResults })
      .eq('id', roundId)

    if (roundUpdateErr) {
      return new Response(JSON.stringify({ error: roundUpdateErr.message }), { status: 400 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 400 })
  }
})
