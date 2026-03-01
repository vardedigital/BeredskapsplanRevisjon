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
    const { sessionId } = await req.json()

    if (!sessionId) {
      throw new Error('sessionId is required')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Starting cleanup for session: ${sessionId}`)

    // Get all documents for this session
    const { data: documents, error: docsError } = await supabaseClient
      .from('temp_documents')
      .select('*')
      .eq('session_id', sessionId)

    if (docsError) throw docsError

    // Delete files from storage
    for (const doc of documents || []) {
      try {
        await supabaseClient
          .storage
          .from('temp-documents')
          .remove([doc.file_path])
        
        console.log(`Deleted file: ${doc.file_path}`)
      } catch (error) {
        console.error(`Error deleting file ${doc.file_path}:`, error)
      }
    }

    // Delete documents from database
    const { error: deleteDocsError } = await supabaseClient
      .from('temp_documents')
      .delete()
      .eq('session_id', sessionId)

    if (deleteDocsError) throw deleteDocsError

    // Delete revision results
    const { error: deleteResultsError } = await supabaseClient
      .from('revision_results')
      .delete()
      .eq('session_id', sessionId)

    if (deleteResultsError) throw deleteResultsError

    // Delete revision changes
    const { error: deleteChangesError } = await supabaseClient
      .from('revision_changes')
      .delete()
      .eq('session_id', sessionId)

    if (deleteChangesError) throw deleteChangesError

    // Delete exercise plans
    const { error: deleteExercisesError } = await supabaseClient
      .from('exercise_plans')
      .delete()
      .eq('session_id', sessionId)

    if (deleteExercisesError) throw deleteExercisesError

    // Delete supervision checklists
    const { error: deleteChecklistsError } = await supabaseClient
      .from('supervision_checklists')
      .delete()
      .eq('session_id', sessionId)

    if (deleteChecklistsError) throw deleteChecklistsError

    // Mark session as completed/cleaned
    const { error: updateSessionError } = await supabaseClient
      .from('revision_sessions')
      .update({ status: 'completed' })
      .eq('session_id', sessionId)

    if (updateSessionError) throw updateSessionError

    console.log('Session cleanup completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        deletedDocuments: documents?.length || 0,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Session cleanup error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})