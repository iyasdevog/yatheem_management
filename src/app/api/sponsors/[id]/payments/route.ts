import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/sponsors/[id]/payments  — list all payments + summary
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sponsor = await db.sponsor.findUnique({
      where: { id },
      select: { id: true, name: true, sponsorId: true, annualCommitment: true },
    });

    if (!sponsor) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });
    }

    const payments = await db.sponsorPayment.findMany({
      where: { sponsorId: id },
      orderBy: { date: 'desc' },
    });

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const commitment = sponsor.annualCommitment ?? 0;
    const balance = commitment - totalPaid;

    return NextResponse.json({
      sponsor,
      payments,
      summary: {
        annualCommitment: commitment,
        totalPaid,
        balance,
        percentPaid: commitment > 0 ? Math.min(100, (totalPaid / commitment) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error('SponsorPayment GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payments', details: error?.message }, { status: 500 });
  }
}

// POST /api/sponsors/[id]/payments  — record a new payment installment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, date, paymentMode, reference, notes, recordedBy } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const sponsor = await db.sponsor.findUnique({ where: { id } });
    if (!sponsor) {
      return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });
    }

    const payment = await db.sponsorPayment.create({
      data: {
        sponsorId: id,
        amount: Number(amount),
        date: date ? new Date(date) : new Date(),
        paymentMode: paymentMode || 'Cash',
        reference: reference || null,
        notes: notes || null,
        recordedBy: recordedBy || null,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('SponsorPayment POST error:', error);
    return NextResponse.json({ error: 'Failed to record payment', details: error?.message }, { status: 500 });
  }
}

// DELETE /api/sponsors/[id]/payments?paymentId=xxx  — remove a payment record
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // resolve params (not needed for delete but required by Next.js)
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    await db.sponsorPayment.delete({ where: { id: paymentId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SponsorPayment DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete payment', details: error?.message }, { status: 500 });
  }
}
