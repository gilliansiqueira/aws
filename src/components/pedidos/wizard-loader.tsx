"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PedidoWizard } from "./wizard";
import type { WizardCatalogs, WizardInitialData } from "./types";

const SESSION_KEY = "pedido_import_foto";

// Pedido criado a partir de foto chega aqui via sessionStorage (setado pela
// tela /pedidos/importar-foto) em vez de vir do servidor — só existe no
// client, por isso essa ponte fica num Client Component separado.
export function PedidoWizardLoader({
  catalogos,
  initialFromServer,
}: {
  catalogos: WizardCatalogs;
  initialFromServer?: WizardInitialData;
}) {
  const searchParams = useSearchParams();
  const fromFoto = searchParams.get("fromFoto") === "1";
  const [initial, setInitial] = useState<WizardInitialData | undefined>(
    fromFoto ? undefined : initialFromServer,
  );
  const [pronto, setPronto] = useState(!fromFoto);

  useEffect(() => {
    if (!fromFoto) return;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage só existe no client, não dá pra ler antes de montar
        setInitial(JSON.parse(raw));
      }
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignora — usuário cai no wizard em branco, sem quebrar a tela
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPronto(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!pronto) return null;

  return <PedidoWizard catalogos={catalogos} initial={initial} />;
}
