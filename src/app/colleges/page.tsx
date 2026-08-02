import { getCollegesAction } from '@/lib/actions/content';
import CollegeDirectoryClient from '@/components/CollegeDirectoryClient';

export default async function CollegesPage() {
  const colleges = await getCollegesAction();

  // Extract unique cities list sorted alphabetically
  const uniqueCities = Array.from(new Set(colleges.map((c) => c.city))).sort();

  return (
    <CollegeDirectoryClient
      initialColleges={colleges}
      initialCities={uniqueCities}
    />
  );
}
