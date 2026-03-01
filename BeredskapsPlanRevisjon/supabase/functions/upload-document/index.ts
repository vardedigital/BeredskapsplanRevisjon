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
    const formData = await req.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const sessionId = formData.get('sessionId') as string
    const tenantId = formData.get('tenantId') as string
    const userId = formData.get('userId') as string

    if (!file || !documentType || !sessionId || !tenantId || !userId) {
      throw new Error('Missing required fields')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Uploading document: ${file.name}, type: ${documentType}`)

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${sessionId}_${documentType}_${Date.now()}.${fileExt}`
    const filePath = `temp/${fileName}`

    // Upload to temporary storage bucket
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('temp-documents')
      .upload(filePath, file, {
        cacheControl: '600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Extract text from document
    const extractedText = await extractTextFromFile(file)

    // Calculate expiry time (10 minutes from now)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Store document metadata in database
    const { data: docData, error: docError } = await supabaseClient
      .from('temp_documents')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        session_id: sessionId,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        extracted_text: extractedText,
        expires_at: expiresAt.toISOString(),
        is_processed: false
      })
      .select()
      .single()

    if (docError) throw docError

    console.log('Document uploaded successfully:', docData.id)

    return new Response(
      JSON.stringify({
        success: true,
        documentId: docData.id,
        fileName: file.name,
        documentType,
        extractedTextLength: extractedText.length,
        expiresAt: expiresAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Document upload error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()
  
  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await extractTextFromPDF(file)
    } else if (
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx')
    ) {
      return await extractTextFromWord(file)
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await file.text()
    } else {
      throw new Error(`Unsupported file type: ${fileType}`)
    }
  } catch (error) {
    console.error('Error extracting text:', error)
    throw new Error(`Failed to extract text from file: ${error.message}`)
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  // For PDF extraction, we'll use a simple approach
  // In production, you might want to use a dedicated PDF extraction library
  // or call an external service
  
  // This is a placeholder - in a real implementation, you would:
  // 1. Use a library like pdf-parse or pdfjs-dist
  // 2. Or call an external OCR service
  
  // For now, return a placeholder message
  return `[PDF tekstuttrekk for ${file.name} - I produksjon vil dette inneholde full tekst]`
}

async function extractTextFromWord(file: File): Promise<string> {
  // For Word document extraction
  // In production, use libraries like mammoth.js or similar
  
  // Placeholder implementation
  return `[Word dokument tekstuttrekk for ${file.name} - I produksjon vil dette inneholde full tekst]`
}