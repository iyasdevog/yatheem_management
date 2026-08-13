import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'dashboard';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const dateFilter: any = {};
    if (startDateParam || endDateParam) {
      dateFilter.date = {};
      if (startDateParam) dateFilter.date.gte = new Date(startDateParam);
      if (endDateParam) dateFilter.date.lte = new Date(endDateParam);
    }

    // 1. Dashboard Overview Metrics
    if (reportType === 'dashboard') {
      const totalStudents = await db.student.count();
      const activeStudents = await db.student.count({ where: { status: 'ACTIVE' } });
      const inactiveStudents = await db.student.count({ where: { status: 'INACTIVE' } });

      const totalSponsors = await db.sponsor.count();
      const anonymousSponsors = await db.sponsor.count({ where: { isAnonymous: true } });

      const totalSlabs = await db.sponsorshipSlab.count();
      const totalAllocations = await db.sponsorSlabAllocation.count();

      const studentVouchersSum = await db.voucher.aggregate({
        where: { type: 'STUDENT_EXPENSE' },
        _sum: { amount: true },
      });

      const commonVouchersSum = await db.voucher.aggregate({
        where: { type: 'YATHEEM_COMMON' },
        _sum: { amount: true },
      });

      const totalExpense = (studentVouchersSum._sum.amount || 0) + (commonVouchersSum._sum.amount || 0);

      // Aggregate revenue from slab allocations
      const slabAllocations = await db.sponsorSlabAllocation.findMany({
        include: { slab: true },
      });
      const projectedRevenue = slabAllocations.reduce((acc, curr) => {
        const amt = curr.customAmount || (curr.slab ? curr.slab.amount : 0);
        return acc + amt;
      }, 0);

      return NextResponse.json({
        totalStudents,
        activeStudents,
        inactiveStudents,
        totalSponsors,
        anonymousSponsors,
        totalSlabs,
        totalAllocations,
        totalExpense,
        projectedRevenue,
        studentExpenseTotal: studentVouchersSum._sum.amount || 0,
        commonExpenseTotal: commonVouchersSum._sum.amount || 0,
      });
    }

    // 2. Student & Family Expense Breakdown Report
    if (reportType === 'studentExpenses') {
      const vouchers = await db.voucher.findMany({
        where: { type: 'STUDENT_EXPENSE' },
        include: {
          student: {
            select: { id: true, name: true, admissionNo: true, familyNo: true, status: true },
          },
        },
        orderBy: { date: 'desc' },
      });

      const headingBreakdown = vouchers.reduce((acc: any, v) => {
        acc[v.heading] = (acc[v.heading] || 0) + v.amount;
        return acc;
      }, {});

      return NextResponse.json({ vouchers, headingBreakdown });
    }

    // 3. Sponsor Execution Report
    if (reportType === 'sponsorReport') {
      const sponsors = await db.sponsor.findMany({
        include: {
          students: {
            include: {
              vouchers: { 
                where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
                orderBy: { date: 'desc' } 
              },
            },
          },
          vouchers: {
            where: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
            orderBy: { date: 'desc' }
          },
          slabAllocations: { include: { slab: true } },
        },
      });

      const reports = sponsors.map((s) => {
        let totalExecutionExpense = 0;
        s.students.forEach((std) => {
          std.vouchers.forEach((vch) => {
            totalExecutionExpense += vch.amount;
          });
        });

        let totalDonations = 0;
        s.vouchers.forEach((vch) => {
          totalDonations += vch.amount;
        });

        return {
          id: s.id,
          sponsorId: s.sponsorId,
          name: s.isAnonymous ? 'Well-wisher (Anonymous)' : s.name,
          realName: s.name,
          isAnonymous: s.isAnonymous,
          contact: s.contact1,
          studentsCount: s.students.length,
          mappedStudents: s.students.map((std) => ({
            id: std.id,
            name: std.name,
            admissionNo: std.admissionNo,
            familyNo: std.familyNo,
            vouchers: std.vouchers,
          })),
          donations: s.vouchers,
          totalExecutionExpense,
          totalDonations,
        };
      });

      return NextResponse.json(reports);
    }

    // 4. Attendance Summary Report
    if (reportType === 'attendanceReport') {
      const records = await db.attendance.findMany({
        include: { student: { select: { name: true, admissionNo: true, familyNo: true } } },
        orderBy: { date: 'desc' },
      });

      const summary = {
        present: records.filter((r) => r.status === 'PRESENT').length,
        absent: records.filter((r) => r.status === 'ABSENT').length,
        leave: records.filter((r) => r.status === 'LEAVE').length,
        total: records.length,
      };

      return NextResponse.json({ records, summary });
    }

    return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
