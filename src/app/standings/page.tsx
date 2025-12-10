import { redirect } from "next/navigation";

export default function StandingsPage() {
  // Redirect to tournaments - user needs to select a specific tournament
  redirect("/tournaments");
}
