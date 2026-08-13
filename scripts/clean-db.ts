import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting database cleanup (removing dummy/test data)...');

  // Deleting transactional and student/sponsor data
  console.log('- Cleaning Document Locker Items...');
  await prisma.documentLockerItem.deleteMany({});

  console.log('- Cleaning Mark List Submissions...');
  await prisma.markListSubmission.deleteMany({});

  console.log('- Cleaning Reimbursement Requests...');
  await prisma.reimbursementRequest.deleteMany({});

  console.log('- Cleaning Vouchers...');
  await prisma.voucher.deleteMany({});

  console.log('- Cleaning Attendance Logs...');
  await prisma.attendance.deleteMany({});

  console.log('- Cleaning Sponsor Slab Allocations...');
  await prisma.sponsorSlabAllocation.deleteMany({});

  console.log('- Cleaning Educational Records...');
  await prisma.educationalRecord.deleteMany({});

  console.log('- Cleaning Students...');
  await prisma.student.deleteMany({});

  console.log('- Cleaning Sponsors...');
  await prisma.sponsor.deleteMany({});

  // Note: We keep State, District, LocalBody, LocalBodyType, PostOffice, Mahallu, 
  // and the administrative Users so you can log in and select locations immediately.

  console.log('✅ Database successfully cleaned of all dummy students, sponsors, attendance logs, and vouchers!');
}

main()
  .catch((e) => {
    console.error('Error cleaning database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
