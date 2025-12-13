import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to tournaments list
  redirect("/tournaments");
}
