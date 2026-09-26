"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api-config";

type Ad = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  priority: number;
  isActive: boolean;
};

export default function AdCarousel() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    async function fetchAds() {
      try {
        const res = await fetch(apiUrl("/api/advertisements"));
        if (res.ok) {
          const data = await res.json();
          // Filter out inactive just in case, sort by priority
          const activeAds = data
            .filter((ad: Ad) => ad.isActive)
            .sort((a: Ad, b: Ad) => b.priority - a.priority);
          setAds(activeAds);
        }
      } catch (error) {
        console.error("Failed to fetch ads", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === ads.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [ads.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;

    // Swipe left
    if (diff > 50) {
      setCurrentIndex((prev) => (prev === ads.length - 1 ? 0 : prev + 1));
    }
    // Swipe right
    else if (diff < -50) {
      setCurrentIndex((prev) => (prev === 0 ? ads.length - 1 : prev - 1));
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  if (loading) {
    return (
      <div className="h-36 web:h-44 w-full rounded-2xl bg-neutral-100 animate-pulse"></div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl group">
      <div
        className="flex transition-transform duration-500 ease-out h-36 web:h-44"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {ads.map((ad) => (
          <div key={ad.id} className="w-full h-full flex-shrink-0 relative">
            {ad.linkUrl ? (
              <Link href={ad.linkUrl} className="block w-full h-full relative">
                <AdCardContent ad={ad} />
              </Link>
            ) : (
              <AdCardContent ad={ad} />
            )}
          </div>
        ))}
      </div>

      {ads.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? "bg-emerald-500" : "bg-white/50"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AdCardContent({ ad }: { ad: Ad }) {
  return (
    <>
      {ad.imageUrl ? (
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-emerald-700"></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 p-4 w-full">
        <h3 className="text-white font-bold text-lg leading-tight mb-1">
          {ad.title}
        </h3>
        {ad.description && (
          <p className="text-white/90 text-sm line-clamp-2">
            {ad.description}
          </p>
        )}
      </div>
    </>
  );
}
