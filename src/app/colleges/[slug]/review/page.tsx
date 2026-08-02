import { getCollegeBySlugAction } from '@/lib/actions/content';
import { getSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import ReviewFormClient from '@/components/ReviewFormClient';

export default async function CollegeReviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const college = await getCollegeBySlugAction(slug);
  if (!college) notFound();

  const session = await getSession();

  // Find existing review by current anonymous profile if present
  const existingReview = session
    ? college.reviews.find((r) => r.anonymousProfile.id === session.anonymousProfileId)
    : null;

  return (
    <div className="py-6">
      <ReviewFormClient
        college={{ id: college.id, name: college.name, slug: college.slug, city: college.city }}
        session={session}
        existingReview={existingReview}
      />
    </div>
  );
}
