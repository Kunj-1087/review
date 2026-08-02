import { prisma } from '../src/lib/prisma';

async function verify() {
  console.log('--- DATABASE IMPORT VERIFICATION ---');

  const totalColleges = await prisma.college.count();
  console.log(`Total Colleges in Database: ${totalColleges}`);

  const confirmedCount = await prisma.college.count({ where: { domainConfidence: 'confirmed' } });
  const likelyCount = await prisma.college.count({ where: { domainConfidence: 'likely' } });
  const unconfirmedCount = await prisma.college.count({ where: { domainConfidence: 'unconfirmed' } });
  const noneCount = await prisma.college.count({ where: { domainConfidence: 'none' } });

  console.log('\n--- DOMAIN CONFIDENCE BREAKDOWN ---');
  console.log(`- Confirmed:   ${confirmedCount}`);
  console.log(`- Likely:      ${likelyCount}`);
  console.log(`- Unconfirmed: ${unconfirmedCount}`);
  console.log(`- None:        ${noneCount}`);

  console.log('\n--- SPOT-CHECK KNOWN ENTRIES ---');

  const nirma = await prisma.college.findFirst({ where: { name: 'Nirma University' } });
  console.log('\n1. Nirma University:');
  console.log({
    id: nirma?.id,
    name: nirma?.name,
    city: nirma?.city,
    type: nirma?.type,
    typeDetail: nirma?.typeDetail,
    domainConfidence: nirma?.domainConfidence,
    officialDomains: nirma?.officialDomains,
    formerNames: nirma?.formerNames,
  });

  const gnlu = await prisma.college.findFirst({ where: { name: 'Gujarat National Law University' } });
  console.log('\n2. Gujarat National Law University (GNLU):');
  console.log({
    id: gnlu?.id,
    name: gnlu?.name,
    city: gnlu?.city,
    type: gnlu?.type,
    typeDetail: gnlu?.typeDetail,
    domainConfidence: gnlu?.domainConfidence,
    officialDomains: gnlu?.officialDomains,
  });

  const iitgn = await prisma.college.findFirst({ where: { name: 'Indian Institute of Technology Gandhinagar' } });
  console.log('\n3. IIT Gandhinagar:');
  console.log({
    id: iitgn?.id,
    name: iitgn?.name,
    city: iitgn?.city,
    type: iitgn?.type,
    typeDetail: iitgn?.typeDetail,
    domainConfidence: iitgn?.domainConfidence,
    officialDomains: iitgn?.officialDomains,
  });

  const charusat = await prisma.college.findFirst({ where: { name: { contains: 'Charotar University' } } });
  console.log('\n4. CHARUSAT (Likely domain test):');
  console.log({
    id: charusat?.id,
    name: charusat?.name,
    city: charusat?.city,
    domainConfidence: charusat?.domainConfidence,
    officialDomains: charusat?.officialDomains,
  });

  const ldce = await prisma.college.findFirst({ where: { name: 'L. D. College of Engineering' } });
  console.log('\n5. L. D. College of Engineering (Unconfirmed domain test):');
  console.log({
    id: ldce?.id,
    name: ldce?.name,
    city: ldce?.city,
    domainConfidence: ldce?.domainConfidence,
    officialDomains: ldce?.officialDomains,
  });

  console.log('\n--- VERIFICATION COMPLETE ---');
}

verify()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
