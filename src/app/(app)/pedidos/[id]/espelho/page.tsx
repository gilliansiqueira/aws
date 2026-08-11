import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EspelhoDocumento } from "@/components/pedidos/espelho-documento";
import { EnviarWhatsAppButton } from "@/components/pedidos/enviar-whatsapp-button";
import { ImprimirButton } from "@/components/pedidos/imprimir-button";
import { ButtonLink } from "@/components/ui/button";
import { formatDateTimeBR } from "@/lib/format";
import { DEFAULT_WHATSAPP_MESSAGE_TEMPLATE } from "@/lib/whatsapp";

export default async function EspelhoPedidoPage({
  params,
}: PageProps<"/pedidos/[id]/espelho">) {
  const { id } = await params;

  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: {
      itens: { orderBy: { ordem: "asc" } },
      parcelas: { orderBy: { numero: "asc" } },
      industria: true,
    },
  });

  if (!pedido) notFound();

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href={`/pedidos/${pedido.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft size={15} /> Voltar para o pedido
        </Link>
        {pedido.enviadoWhatsappEm && (
          <p className="text-xs text-muted">
            Enviado para a indústria em {formatDateTimeBR(pedido.enviadoWhatsappEm)}
          </p>
        )}
      </div>

      <EspelhoDocumento pedido={pedido} />

      <div className="no-print mx-auto mt-6 flex max-w-3xl flex-wrap justify-end gap-2">
        <ImprimirButton />
        <ButtonLink href={`/pedidos/${pedido.id}`} variant="secondary">
          Salvar
        </ButtonLink>
        <EnviarWhatsAppButton
          pedidoId={pedido.id}
          numero={pedido.numero}
          clienteNome={pedido.clienteNomeSnapshot}
          industriaWhatsapp={pedido.industriaWhatsappSnapshot}
          mensagemTemplate={pedido.industria.mensagemPadraoEnvio || DEFAULT_WHATSAPP_MESSAGE_TEMPLATE}
          jaEnviado={Boolean(pedido.enviadoWhatsappEm)}
        />
      </div>
    </div>
  );
}
