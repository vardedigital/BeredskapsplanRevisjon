import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting pre-revision sync...')

    // Check if compliance data needs updating
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: sources, error: sourcesError } = await supabaseClient
      .from('compliance_sources')
      .select('*')
      .eq('is_active', true)
      .lt('last_checked_at', sevenDaysAgo.toISOString())

    if (sourcesError) throw sourcesError

    let syncNeeded = sources && sources.length > 0
    let syncResult = null

    if (syncNeeded) {
      console.log('Compliance data needs updating, triggering sync...')
      
      // Trigger compliance sync
      const syncResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/compliance-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trigger: 'pre_revision' })
        }
      )

      syncResult = await syncResponse.json()
      console.log('Sync result:', syncResult)
    }

    // Get current compliance version info
    const { data: latestRules, error: rulesError } = await supabaseClient
      .from('compliance_rules')
      .select('rule_version, source_id')
      .eq('is_active', true)

    if (rulesError) throw rulesError

    // Get unique versions and sources
    const versions = [...new Set(latestRules?.map(r => r.rule_version) || [])]
    const sourceIds = [...new Set(latestRules?.map(r => r.source_id) || [])]

    const { data: sourceNames, error: sourceNamesError } = await supabaseClient
      .from('compliance_sources')
      .select('id, name, source_type')
      .in('id', sourceIds)

    if (sourceNamesError) throw sourceNamesError

    const sourcesUsed = sourceNames?.map(s => ({
      name: s.name,
      type: s.source_type
    })) || []

    const latestVersion = versions.sort().pop() || 'unknown'

    const result = {
      sync_needed: syncNeeded,
      sync_result: syncResult,
      latest_version_date: latestVersion,
      sources_used: sourcesUsed,
      rules_count: latestRules?.length || 0,
      timestamp: new Date().toISOString()
    }

    console.log('Pre-revision sync completed:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Pre-revision sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})