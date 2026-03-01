import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting compliance sync...')

    // Get all active compliance sources
    const { data: sources, error: sourcesError } = await supabaseClient
      .from('compliance_sources')
      .select('*')
      .eq('is_active', true)

    if (sourcesError) throw sourcesError

    const results = {
      updated: 0,
      failed: 0,
      sources_processed: sources?.length || 0,
      details: []
    }

    for (const source of sources || []) {
      try {
        console.log(`Processing source: ${source.name}`)
        
        // Fetch content from source
        const content = await fetchSourceContent(source)
        
        // Calculate content hash
        const contentHash = await calculateHash(content)
        
        // Check if content has changed
        if (contentHash === source.content_hash) {
          console.log(`No changes for ${source.name}`)
          results.details.push({
            source: source.name,
            status: 'unchanged'
          })
          continue
        }

        // Extract compliance rules from content
        const rules = await extractComplianceRules(source, content)
        
        // Update source
        const { error: updateError } = await supabaseClient
          .from('compliance_sources')
          .update({
            content_hash: contentHash,
            last_checked_at: new Date().toISOString()
          })
          .eq('id', source.id)

        if (updateError) throw updateError

        // Deactivate old rules for this source
        await supabaseClient
          .from('compliance_rules')
          .update({ is_active: false })
          .eq('source_id', source.id)

        // Insert new rules
        for (const rule of rules) {
          await supabaseClient
            .from('compliance_rules')
            .insert({
              source_id: source.id,
              rule_key: rule.key,
              rule_text: rule.text,
              rule_version: rule.version,
              category: rule.category,
              priority: rule.priority,
              is_active: true
            })
        }

        results.updated++
        results.details.push({
          source: source.name,
          status: 'updated',
          rules_count: rules.length
        })

        console.log(`Updated ${source.name} with ${rules.length} rules`)

      } catch (error) {
        console.error(`Error processing ${source.name}:`, error)
        results.failed++
        results.details.push({
          source: source.name,
          status: 'failed',
          error: error.message
        })
      }
    }

    console.log('Compliance sync completed:', results)

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Compliance sync error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function fetchSourceContent(source: any): Promise<string> {
  try {
    if (source.rss_url) {
      // Fetch RSS feed
      const response = await fetch(source.rss_url)
      const rssText = await response.text()
      return rssText
    } else {
      // Fetch regular webpage
      const response = await fetch(source.url)
      const html = await response.text()
      return html
    }
  } catch (error) {
    console.error(`Error fetching content for ${source.name}:`, error)
    throw error
  }
}

async function calculateHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

async function extractComplianceRules(source: any, content: string): Promise<any[]> {
  const rules: any[] = []
  
  // This is a simplified extraction logic
  // In production, you would use more sophisticated parsing
  // and potentially AI to extract structured rules
  
  const sourceType = source.source_type
  const version = new Date().toISOString().slice(0, 7) // YYYY-MM format
  
  // Extract rules based on source type
  if (sourceType === 'lov' || sourceType === 'forskrift') {
    // Extract paragraphs and requirements
    const paragraphs = content.match(/§\s*\d+[^§]*/g) || []
    
    for (const para of paragraphs) {
      if (para.length > 50) { // Filter out very short matches
        rules.push({
          key: `${sourceType}_${para.slice(0, 30).replace(/\s+/g, '_').toLowerCase()}`,
          text: para.trim().slice(0, 500),
          version: version,
          category: sourceType,
          priority: 'MUST'
        })
      }
    }
  } else if (sourceType === 'dsb' || sourceType === 'ks') {
    // Extract guidance and recommendations
    const sections = content.split(/(?:\n\s*){2,}/)
    
    for (const section of sections) {
      if (section.length > 100 && section.length < 1000) {
        const hasRequirement = /skal|bør|må|krav|plikt/i.test(section)
        
        rules.push({
          key: `${sourceType}_${section.slice(0, 30).replace(/\s+/g, '_').toLowerCase()}`,
          text: section.trim(),
          version: version,
          category: sourceType,
          priority: hasRequirement ? 'MUST' : 'SHOULD'
        })
      }
    }
  } else if (sourceType === 'tilsyn') {
    // Extract typical findings and requirements
    const findings = content.match(/(?:manglende|utdatert|ufullstendig|svak|ikke|bør)[^.!?]*[.!?]/gi) || []
    
    for (const finding of findings) {
      if (finding.length > 30) {
        rules.push({
          key: `tilsyn_${finding.slice(0, 30).replace(/\s+/g, '_').toLowerCase()}`,
          text: finding.trim(),
          version: version,
          category: 'Tilsyn',
          priority: 'MUST'
        })
      }
    }
  }
  
  // Limit to reasonable number of rules per source
  return rules.slice(0, 50)
}