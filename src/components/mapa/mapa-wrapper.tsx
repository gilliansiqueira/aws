"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClienteMapa } from "./clientes-map";

// Leaflet acessa `window` na importação — precisa carregar só no browser.
const ClientesMap = dynamic(() => import("./clientes-map").then((m) => m.ClientesMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-2xl" />,
});

export function MapaWrapper({ clientes }: { clientes: ClienteMapa[] }) {
  return <ClientesMap clientes={clientes} />;
}
