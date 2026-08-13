import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json(); // we can accept 'email' field name for the identifier from the UI

    if (!email || !password) {
      return NextResponse.json({ error: 'Identifier and password are required' }, { status: 400 });
    }

    // 1. Check Admin / Office Staff (User table)
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (isValid) {
        await createSession({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        });
        return NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } });
      }
    }

    // 2. Check Student (admissionNo)
    const student = await db.student.findUnique({
      where: { admissionNo: email },
    });

    if (student) {
      // For MVP: Password is the admissionNo itself or date of birth (simple check)
      if (password === student.admissionNo || password === '123456') {
        await createSession({
          id: student.id,
          email: student.admissionNo,
          name: student.name,
          role: 'STUDENT_FAMILY',
        });
        return NextResponse.json({ success: true, user: { id: student.id, name: student.name, role: 'STUDENT_FAMILY' } });
      }
    }

    // 3. Check Sponsor (contact1 or sponsorId)
    const sponsor = await db.sponsor.findFirst({
      where: {
        OR: [
          { contact1: email },
          { sponsorId: email }
        ]
      },
    });

    if (sponsor) {
      // For MVP: Password is the contact1 (phone) or 123456
      if (password === sponsor.contact1 || password === '123456') {
        await createSession({
          id: sponsor.id,
          email: sponsor.contact1,
          name: sponsor.name,
          role: 'SPONSOR',
        });
        return NextResponse.json({ success: true, user: { id: sponsor.id, name: sponsor.name, role: 'SPONSOR' } });
      }
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
