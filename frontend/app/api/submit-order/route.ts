import { NextRequest, NextResponse } from 'next/server'

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
    const userNames = users.split('\n').map(u => u.trim()).filter(u => u)
    const userEmailList = userEmails.split('\n').map(e => e.trim()).filter(e => e)

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

    // Create order email content
    const emailContent = `
NY BESTILLING - Beredskapsplan Revisjon

Kommunenavn: ${municipalityName}
EHF/Org.nr.: ${orgNumber}
Referanse: ${reference}

BESTILLER
Navn: ${ordererName}
E-post: ${ordererEmail}
Fakturaadresse:
${invoiceAddress}

BRUKERE
Antall brukere: ${numUsers}
Navn:
${userNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}

E-postadresser for tilgang:
${userEmailList.map((email, i) => `${i + 1}. ${email}`).join('\n')}

PRIS
Grunnpris (1 bruker): kr ${basePrice},-
Antall tilleggsbrukere: ${numUsers - 1}
Rabatt: ${(discount * 100).toFixed(0)}%
Totalpris: kr ${totalPrice.toFixed(0)},- per år

Bestilling mottatt: ${new Date().toLocaleString('nb-NO')}
`

    // In production, send this email to sales/support
    // For now, log it and return success
    console.log('Order received:', emailContent)

    // TODO: Send email to support@vardedigital.no
    // TODO: Store order in database
    // TODO: Send confirmation email to orderer

    return NextResponse.json({
      success: true,
      message: 'Bestilling mottatt! Vi vil kontakte deg innen 24 timer for bekreftelse og oppsett av tilgang.',
      orderId: `ORD-${Date.now()}`,
      totalPrice: totalPrice.toFixed(0)
    })

  } catch (error) {
    console.error('Order submission error:', error)
    return NextResponse.json(
      { error: 'Det oppstod en feil ved sending av bestilling. Prøv igjen eller kontakt support@vardedigital.no' },
      { status: 500 }
    )
  }
}