"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImprimirButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      <Printer size={16} /> Imprimir / Baixar PDF
    </Button>
  );
}
