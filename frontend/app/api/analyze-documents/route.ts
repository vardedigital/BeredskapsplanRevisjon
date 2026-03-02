// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, customInstructions } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Get session info
    const { data: session, error: sessionError } = await supabase
      .from('revision_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Update session status to processing
    // @ts-ignore
    await supabase
      .from('revision_sessions')
      .update({ status: 'processing' })
      .eq('session_id', sessionId)

    // Call pre-revision sync
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const syncResponse = await fetch(`${supabaseUrl}/functions/v1/pre-revision-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    const syncResult = await syncResponse.json()

    // Update session with compliance info
    await supabase
      .from('revision_sessions')
      .update({
        compliance_version: syncResult.latest_version_date,
        compliance_sources_used: syncResult.sources_used
      } as any)
      .eq('session_id', sessionId)

    // Call analyze-documents Edge Function
    const analyzeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        language: session.language,
        nynorskPreferences: session.nynorsk_preferences,
        customInstructions
      })
    })

    if (!analyzeResponse.ok) {
      throw new Error('Analysis failed')
    }

    const result = await analyzeResponse.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Analysis error:', error)
    
    // Update session status to failed
    try {
      const { sessionId } = await request.json()
      const supabase = getSupabaseClient()
      // @ts-ignore
      await supabase
        .from('revision_sessions')
        .update({ status: 'failed' })
        .eq('session_id', sessionId)
    } catch (e) {
      console.error('Error updating session status:', e)
    }

    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    )
  }
}