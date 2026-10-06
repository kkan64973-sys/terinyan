import { createFileRoute } from "@tanstack/react-router";
import { TerinyanApp } from "@/components/game/screens";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <TerinyanApp />;
}
