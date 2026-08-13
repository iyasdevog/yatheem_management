import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { StorageFactory } from '@/lib/storage/StorageFactory';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const districtId = searchParams.get('districtId');
    const familyNo = searchParams.get('familyNo');

    const where: any = {};
    if (status) where.status = status;
    if (districtId) where.districtId = districtId;
    if (familyNo) where.familyNo = familyNo;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { admissionNo: { contains: search } },
        { familyNo: { contains: search } },
        { houseName: { contains: search } },
        { place: { contains: search } },
      ];
    }

    const students = await db.student.findMany({
      where,
      include: {
        sponsor: true,
        mahallu: true,
        educationalRecords: {
          orderBy: { academicYear: 'desc' },
        },
        slabAllocations: {
          include: { slab: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const storage = StorageFactory.getStorageService();

    // Map storage keys to display URLs dynamically
    const studentsWithUrls = await Promise.all(
      students.map(async (student) => {
        let photoUrl = null;
        if (student.photoKey) {
          photoUrl = await storage.getFileUrl(student.photoKey);
        }

        // Mask sponsor details if anonymous (for public or family requests)
        let displaySponsor = student.sponsor;
        if (student.sponsor && student.sponsor.isAnonymous) {
          displaySponsor = {
            ...student.sponsor,
            name: 'Well-wisher',
            contact1: 'Hidden (Anonymous)',
            contact2: null,
            whatsapp: null,
            houseName: 'Protected',
          };
        }

        return {
          ...student,
          photoUrl,
          sponsor: displaySponsor,
        };
      })
    );

    return NextResponse.json(studentsWithUrls);
  } catch (error) {
    console.error('Students GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      admissionNo,
      familyNo,
      admissionDate,
      name,
      dob,
      gender,
      nationalId,
      photoKey,
      contact1,
      contact2,
      whatsapp,
      status,
      inactiveReason,
      sponsorId,
      sponsorshipStartDate,
      guardianName,
      fatherName,
      motherName,
      houseName,
      place,
      stateId,
      districtId,
      localBodyTypeId,
      localBodyId,
      postOfficeId,
      pinCode,
      mahalluId,
      familyCategory,
      educationalRecords, // Array of yearly educational records
    } = body;

    if (!name || !dob || !gender || !houseName || !place) {
      return NextResponse.json(
        { error: 'Required fields missing: Name, DOB, Gender, House Name, Place' },
        { status: 400 }
      );
    }

    // Auto-generate Admission No & Family No if not supplied
    const nextAdmissionNo = admissionNo || `ADM-2026-${Math.floor(100 + Math.random() * 900)}`;
    const nextFamilyNo = familyNo || `FAM-${Math.floor(1000 + Math.random() * 9000)}`;

    const student = await db.student.create({
      data: {
        admissionNo: nextAdmissionNo,
        familyNo: nextFamilyNo,
        admissionDate: admissionDate ? new Date(admissionDate) : new Date(),
        name,
        dob: new Date(dob),
        gender,
        nationalId,
        photoKey,
        contact1: contact1 || '',
        contact2,
        whatsapp,
        status: status || 'ACTIVE',
        inactiveReason,
        sponsorId: sponsorId || null,
        sponsorshipStartDate: sponsorshipStartDate ? new Date(sponsorshipStartDate) : null,
        guardianName,
        fatherName,
        motherName,
        houseName,
        place,
        stateId,
        districtId,
        localBodyTypeId,
        localBodyId,
        postOfficeId,
        pinCode,
        mahalluId: mahalluId || null,
        familyCategory,
      },
    });

    // Create educational records lineage if provided
    if (Array.isArray(educationalRecords) && educationalRecords.length > 0) {
      for (const edu of educationalRecords) {
        await db.educationalRecord.create({
          data: {
            studentId: student.id,
            academicYear: edu.academicYear || '2025-2026',
            schoolCategory: edu.schoolCategory || 'UP',
            schoolName: edu.schoolName,
            classDivision: edu.classDivision,
            schoolTeacherName: edu.schoolTeacherName,
            schoolTeacherContact: edu.schoolTeacherContact,
            schoolMarksJson: edu.schoolMarksJson ? JSON.stringify(edu.schoolMarksJson) : null,
            madrasaCategory: edu.madrasaCategory,
            madrasaName: edu.madrasaName,
            madrasaClass: edu.madrasaClass,
            madrasaTeacherName: edu.madrasaTeacherName,
            madrasaTeacherContact: edu.madrasaTeacherContact,
            madrasaMarksJson: edu.madrasaMarksJson ? JSON.stringify(edu.madrasaMarksJson) : null,
          },
        });
      }
    }

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error('Student POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Admission Number already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create student admission' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Student ID required' }, { status: 400 });

    await db.student.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Student DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
