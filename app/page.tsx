import HomeClient from "@/components/home/HomeClient";
import { getFeaturedItems, getFeed, getProgramCounts, getPrograms, getPublications, getUpcomingEvents } from "@/lib/queries";

export default async function HomePage() {
  const [featured, feedResult, programs, upcoming, publications, counts] = await Promise.all([
    getFeaturedItems(5),
    getFeed({ limit: 60 }),
    getPrograms(),
    getUpcomingEvents(3),
    getPublications(4),
    getProgramCounts(),
  ]);

  return (
    <HomeClient
      featured={featured}
      feed={feedResult.items}
      programs={programs}
      upcoming={upcoming}
      publications={publications}
      counts={counts}
    />
  );
}
