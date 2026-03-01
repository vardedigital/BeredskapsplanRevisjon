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
    const { sessionId, language, nynorskPreferences, customInstructions } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Starting document analysis for session: ${sessionId}`)

    // Get session info
    const { data: session, error: sessionError } = await supabaseClient
      .from('revision_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    if (sessionError) throw sessionError

    // Get uploaded documents
    const { data: documents, error: docsError } = await supabaseClient
      .from('temp_documents')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_processed', false)

    if (docsError) throw docsError

    if (!documents || documents.length === 0) {
      throw new Error('No documents found for analysis')
    }

    // Get compliance rules
    const { data: complianceRules, error: rulesError } = await supabaseClient
      .from('compliance_rules')
      .select('*')
      .eq('is_active', true)

    if (rulesError) throw rulesError

    // Prepare document content
    const rosDocument = documents.find(d => d.document_type === 'ros')
    const planDocuments = documents.filter(d => d.document_type.startsWith('plan'))

    if (!rosDocument) {
      throw new Error('ROS document is required')
    }

    if (planDocuments.length === 0) {
      throw new Error('At least one plan document is required')
    }

    // Build Claude prompt
    const claudePrompt = buildClaudePrompt({
      rosText: rosDocument.extracted_text || '',
      planText: planDocuments.map(d => d.extracted_text || '').join('\n\n'),
      complianceRules: complianceRules || [],
      language: language || 'bokmal',
      nynorskPreferences: nynorskPreferences || {},
      customInstructions: customInstructions || ''
    })

    // Call Claude API
    const claudeResponse = await callClaudeAPI(claudePrompt)

    // Parse Claude response
    const analysisResult = parseClaudeResponse(claudeResponse)

    // Update session status
    await supabaseClient
      .from('revision_sessions')
      .update({
        status: 'completed',
        compliance_score: analysisResult.complianceScore,
        completed_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)

    // Store results
    await storeAnalysisResults(supabaseClient, sessionId, analysisResult)

    // Mark documents as processed
    for (const doc of documents) {
      await supabaseClient
        .from('temp_documents')
        .update({ is_processed: true })
        .eq('id', doc.id)
    }

    console.log('Document analysis completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        complianceScore: analysisResult.complianceScore,
        changesCount: analysisResult.changes.length,
        exercisePlansCount: analysisResult.exercisePlans.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Document analysis error:', error)
    
    // Update session status to failed
    try {
      const { sessionId } = await req.json()
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      await supabaseClient
        .from('revision_sessions')
        .update({ status: 'failed' })
        .eq('session_id', sessionId)
    } catch (e) {
      console.error('Error updating session status:', e)
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function buildClaudePrompt(params: any): string {
  const { rosText, planText, complianceRules, language, nynorskPreferences, customInstructions } = params

  const languageInstructions = language === 'nynorsk' 
    ? `
Nynorsk-språkinnstillinger:
- Pronomen: ${nynorskPreferences.pronoun || 'Vi'}
- Verbform: ${nynorskPreferences.verbForm || 'å vere'}
- Endingar: ${nynorskPreferences.ending || 'a-endingsform'}
- Bruk konsistent nynorsk gjennom hele teksten
`
    : `
Bruk konsistent bokmål gjennom hele teksten.
`

  const complianceRulesText = complianceRules.map(rule => 
    `[${rule.priority}] ${rule.rule_text} (Kilde: ${rule.category})`
  ).join('\n')

  return `Du er en ekspert på norsk kommunal beredskap og lovgivning. Din oppgave er å analysere en ROS og en beredskapsplan for en norsk kommune.

${languageInstructions}

VIKTIGE INSTRUKSJONER:
1. Du skal sikre 100% samsvar med norsk lov, forskrift, DSB-veiledere, KS-råd og typiske tilsynsfunn.
2. Ikke hallusiner - bruk kun informasjon fra de oppgitte dokumentene og compliance-reglene.
3. Vær nøyaktig og grundig i analysen.
4. Hvis du er usikker på juridiske tolkninger, svar: "Manuell juridisk kontroll nødvendig."

BRUKERENS TILLEGGSINSTRUKSJONER (høy prioritet):
${customInstructions || 'Ingen spesifikke tilleggsinstruksjoner.'}

COMPLIANCE-REGLER:
${complianceRulesText}

ROS-DOKUMENT:
${rosText}

BEREDSKAPSPLAN:
${planText}

ANALYSEOPPGAVE:
1. Sammenlign ROS og planen med alle compliance-reglene
2. Identifiser MUST-endringer (påkrevd av lov/forskrift/DSB/tilsyn)
3. Identifiser SHOULD/COULD-endringer (beste praksis/KS/gov)
4. Gi en compliance-score (0-100%)
5. Generer en oppdatert plan som lukker alle MUST-gap
6. Lag en detaljert endringslogg
7. Foreslå en øvingsplan basert på topp-risikoene fra ROS
8. Lag en tilsynssjekkliste og rapportutkast

SVAR I FØLGENDE JSON-FORMAT:
{
  "complianceScore": 85,
  "summary": "Kort sammendrag av analysen",
  "mustChanges": [
    {
      "section": "Kapittel X",
      "action": "modify",
      "oldText": "Gammel tekst",
      "newText": "Ny tekst",
      "source": "Lov/Forskrift/DSB/KS/Tilsyn",
      "chapterReference": "X.Y",
      "reason": "Forklaring på hvorfor endringen er nødvendig"
    }
  ],
  "shouldChanges": [
    {
      "section": "Kapittel Y",
      "action": "add",
      "newText": "Ny tekst",
      "source": "KS/Beste praksis",
      "chapterReference": "Y.Z",
      "reason": "Forklaring"
    }
  ],
  "updatedPlan": "Full oppdatert plan tekst...",
  "exercisePlans": [
    {
      "name": "Øvelsesnavn",
      "scenario": "Beskrivelse av scenario",
      "mainGoal": "Hovedmål med øvelsen",
      "suggestedFrequency": "Årlig",
      "responsibleRole": "Beredskapskoordinator",
      "evaluationRequired": true
    }
  ],
  "supervisionChecklist": [
    {
      "requirementArea": "Kravområde",
      "source": "Kilde",
      "requirementText": "Kravtekst",
      "aiAssessment": "covered/partially_covered/not_covered",
      "chapterReference": "X.Y"
    }
  ],
  "supervisionReport": "Full tilsynsrapport utkast..."
}

Vær grundig og detaljert i analysen.`
}

async function callClaudeAPI(prompt: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'dangerously-allow-browser': 'false'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      system: 'Du er en ekspert på norsk kommunal beredskap og lovgivning. Du analyserer dokumenter for å sikre 100% compliance med lov, forskrift, DSB-veiledere, KS-råd og tilsynsfunn.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  return data.content[0].text
}

function parseClaudeResponse(response: string): any {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response')
    }
    
    const parsed = JSON.parse(jsonMatch[0])
    return parsed
  } catch (error) {
    console.error('Error parsing Claude response:', error)
    throw new Error('Failed to parse Claude response')
  }
}

async function storeAnalysisResults(supabaseClient: any, sessionId: string, result: any): Promise<void> {
  // Store updated plan
  await supabaseClient
    .from('revision_results')
    .insert({
      session_id: sessionId,
      result_type: 'updated_plan',
      content: result.updatedPlan,
      content_json: { plan: result.updatedPlan }
    })

  // Store change log
  await supabaseClient
    .from('revision_results')
    .insert({
      session_id: sessionId,
      result_type: 'change_log',
      content: JSON.stringify(result.mustChanges.concat(result.shouldChanges)),
      content_json: {
        mustChanges: result.mustChanges,
        shouldChanges: result.shouldChanges
      }
    })

  // Store exercise plans
  await supabaseClient
    .from('revision_results')
    .insert({
      session_id: sessionId,
      result_type: 'exercise_plan',
      content: JSON.stringify(result.exercisePlans),
      content_json: { exercisePlans: result.exercisePlans }
    })

  // Store supervision checklist
  await supabaseClient
    .from('revision_results')
    .insert({
      session_id: sessionId,
      result_type: 'supervision_checklist',
      content: JSON.stringify(result.supervisionChecklist),
      content_json: { checklist: result.supervisionChecklist }
    })

  // Store supervision report
  await supabaseClient
    .from('revision_results')
    .insert({
      session_id: sessionId,
      result_type: 'supervision_report',
      content: result.supervisionReport,
      content_json: { report: result.supervisionReport }
    })

  // Store individual changes
  for (const change of result.mustChanges) {
    await supabaseClient
      .from('revision_changes')
      .insert({
        session_id: sessionId,
        section: change.section,
        action: change.action,
        old_text: change.oldText,
        new_text: change.newText,
        source: change.source,
        priority: 'MUST',
        chapter_reference: change.chapterReference
      })
  }

  for (const change of result.shouldChanges) {
    await supabaseClient
      .from('revision_changes')
      .insert({
        session_id: sessionId,
        section: change.section,
        action: change.action,
        new_text: change.newText,
        source: change.source,
        priority: change.source === 'Tilsyn' ? 'MUST' : 'SHOULD',
        chapter_reference: change.chapterReference
      })
  }

  // Store exercise plans
  for (const exercise of result.exercisePlans) {
    await supabaseClient
      .from('exercise_plans')
      .insert({
        session_id: sessionId,
        exercise_name: exercise.name,
        scenario: exercise.scenario,
        main_goal: exercise.mainGoal,
        suggested_frequency: exercise.suggestedFrequency,
        responsible_role: exercise.responsibleRole,
        evaluation_required: exercise.evaluationRequired
      })
  }

  // Store supervision checklist items
  for (const item of result.supervisionChecklist) {
    await supabaseClient
      .from('supervision_checklists')
      .insert({
        session_id: sessionId,
        requirement_area: item.requirementArea,
        source: item.source,
        requirement_text: item.requirementText,
        ai_assessment: item.aiAssessment,
        chapter_reference: item.chapterReference
      })
  }
}