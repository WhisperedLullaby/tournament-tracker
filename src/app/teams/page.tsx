import { redirect } from "next/navigation";

export default function TeamsPage() {
  // Redirect to tournaments - user needs to select a specific tournament
  redirect("/tournaments");
}
