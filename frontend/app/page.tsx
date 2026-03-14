"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

type Spot = {
  id: number;
  name: string;
  category: string | null;
  address: string | null;
  lat: number;
  lng: number;
};

const SpotsMap = dynamic(() => import("../components/SpotsMap"), {
  ssr: false,
});

export default function HomePage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const apiBase =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
        const res = await fetch(`${apiBase}/spots`);
        if (!res.ok) {
          throw new Error(`Failed to fetch spots: ${res.status}`);
        }
        const data = (await res.json()) as Spot[];
        setSpots(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchSpots();
  }, []);

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-xl font-semibold">Landmark Map</h1>
        <p className="text-sm text-slate-400">
          CSV (name,category,lat,long,address) から自動インポートしたスポットを表示します。
        </p>
      </header>
      <div className="flex-1 min-h-0">
        {loading && (
          <div className="flex h-full items-center justify-center text-slate-400">
            読み込み中…
          </div>
        )}
        {error && (
          <div className="flex h-full items-center justify-center text-red-400">
            エラー: {error}
          </div>
        )}
        {!loading && !error && (
          <SpotsMap spots={spots} className="h-full" />
        )}
      </div>
    </main>
  );
}

