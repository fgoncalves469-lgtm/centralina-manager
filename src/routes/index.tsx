import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Remap Garage — ECU tuning manager" },
      { name: "description", content: "Sign in to manage ECU reads, maps, notes and logs." },
      { property: "og:title", content: "Remap Garage — ECU tuning manager" },
      { property: "og:description", content: "Sign in to manage ECU reads, maps, notes and logs." },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
