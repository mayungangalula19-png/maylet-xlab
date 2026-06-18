import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PrototypeScreenshot, ScreenshotCategory } from '../types/prototype.types';
import { SCREENSHOT_CATEGORIES } from '../types/prototype.types';

interface Props {
  screenshots: PrototypeScreenshot[];
  prototypeName?: string;
  editable?: boolean;
  onSetHero?: (id: string) => void;
}

const CATEGORY_COLORS: Record<ScreenshotCategory, string> = {
  ui: '#2fd4ff',
  workflow: '#9b7ff0',
  architecture: '#f6c90e',
  analytics: '#48bb78',
  other: '#a0aec0',
};

function categoryLabel(id: ScreenshotCategory): string {
  return SCREENSHOT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function PrototypeImageGallery({
  screenshots,
  prototypeName,
  editable,
  onSetHero,
}: Props) {
  const sorted = useMemo(() => {
    const hero = screenshots.find((s) => s.isHero);
    const rest = screenshots.filter((s) => !s.isHero);
    return hero ? [hero, ...rest] : screenshots;
  }, [screenshots]);

  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!activeId && sorted[0]) setActiveId(sorted[0].id);
    if (activeId && !sorted.some((s) => s.id === activeId)) {
      setActiveId(sorted[0]?.id ?? null);
    }
  }, [sorted, activeId]);

  const active = sorted.find((s) => s.id === activeId) ?? sorted[0] ?? null;

  const openLightbox = useCallback((id: string) => {
    setActiveId(id);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const stepLightbox = useCallback(
    (dir: -1 | 1) => {
      if (!active || sorted.length < 2) return;
      const idx = sorted.findIndex((s) => s.id === active.id);
      const next = sorted[(idx + dir + sorted.length) % sorted.length];
      setActiveId(next.id);
    },
    [active, sorted]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') stepLightbox(-1);
      if (e.key === 'ArrowRight') stepLightbox(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, closeLightbox, stepLightbox]);

  if (screenshots.length === 0) {
    return (
      <div className="proto-gallery proto-gallery--empty">
        <div className="proto-gallery__empty-icon" aria-hidden>
          🖼️
        </div>
        <h3>Visual proof gallery</h3>
        <p>Upload UI screenshots, workflow diagrams, or architecture visuals to showcase your prototype.</p>
      </div>
    );
  }

  return (
    <section className="proto-gallery" aria-label="Prototype image gallery">
      {active ? (
        <div className="proto-gallery__hero">
          <button
            type="button"
            className="proto-gallery__hero-frame"
            onClick={() => openLightbox(active.id)}
            aria-label={`View fullscreen: ${active.title}`}
          >
            <img
              src={active.url}
              alt={active.title}
              className="proto-gallery__hero-img"
              loading="eager"
              decoding="async"
            />
            <span className="proto-gallery__zoom-hint">Click to zoom</span>
          </button>
          <div className="proto-gallery__hero-meta">
            <div className="proto-gallery__hero-top">
              <span
                className="proto-gallery__tag"
                style={{ borderColor: CATEGORY_COLORS[active.category], color: CATEGORY_COLORS[active.category] }}
              >
                {categoryLabel(active.category)}
              </span>
              {active.isHero ? <span className="proto-gallery__hero-badge">Hero</span> : null}
            </div>
            <h3>{active.title}</h3>
            {prototypeName ? <p className="proto-gallery__proto-name">{prototypeName}</p> : null}
            {active.purpose ? (
              <p className="proto-gallery__caption">
                <strong>Purpose:</strong> {active.purpose}
              </p>
            ) : null}
            {editable && onSetHero && !active.isHero ? (
              <button
                type="button"
                className="proto-btn proto-btn--ghost proto-gallery__set-hero"
                onClick={() => onSetHero(active.id)}
              >
                Set as hero image
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {sorted.length > 1 ? (
        <div className="proto-gallery__thumbs" role="list" aria-label="Screenshot thumbnails">
          {sorted.map((shot) => (
            <button
              key={shot.id}
              type="button"
              role="listitem"
              className={`proto-gallery__thumb ${shot.id === active?.id ? 'proto-gallery__thumb--active' : ''}`}
              onClick={() => setActiveId(shot.id)}
              onDoubleClick={() => openLightbox(shot.id)}
              aria-label={shot.title}
              aria-current={shot.id === active?.id}
            >
              <img src={shot.url} alt="" loading="lazy" decoding="async" />
              <span className="proto-gallery__thumb-label">{shot.title}</span>
            </button>
          ))}
        </div>
      ) : null}

      {active && (active.uxDescription || active.functionality || active.userValue) ? (
        <div className="proto-gallery__details">
          {active.uxDescription ? (
            <div className="proto-gallery__detail-block">
              <h4>UX Description</h4>
              <p>{active.uxDescription}</p>
            </div>
          ) : null}
          {active.functionality ? (
            <div className="proto-gallery__detail-block">
              <h4>Functionality</h4>
              <p>{active.functionality}</p>
            </div>
          ) : null}
          {active.userValue ? (
            <div className="proto-gallery__detail-block">
              <h4>User Value</h4>
              <p>{active.userValue}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {lightboxOpen && active ? (
        <div
          className="proto-gallery__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={closeLightbox}
        >
          <div className="proto-gallery__lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="proto-gallery__lightbox-close" onClick={closeLightbox} aria-label="Close">
              ✕
            </button>
            {sorted.length > 1 ? (
              <>
                <button
                  type="button"
                  className="proto-gallery__lightbox-nav proto-gallery__lightbox-nav--prev"
                  onClick={() => stepLightbox(-1)}
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="proto-gallery__lightbox-nav proto-gallery__lightbox-nav--next"
                  onClick={() => stepLightbox(1)}
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            ) : null}
            <img src={active.url} alt={active.title} className="proto-gallery__lightbox-img" />
            <div className="proto-gallery__lightbox-caption">
              <strong>{active.title}</strong>
              <span>{categoryLabel(active.category)}</span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
