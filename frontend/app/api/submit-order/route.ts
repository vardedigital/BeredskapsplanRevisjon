import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      municipalityName,
      orgNumber,
      reference,
      ordererName,
      invoiceAddress,
      ordererEmail,
      users,
      userEmails
    } = body

    // Validate required fields
    if (!municipalityName || !orgNumber || !reference || !ordererName || 
        !invoiceAddress || !ordererEmail || !users || !userEmails) {
      return NextResponse.json(
        { error: 'Alle felt merket med * er påkrevd' },
        { status: 400 }
      )
    }

    // Parse users and emails
    const userNames = users.split('\n').map((u: string) => u.trim()).filter((u: string) => u)
    const userEmailList = userEmails.split('\n').map((e: string) => e.trim()).filter((e: string) => e)

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    for (const email of userEmailList) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: `Ugyldig e-postformat: ${email}` },
          { status: 400 }
        )
      }
    }

    // Calculate pricing
    const basePrice = 2990
    const numUsers = userNames.length
    const discount = numUsers > 1 ? (numUsers - 1) * 0.10 : 0
    const totalPrice = basePrice * (1 - discount)

    // Create HTML email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .section { margin-bottom: 20px; }
    .label { font-weight: bold; color: #666; }
    .value { margin-bottom: 10px; }
    .price-box { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Ny Bestilling - Beredskapsplan Revisjon</h1>
    </div>
    <div class="content">
      <div class="section">
        <div class="label">Kommunenavn:</div>
        <div class="value">${municipalityName}</div>
        
        <div class="label">EHF/Org.nr.:</div>
        <div class="value">${orgNumber}</div>
        
        <div class="label">Referanse:</div>
        <div class="value">${reference}</div>
      </div>

      <div class="section">
        <h3>👤 Bestiller</h3>
        <div class="label">Navn:</div>
        <div class="value">${ordererName}</div>
        
        <div class="label">E-post:</div>
        <div class="value">${ordererEmail}</div>
        
        <div class="label">Fakturaadresse:</div>
        <div class="value">${invoiceAddress.replace(/\n/g, '<br>')}</div>
      </div>

      <div class="section">
        <h3>👥 Brukere (${numUsers})</h3>
        <div class="label">Navn:</div>
        <div class="value">${userNames.map((name: string, i: number) => `${i + 1}. ${name}`).join('<br>')}</div>
        
        <div class="label">E-postadresser for tilgang:</div>
        <div class="value">${userEmailList.map((email: string, i: number) => `${i + 1}. ${email}`).join('<br>')}</div>
      </div>

      <div class="price-box">
        <h3>💰 Prisoversikt</h3>
        <div class="value">Grunnpris (1 bruker): kr ${basePrice},-</div>
        <div class="value">Antall tilleggsbrukere: ${numUsers - 1}</div>
        <div class="value">Rabatt: ${(discount * 100).toFixed(0)}%</div>
        <div class="value" style="font-size: 18px; font-weight: bold; color: #2e7d32;">
          Totalpris: kr ${totalPrice.toFixed(0)},- per år
        </div>
      </div>

      <div class="section">
        <div class="label">Bestilling mottatt:</div>
        <div class="value">${new Date().toLocaleString('nb-NO')}</div>
      </div>
    </div>
    <div class="footer">
      <p>Beredskapsplan Revisjon - Varde Digital Solutions</p>
      <p>Denne e-posten ble sendt automatisk fra bestillingsskjemaet</p>
    </div>
  </div>
</body>
</html>
`

    // Send email using Resend
    try {
      const { data, error } = await resend.emails.send({
        from: 'Beredskapsplan Revisjon <noreply@vardedigital.no>',
        to: ['kontakt@vardedigital.com'],
        subject: `Ny bestilling: ${municipalityName}`,
        html: emailHtml,
        replyTo: ordererEmail
      })

      if (error) {
        console.error('Resend error:', error)
        throw error
      }

      console.log('Email sent successfully:', data)
    } catch (emailError) {
      console.error('Email sending error:', emailError)
      // Continue even if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      message: 'Bestilling mottatt! Vi vil kontakte deg innen 24 timer for bekreftelse og oppsett av tilgang.',
      orderId: `ORD-${Date.now()}`,
      totalPrice: totalPrice.toFixed(0)
    })

  } catch (error) {
    console.error('Order submission error:', error)
    return NextResponse.json(
      { error: 'Det oppstod en feil ved sending av bestilling. Prøv igjen eller kontakt kontakt@vardedigital.com' },
      { status: 500 }
    )
  }
}