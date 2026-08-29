"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { formatCNPJ, formatPhone } from "@/lib/format";

// O bundler do Next.js quebra a resolução automática dos ícones padrão do
// Leaflet (caminho relativo embutido no CSS que não existe depois do
// build) — os PNGs foram copiados pra public/leaflet/ e são referenciados
// direto por caminho, sem depender de import de asset do bundler.
const icone = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type ClienteMapa = {
  id: string;
  nome: string;
  cnpj: string | null;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  latitude: number;
  longitude: number;
};

function AjustarBounds({ clientes }: { clientes: ClienteMapa[] }) {
  const map = useMap();
  useEffect(() => {
    if (clientes.length === 0) return;
    if (clientes.length === 1) {
      map.setView([clientes[0].latitude, clientes[0].longitude], 12);
      return;
    }
    const bounds = L.latLngBounds(clientes.map((c) => [c.latitude, c.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes]);
  return null;
}

export function ClientesMap({ clientes }: { clientes: ClienteMapa[] }) {
  const centroPadrao: [number, number] = [-14.235, -51.9253]; // centro aproximado do Brasil

  return (
    <MapContainer
      center={clientes[0] ? [clientes[0].latitude, clientes[0].longitude] : centroPadrao}
      zoom={clientes.length > 0 ? 10 : 4}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AjustarBounds clientes={clientes} />
      {clientes.map((c) => (
        <Marker key={c.id} position={[c.latitude, c.longitude]} icon={icone}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{c.nome}</p>
              {c.cnpj && <p className="text-xs text-gray-600">{formatCNPJ(c.cnpj)}</p>}
              {(c.cidade || c.uf) && (
                <p className="text-xs text-gray-600">{[c.cidade, c.uf].filter(Boolean).join(" / ")}</p>
              )}
              {c.telefone && <p className="text-xs text-gray-600">{formatPhone(c.telefone)}</p>}
              <Link href={`/clientes/${c.id}`} className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline">
                Ver cadastro
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
