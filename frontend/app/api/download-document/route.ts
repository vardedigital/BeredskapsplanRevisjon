import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Get updated plan from database
    const { data: planData, error: planError } = await supabase
      .from('revision_results')
      .select('*')
      .eq('session_id', sessionId)
      .eq('result_type', 'updated_plan')
      .single()

    if (planError || !planData) {
      return NextResponse.json({ error: 'Updated plan not found' }, { status: 404 })
    }

    // Get changes for checklist
    const { data: changesData } = await supabase
      .from('revision_changes')
      .select('*')
      .eq('session_id', sessionId)
      .order('priority', { ascending: false })

    // Create Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: "Revidert Beredskapsplan",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          
          // Date
          new Paragraph({
            text: `Revisjonsdato: ${new Date().toLocaleDateString('nb-NO')}`,
            spacing: { after: 600 }
          }),

          // Updated plan content
          ...parseContentToParagraphs(planData.content),

          // Page break before checklist
          new Paragraph({
            text: "",
            pageBreakBefore: true
          }),

          // Checklist title
          new Paragraph({
            text: "Endringslogg",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 400 }
          }),

          // Changes checklist
          ...(changesData || []).map(change => [
            new Paragraph({
              text: change.section,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Prioritet: ",
                  bold: true
                }),
                new TextRun(change.priority)
              ],
              spacing: { after: 100 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Kilde: ",
                  bold: true
                }),
                new TextRun(change.source)
              ],
              spacing: { after: 100 }
            }),
            change.old_text ? new Paragraph({
              children: [
                new TextRun({
                  text: "Gammel tekst: ",
                  bold: true
                }),
                new TextRun({
                  text: change.old_text,
                  strike: true
                })
              ],
              spacing: { after: 100 }
            }) : null,
            new Paragraph({
              children: [
                new TextRun({
                  text: "Ny tekst: ",
                  bold: true
                }),
                new TextRun(change.new_text)
              ],
              spacing: { after: 300 }
            })
          ]).flat().filter(Boolean)
        ]
      }]
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="revidert_beredskapsplan_${sessionId}.docx"`
      }
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}

function parseContentToParagraphs(content: string): Paragraph[] {
  // Split content by newlines and create paragraphs
  const lines = content.split('\n').filter(line => line.trim())
  
  const paragraphs: Paragraph[] = []
  
  for (const line of lines) {
    // Check if it's a heading (starts with #)
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)?.[0].length || 1
      const headingLevel = level > 6 ? HeadingLevel.HEADING_6 : 
                          level === 1 ? HeadingLevel.HEADING_1 :
                          level === 2 ? HeadingLevel.HEADING_2 :
                          level === 3 ? HeadingLevel.HEADING_3 :
                          level === 4 ? HeadingLevel.HEADING_4 :
                          level === 5 ? HeadingLevel.HEADING_5 :
                          HeadingLevel.HEADING_6
      
      paragraphs.push(new Paragraph({
        text: line.replace(/^#+\s*/, ''),
        heading: headingLevel,
        spacing: { before: 200, after: 100 }
      }))
    } else {
      // Regular paragraph
      paragraphs.push(new Paragraph({
        text: line,
        spacing: { after: 100 }
      }))
    }
  }
  
  return paragraphs
}