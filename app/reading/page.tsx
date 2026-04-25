import ReadingExperiencePage from "@/components/ReadingExperiencePage";
import { listCards } from "@/lib/card-store";

export default async function ReadingPage() {
  const cards = await listCards();
  return <ReadingExperiencePage cardCount={cards.length} />;
}
