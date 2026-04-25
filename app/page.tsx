import { listCards } from "@/lib/card-store";
import TechTarotApp from "@/components/TechTarotApp";

export default async function Home() {
  const cards = await listCards();
  return <TechTarotApp initialCards={cards} />;
}
