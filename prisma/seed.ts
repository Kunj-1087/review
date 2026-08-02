import { prisma } from '../src/lib/prisma';
import path from 'path';
import { parseResearchMarkdown, slugify } from '../scripts/parse-colleges';

async function main() {
  console.log('--- Starting Gujarat Colleges Data Import & Seed ---');

  const dataPath = path.join(process.cwd(), 'data/raw/gujarat-colleges-research-2026-08.md');
  const parseResult = parseResearchMarkdown(dataPath);

  console.log(`Parsed ${parseResult.colleges.length} colleges from research document.`);

  // 1. Seed Admin User
  const adminEmail = 'admin@campusvoice.in';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        verificationStatus: 'DOMAIN_VERIFIED',
        role: 'ADMIN',
      },
    });
  }

  let adminProfile = await prisma.anonymousProfile.findUnique({ where: { userId: adminUser.id } });
  if (!adminProfile) {
    adminProfile = await prisma.anonymousProfile.create({
      data: {
        userId: adminUser.id,
        publicHandle: 'Grievance_Officer_Admin',
        batchYear: 2022,
      },
    });
  }

  // Track generated slugs to avoid collision
  const existingSlugs = new Set<string>();
  const dbColleges = await prisma.college.findMany({ select: { slug: true } });
  dbColleges.forEach((c) => existingSlugs.add(c.slug));

  const getUniqueSlug = (name: string, city: string): string => {
    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = slugify(city);
    let candidate = baseSlug;
    let counter = 1;
    while (existingSlugs.has(candidate)) {
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }
    existingSlugs.add(candidate);
    return candidate;
  };

  // 2. Upsert all parsed colleges
  let importedCount = 0;
  for (const col of parseResult.colleges) {
    const existing = await prisma.college.findUnique({
      where: {
        name_city: {
          name: col.name,
          city: col.city,
        },
      },
    });

    const slug = existing ? existing.slug : getUniqueSlug(col.name, col.city);

    await prisma.college.upsert({
      where: {
        name_city: {
          name: col.name,
          city: col.city,
        },
      },
      update: {
        streams: JSON.stringify(col.streams),
        affiliation: col.affiliation,
        officialDomains: JSON.stringify(col.officialDomains),
        domainConfidence: col.domainConfidence,
        type: col.type,
        typeDetail: col.typeDetail,
        establishedYear: col.establishedYear,
        formerNames: col.formerNames.length > 0 ? JSON.stringify(col.formerNames) : null,
        sourceNotes: col.sourceNotes,
      },
      create: {
        name: col.name,
        slug,
        city: col.city,
        streams: JSON.stringify(col.streams),
        affiliation: col.affiliation,
        officialDomains: JSON.stringify(col.officialDomains),
        domainConfidence: col.domainConfidence,
        type: col.type,
        typeDetail: col.typeDetail,
        establishedYear: col.establishedYear,
        formerNames: col.formerNames.length > 0 ? JSON.stringify(col.formerNames) : null,
        sourceNotes: col.sourceNotes,
      },
    });
    importedCount++;
  }

  console.log(`Successfully upserted ${importedCount} colleges into dev database.`);

  // 3. Seed student reviews for Nirma University (if zero reviews exist)
  const nirma = await prisma.college.findFirst({
    where: { name: { contains: 'Nirma' } },
  });

  if (nirma) {
    const existingNirmaReviews = await prisma.review.count({ where: { collegeId: nirma.id } });
    if (existingNirmaReviews === 0) {
      const nirmaReviewsData = [
        {
          handle: 'Sabarmati_Coder_24',
          batch: 2024,
          academics: 4,
          placements: 5,
          infrastructure: 4,
          hostel: 3,
          feesValue: 3,
          facultySupport: 4,
          campusLife: 4,
          safety: 5,
          text: 'Great computer engineering labs and strong campus placements (AWS, Oracle visited). Hostel curfews are a bit strict for 1st years.',
        },
        {
          handle: 'SG_Highway_Dev',
          batch: 2025,
          academics: 5,
          placements: 4,
          infrastructure: 5,
          hostel: 4,
          feesValue: 3,
          facultySupport: 5,
          campusLife: 5,
          safety: 5,
          text: 'Faculty members are very approachable if you engage in research projects. Library infrastructure is top-notch in Gujarat.',
        },
        {
          handle: 'Law_Chai_Debater',
          batch: 2023,
          academics: 4,
          placements: 4,
          infrastructure: 4,
          hostel: 4,
          feesValue: 4,
          facultySupport: 4,
          campusLife: 4,
          safety: 4,
          text: 'Institute of Law under Nirma has excellent moot court competitions and guest lectures by High Court advocates.',
        },
        {
          handle: 'Kankaria_Techie',
          batch: 2026,
          academics: 4,
          placements: 4,
          infrastructure: 5,
          hostel: 3,
          feesValue: 3,
          facultySupport: 4,
          campusLife: 4,
          safety: 5,
          text: 'Festivals like TechFest are energetic. Fees have increased slightly over recent batches, but ROI is solid for IT branch.',
        },
        {
          handle: 'Bhopal_Crossroads_CS',
          batch: 2025,
          academics: 5,
          placements: 5,
          infrastructure: 4,
          hostel: 4,
          feesValue: 4,
          facultySupport: 4,
          campusLife: 4,
          safety: 4,
          text: 'Coding culture is active. Student clubs like IEEE and CodeChef chapter organize monthly hackathons on campus.',
        },
        {
          handle: 'Vastrapur_Geek',
          batch: 2024,
          academics: 4,
          placements: 4,
          infrastructure: 4,
          hostel: 3,
          feesValue: 3,
          facultySupport: 4,
          campusLife: 3,
          safety: 5,
          text: 'Attendance requirement (85%) is strictly monitored. Overall disciplined academic culture.',
        },
      ];

      for (let i = 0; i < nirmaReviewsData.length; i++) {
        const r = nirmaReviewsData[i];
        const studentEmail = `student_nirma_${i + 1}@nirmauni.ac.in`;
        let user = await prisma.user.findUnique({ where: { email: studentEmail } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: studentEmail,
              verificationStatus: 'DOMAIN_VERIFIED',
              verifiedCollegeId: nirma.id,
            },
          });
        }

        let anon = await prisma.anonymousProfile.findUnique({ where: { userId: user.id } });
        if (!anon) {
          anon = await prisma.anonymousProfile.create({
            data: {
              userId: user.id,
              publicHandle: r.handle,
              batchYear: r.batch,
              collegeId: nirma.id,
            },
          });
        }

        await prisma.review.upsert({
          where: {
            anonymousProfileId_collegeId: {
              anonymousProfileId: anon.id,
              collegeId: nirma.id,
            },
          },
          update: {},
          create: {
            anonymousProfileId: anon.id,
            collegeId: nirma.id,
            academics: r.academics,
            placements: r.placements,
            infrastructure: r.infrastructure,
            hostel: r.hostel,
            feesValue: r.feesValue,
            facultySupport: r.facultySupport,
            campusLife: r.campusLife,
            safety: r.safety,
            freeText: r.text,
          },
        });
      }
    }
  }

  // 4. Seed reviews & post for DA-IICT (if zero reviews exist)
  const daiict = await prisma.college.findFirst({
    where: { name: { contains: 'DA-IICT' } },
  });

  if (daiict) {
    const existingDaiictReviews = await prisma.review.count({ where: { collegeId: daiict.id } });
    if (existingDaiictReviews === 0) {
      const daiictReviewsData = [
        {
          handle: 'Infocity_Hacker',
          batch: 2024,
          academics: 5,
          placements: 5,
          infrastructure: 5,
          hostel: 4,
          feesValue: 4,
          facultySupport: 5,
          campusLife: 4,
          safety: 5,
          text: 'Elite ICT curriculum with strong focus on discrete math, distributed systems, and open source contributions.',
        },
        {
          handle: 'Gandhinagar_NightOwl',
          batch: 2025,
          academics: 5,
          placements: 5,
          infrastructure: 4,
          hostel: 4,
          feesValue: 4,
          facultySupport: 4,
          campusLife: 5,
          safety: 5,
          text: 'Campus greenery and 24/7 library access make late-night assignment prep manageable.',
        },
      ];

      for (let i = 0; i < daiictReviewsData.length; i++) {
        const r = daiictReviewsData[i];
        const studentEmail = `student_daiict_${i + 1}@daiict.ac.in`;
        let user = await prisma.user.findUnique({ where: { email: studentEmail } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: studentEmail,
              verificationStatus: 'DOMAIN_VERIFIED',
              verifiedCollegeId: daiict.id,
            },
          });
        }

        let anon = await prisma.anonymousProfile.findUnique({ where: { userId: user.id } });
        if (!anon) {
          anon = await prisma.anonymousProfile.create({
            data: {
              userId: user.id,
              publicHandle: r.handle,
              batchYear: r.batch,
              collegeId: daiict.id,
            },
          });
        }

        await prisma.review.upsert({
          where: {
            anonymousProfileId_collegeId: {
              anonymousProfileId: anon.id,
              collegeId: daiict.id,
            },
          },
          update: {},
          create: {
            anonymousProfileId: anon.id,
            collegeId: daiict.id,
            academics: r.academics,
            placements: r.placements,
            infrastructure: r.infrastructure,
            hostel: r.hostel,
            feesValue: r.feesValue,
            facultySupport: r.facultySupport,
            campusLife: r.campusLife,
            safety: r.safety,
            freeText: r.text,
          },
        });
      }
    }
  }

  console.log('--- Import & Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
