import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Yatheem Care database seeding...');

  // Clean existing tables in correct order
  await prisma.documentLockerItem.deleteMany({});
  await prisma.markListSubmission.deleteMany({});
  await prisma.reimbursementRequest.deleteMany({});
  await prisma.voucher.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.sponsorSlabAllocation.deleteMany({});
  await prisma.educationalRecord.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.sponsor.deleteMany({});
  await prisma.sponsorshipSlab.deleteMany({});
  await prisma.mahallu.deleteMany({});
  await prisma.postOffice.deleteMany({});
  await prisma.localBody.deleteMany({});
  await prisma.localBodyType.deleteMany({});
  await prisma.district.deleteMany({});
  await prisma.state.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Default Administrative Users
  const defaultPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@yatheemcare.org',
      passwordHash: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
      phone: '+91 9876543210',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@yatheemcare.org',
      passwordHash: defaultPassword,
      name: 'Office Staff Officer',
      role: 'OFFICE_STAFF',
      phone: '+91 9876543211',
    },
  });

  const sponsorUser = await prisma.user.create({
    data: {
      email: 'sponsor@yatheemcare.org',
      passwordHash: defaultPassword,
      name: 'Muhammed Ali',
      role: 'SPONSOR',
      phone: '+91 9876543212',
    },
  });

  const familyUser = await prisma.user.create({
    data: {
      email: 'family@yatheemcare.org',
      passwordHash: defaultPassword,
      name: 'Rahman Family Guardian',
      role: 'STUDENT_FAMILY',
      phone: '+91 9876543213',
    },
  });

  console.log('✓ Created system users with JWT RBAC roles');

  // 2. Cascading Administrative Location Master Data
  const kerala = await prisma.state.create({ data: { name: 'Kerala' } });
  const tamilNadu = await prisma.state.create({ data: { name: 'Tamil Nadu' } });
  const karnataka = await prisma.state.create({ data: { name: 'Karnataka' } });
  const lakshadweep = await prisma.state.create({ data: { name: 'Lakshadweep' } });
  const outOfState = await prisma.state.create({ data: { name: 'Other (Out of State)' } });

  // 14 Districts of Kerala
  const malappuram = await prisma.district.create({ data: { name: 'Malappuram', stateId: kerala.id } });
  const kozhikode = await prisma.district.create({ data: { name: 'Kozhikode', stateId: kerala.id } });
  const wayanad = await prisma.district.create({ data: { name: 'Wayanad', stateId: kerala.id } });
  const kannur = await prisma.district.create({ data: { name: 'Kannur', stateId: kerala.id } });
  const kasaragod = await prisma.district.create({ data: { name: 'Kasaragod', stateId: kerala.id } });
  const palakkad = await prisma.district.create({ data: { name: 'Palakkad', stateId: kerala.id } });
  const thrissur = await prisma.district.create({ data: { name: 'Thrissur', stateId: kerala.id } });
  const ernakulam = await prisma.district.create({ data: { name: 'Ernakulam', stateId: kerala.id } });
  const idukki = await prisma.district.create({ data: { name: 'Idukki', stateId: kerala.id } });
  const kottayam = await prisma.district.create({ data: { name: 'Kottayam', stateId: kerala.id } });
  const alappuzha = await prisma.district.create({ data: { name: 'Alappuzha', stateId: kerala.id } });
  const pathanamthitta = await prisma.district.create({ data: { name: 'Pathanamthitta', stateId: kerala.id } });
  const kollam = await prisma.district.create({ data: { name: 'Kollam', stateId: kerala.id } });
  const thiruvananthapuram = await prisma.district.create({ data: { name: 'Thiruvananthapuram', stateId: kerala.id } });

  // Out of State Districts
  const nilgiris = await prisma.district.create({ data: { name: 'Nilgiris', stateId: tamilNadu.id } });
  const coimbatore = await prisma.district.create({ data: { name: 'Coimbatore', stateId: tamilNadu.id } });
  const kanyakumari = await prisma.district.create({ data: { name: 'Kanyakumari', stateId: tamilNadu.id } });
  const dakshinaKannada = await prisma.district.create({ data: { name: 'Dakshina Kannada (Mangalore)', stateId: karnataka.id } });
  const kodagu = await prisma.district.create({ data: { name: 'Kodagu (Coorg)', stateId: karnataka.id } });
  const mysuru = await prisma.district.create({ data: { name: 'Mysuru', stateId: karnataka.id } });
  const kavaratti = await prisma.district.create({ data: { name: 'Kavaratti / Lakshadweep Islands', stateId: lakshadweep.id } });
  const otherDistrict = await prisma.district.create({ data: { name: 'Other Out-of-State District', stateId: outOfState.id } });


  const corpType = await prisma.localBodyType.create({ data: { name: 'Municipal Corporation' } });
  const munType = await prisma.localBodyType.create({ data: { name: 'Municipality' } });
  const gpType = await prisma.localBodyType.create({ data: { name: 'Grama Panchayat' } });

  const malappuramMun = await prisma.localBody.create({
    data: { name: 'Malappuram Municipality', districtId: malappuram.id, localBodyTypeId: munType.id },
  });
  const manjeriMun = await prisma.localBody.create({
    data: { name: 'Manjeri Municipality', districtId: malappuram.id, localBodyTypeId: munType.id },
  });
  const tirurMun = await prisma.localBody.create({
    data: { name: 'Tirur Municipality', districtId: malappuram.id, localBodyTypeId: munType.id },
  });
  const kondottyGp = await prisma.localBody.create({
    data: { name: 'Kondotty Grama Panchayat', districtId: malappuram.id, localBodyTypeId: gpType.id },
  });

  const kozhikodeCorp = await prisma.localBody.create({
    data: { name: 'Kozhikode Corporation', districtId: kozhikode.id, localBodyTypeId: corpType.id },
  });
  const koduvallyGp = await prisma.localBody.create({
    data: { name: 'Koduvally Grama Panchayat', districtId: kozhikode.id, localBodyTypeId: gpType.id },
  });
  const kunnamangalamGp = await prisma.localBody.create({
    data: { name: 'Kunnamangalam Grama Panchayat', districtId: kozhikode.id, localBodyTypeId: gpType.id },
  });
  const balusseryGp = await prisma.localBody.create({
    data: { name: 'Balussery Grama Panchayat', districtId: kozhikode.id, localBodyTypeId: gpType.id },
  });
  const ramanattukaraMun = await prisma.localBody.create({
    data: { name: 'Ramanattukara Municipality', districtId: kozhikode.id, localBodyTypeId: munType.id },
  });

  const kalpettaMun = await prisma.localBody.create({
    data: { name: 'Kalpetta Municipality', districtId: wayanad.id, localBodyTypeId: munType.id },
  });
  const vythiriGp = await prisma.localBody.create({
    data: { name: 'Vythiri Grama Panchayat', districtId: wayanad.id, localBodyTypeId: gpType.id },
  });

  const po1 = await prisma.postOffice.create({
    data: { name: 'Malappuram HO', pinCode: '676505', districtId: malappuram.id, localBodyId: malappuramMun.id },
  });
  const po2 = await prisma.postOffice.create({
    data: { name: 'Manjeri HO', pinCode: '676121', districtId: malappuram.id, localBodyId: manjeriMun.id },
  });
  const po3 = await prisma.postOffice.create({
    data: { name: 'Tirur HO', pinCode: '676101', districtId: malappuram.id, localBodyId: tirurMun.id },
  });
  const po4 = await prisma.postOffice.create({
    data: { name: 'Koduvally SO', pinCode: '673661', districtId: kozhikode.id, localBodyId: koduvallyGp.id },
  });
  const po5 = await prisma.postOffice.create({
    data: { name: 'Kunnamangalam SO', pinCode: '673571', districtId: kozhikode.id, localBodyId: kunnamangalamGp.id },
  });
  const po6 = await prisma.postOffice.create({
    data: { name: 'Kozhikode HO', pinCode: '673001', districtId: kozhikode.id, localBodyId: kozhikodeCorp.id },
  });
  const po7 = await prisma.postOffice.create({
    data: { name: 'Kalpetta SO', pinCode: '673121', districtId: wayanad.id, localBodyId: kalpettaMun.id },
  });

  console.log('✓ Created cascading administrative location master');

  // 3. Mahallu Master
  const mahallu1 = await prisma.mahallu.create({
    data: { name: 'Malappuram Town Juma Masjid Mahallu', districtId: malappuram.id, place: 'Town Hall Road' },
  });
  const mahallu2 = await prisma.mahallu.create({
    data: { name: 'Manjeri Central Mahallu', districtId: malappuram.id, place: 'Kacheri Padi' },
  });
  const mahallu3 = await prisma.mahallu.create({
    data: { name: 'Tirur Station Mahallu', districtId: malappuram.id, place: 'Station Road' },
  });

  console.log('✓ Created Mahallu Master data');

  // 4. Sponsorship Slab Master
  const slabFixed50k = await prisma.sponsorshipSlab.create({
    data: { name: 'Grand Fixed Sponsorship Slab', amount: 50000, description: 'Fixed ₹50,000/year comprehensive orphan support' },
  });
  const slabEducation = await prisma.sponsorshipSlab.create({
    data: { name: 'Full Education & Tuition Slab', amount: 15000, description: 'Covers school fees, textbooks, uniforms, and madrasa affairs (yearly)' },
  });
  const slabFood = await prisma.sponsorshipSlab.create({
    data: { name: 'Food & Perunnal Kit Slab', amount: 10000, description: 'Covers meat exp, monthly kit exp, and nutritional care (yearly)' },
  });
  const slabMedical = await prisma.sponsorshipSlab.create({
    data: { name: 'Medical & Healthcare Slab', amount: 5000, description: 'Medical expenses and emergency healthcare support (yearly)' },
  });

  console.log('✓ Created Sponsorship Slabs');

  // 5. Sponsors Master
  const sponsor1 = await prisma.sponsor.create({
    data: {
      sponsorId: 'SP-2026-001',
      name: 'Muhammed Ali',
      gender: 'Male',
      isAnonymous: false,
      contact1: '+91 9876543212',
      whatsapp: '+91 9876543212',
      houseName: 'Baitul Aman',
      place: 'Malappuram',
      stateId: kerala.id,
      districtId: malappuram.id,
      localBodyTypeId: munType.id,
      localBodyId: malappuramMun.id,
      postOfficeId: po1.id,
      pinCode: '676505',
    },
  });

  const sponsor2 = await prisma.sponsor.create({
    data: {
      sponsorId: 'SP-2026-002',
      name: 'Hassan Bin Abdulla (Anonymous Donor)',
      gender: 'Male',
      isAnonymous: true, // Anonymous flag set to TRUE!
      contact1: '+91 9811122233',
      whatsapp: '+91 9811122233',
      houseName: 'Privy Residence',
      place: 'Dubai / Malappuram',
      stateId: kerala.id,
      districtId: malappuram.id,
      localBodyTypeId: munType.id,
      localBodyId: manjeriMun.id,
      postOfficeId: po2.id,
      pinCode: '676121',
    },
  });

  console.log('✓ Created Sponsors (including Anonymous donor setup)');

  // 6. Students
  const student1 = await prisma.student.create({
    data: {
      admissionNo: 'ADM-2026-001',
      familyNo: 'FAM-1001',
      name: 'Ameen Rahman',
      dob: new Date('2014-05-15'),
      gender: 'Male',
      contact1: '+91 9876543213',
      whatsapp: '+91 9876543213',
      status: 'ACTIVE',
      sponsorId: sponsor1.id,
      sponsorshipStartDate: new Date('2024-01-01'),
      guardianName: 'Aisha Rahman (Mother)',
      fatherName: 'Late Abdul Rahman',
      motherName: 'Aisha Rahman',
      houseName: 'Rahman Manzil',
      place: 'Down Hill',
      stateId: kerala.id,
      districtId: malappuram.id,
      localBodyTypeId: munType.id,
      localBodyId: malappuramMun.id,
      postOfficeId: po1.id,
      pinCode: '676505',
      mahalluId: mahallu1.id,
      familyCategory: 'Yatheem / BPL',
      photoKey: 'students/photos/sample_student1.jpg',
    },
  });

  const student2 = await prisma.student.create({
    data: {
      admissionNo: 'ADM-2026-002',
      familyNo: 'FAM-1002',
      name: 'Fatima Suhra',
      dob: new Date('2015-08-20'),
      gender: 'Female',
      contact1: '+91 9447123456',
      whatsapp: '+91 9447123456',
      status: 'ACTIVE',
      sponsorId: sponsor2.id, // Anonymous Sponsor
      sponsorshipStartDate: new Date('2024-06-01'),
      guardianName: 'Zubaida Beevi (Grandmother)',
      fatherName: 'Late Siddique',
      motherName: 'Halima',
      houseName: 'Rose Villa',
      place: 'Kacheri Padi',
      stateId: kerala.id,
      districtId: malappuram.id,
      localBodyTypeId: munType.id,
      localBodyId: manjeriMun.id,
      postOfficeId: po2.id,
      pinCode: '676121',
      mahalluId: mahallu2.id,
      familyCategory: 'Yatheem / Orphan',
      photoKey: 'students/photos/sample_student2.jpg',
    },
  });

  const student3 = await prisma.student.create({
    data: {
      admissionNo: 'ADM-2026-003',
      familyNo: 'FAM-1003',
      name: 'Yaseen Ahmed',
      dob: new Date('2013-11-10'),
      gender: 'Male',
      contact1: '+91 9846001122',
      status: 'INACTIVE',
      inactiveReason: 'ഉപരിപഠനത്തിനായി കുടുംബത്തോടൊപ്പം സ്ഥലം മാറി പോയി (Relocated for higher education)',
      guardianName: 'Khadija (Mother)',
      fatherName: 'Late Usman',
      motherName: 'Khadija',
      houseName: 'Al Huda',
      place: 'Tirur Town',
      stateId: kerala.id,
      districtId: malappuram.id,
      localBodyTypeId: munType.id,
      localBodyId: tirurMun.id,
      postOfficeId: po3.id,
      pinCode: '676101',
      mahalluId: mahallu3.id,
      familyCategory: 'Poor',
    },
  });

  console.log('✓ Created Students');

  // 7. Educational Multi-Year Lineage
  await prisma.educationalRecord.create({
    data: {
      studentId: student1.id,
      academicYear: '2024-2025',
      schoolCategory: 'UP',
      schoolName: 'MSP Higher Secondary School, Malappuram',
      classDivision: '6-B',
      schoolTeacherName: 'Unnikrishnan Master',
      schoolTeacherContact: '+91 9400112233',
      schoolMarksJson: JSON.stringify({ Mathematics: '92%', Science: '88%', English: '90%', Malayalam: '95%' }),
      madrasaCategory: 'EK',
      madrasaName: 'Hayathul Islam Madrasa, Down Hill',
      madrasaClass: '6',
      madrasaTeacherName: 'Usthad Hamza',
      madrasaTeacherContact: '+91 9847000111',
      madrasaMarksJson: JSON.stringify({ Fiqh: '96%', Quran: '98%', Akhlaq: '94%' }),
    },
  });

  await prisma.educationalRecord.create({
    data: {
      studentId: student1.id,
      academicYear: '2025-2026',
      schoolCategory: 'UP',
      schoolName: 'MSP Higher Secondary School, Malappuram',
      classDivision: '7-A',
      schoolTeacherName: 'Sujatha Teacher',
      schoolTeacherContact: '+91 9400112244',
      schoolMarksJson: JSON.stringify({ Mathematics: '95%', Science: '91%', English: '94%', Malayalam: '98%' }),
      madrasaCategory: 'EK',
      madrasaName: 'Hayathul Islam Madrasa, Down Hill',
      madrasaClass: '7',
      madrasaTeacherName: 'Usthad Hamza',
      madrasaTeacherContact: '+91 9847000111',
      madrasaMarksJson: JSON.stringify({ Fiqh: '99%', Quran: '100%', Akhlaq: '96%' }),
    },
  });

  console.log('✓ Created multi-year educational lineage history');

  // 8. Slab Allocations
  await prisma.sponsorSlabAllocation.create({
    data: {
      sponsorId: sponsor1.id,
      studentId: student1.id,
      slabId: slabEducation.id,
      customAmount: 15000,
    },
  });

  await prisma.sponsorSlabAllocation.create({
    data: {
      sponsorId: sponsor2.id,
      studentId: student2.id,
      slabId: slabFood.id,
      customAmount: 10000,
    },
  });

  console.log('✓ Created Sponsor-Student slab mappings');

  // 9. Attendance Log Entries
  await prisma.attendance.createMany({
    data: [
      {
        studentId: student1.id,
        familyNo: student1.familyNo,
        admissionNo: student1.admissionNo,
        date: new Date('2026-08-01'),
        status: 'PRESENT',
        mode: 'QR',
      },
      {
        studentId: student1.id,
        familyNo: student1.familyNo,
        admissionNo: student1.admissionNo,
        date: new Date('2026-08-02'),
        status: 'PRESENT',
        mode: 'MANUAL',
      },
      {
        studentId: student2.id,
        familyNo: student2.familyNo,
        admissionNo: student2.admissionNo,
        date: new Date('2026-08-02'),
        status: 'LEAVE',
        leaveReason: 'Medical checkup and family leave',
        mode: 'MANUAL',
      },
    ],
  });

  console.log('✓ Created attendance tracking entries (QR & Manual)');

  // 10. Multi-Ledger Vouchers & Receipts
  await prisma.voucher.createMany({
    data: [
      {
        voucherNo: 'VCH-2026-001',
        date: new Date('2026-08-01'),
        amount: 3500,
        type: 'STUDENT_EXPENSE',
        heading: 'School & madrasa kit',
        paymentMode: 'Cash',
        studentId: student1.id,
        familyNo: student1.familyNo,
        studentName: student1.name,
        sponsorName: sponsor1.name,
        description: 'New academic textbooks, school bag, and notebook sets',
        createdBy: admin.name,
      },
      {
        voucherNo: 'VCH-2026-002',
        date: new Date('2026-08-03'),
        amount: 1800,
        type: 'STUDENT_EXPENSE',
        heading: 'Dress exp',
        paymentMode: 'Bank Transfer',
        studentId: student1.id,
        familyNo: student1.familyNo,
        studentName: student1.name,
        sponsorName: sponsor1.name,
        description: 'School uniform set stitching and shoes',
        createdBy: staff.name,
      },
      {
        voucherNo: 'VCH-2026-003',
        date: new Date('2026-08-05'),
        amount: 25000,
        type: 'YATHEEM_COMMON',
        heading: 'Salary of section employees',
        paymentMode: 'Bank Transfer',
        description: 'Monthly honorarium for student warden and section staff',
        createdBy: admin.name,
      },
      {
        voucherNo: 'VCH-2026-004',
        date: new Date('2026-08-07'),
        amount: 4200,
        type: 'YATHEEM_COMMON',
        heading: 'TA & DA for trainers',
        paymentMode: 'UPI',
        description: 'Travel allowance for monthly career guidance camp trainers',
        createdBy: staff.name,
      },
    ],
  });

  console.log('✓ Created multi-ledger student and institutional common vouchers');

  // 11. Utility Portal Items (Reimbursements, DigiLocker, Marklist uploads)
  await prisma.reimbursementRequest.create({
    data: {
      studentId: student1.id,
      amount: 750,
      heading: 'Medical exp',
      description: 'Prescription medicines for seasonal fever purchased at City Pharmacy',
      status: 'PENDING',
      documentKeysJson: JSON.stringify(['reimbursements/receipt_001.jpg']),
    },
  });

  await prisma.markListSubmission.create({
    data: {
      studentId: student1.id,
      academicYear: '2025-2026',
      term: 'First Term',
      fileKey: 'marksheets/2026/marklist_student1.pdf',
      status: 'VERIFIED',
      reviewedBy: staff.name,
      reviewNote: 'Verified and approved with distinction marks.',
    },
  });

  await prisma.documentLockerItem.createMany({
    data: [
      {
        studentId: student1.id,
        title: 'Aadhaar Card Copy',
        category: 'Aadhaar',
        fileKey: 'locker/student1/aadhaar.pdf',
      },
      {
        studentId: student1.id,
        title: 'Birth Certificate',
        category: 'Birth Certificate',
        fileKey: 'locker/student1/birth_certificate.pdf',
      },
    ],
  });

  console.log('✓ Seeded utility portal data');
  console.log('✅ Yatheem Care database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
