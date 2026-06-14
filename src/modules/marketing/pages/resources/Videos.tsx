import { useState } from 'react';
import { AdvancedMarketingPage } from '../marketing/AdvancedMarketingPage';

const VIDEOS = [
  { id: 'overview', title: 'XLab platform overview', duration: '8:42', views: '12.4K' },
  { id: 'research', title: 'Research Center walkthrough', duration: '11:05', views: '6.2K' },
  { id: 'validation', title: 'Passing the validation gate', duration: '9:18', views: '8.1K' },
  { id: 'funding', title: 'Funding Hub pitch builder', duration: '7:55', views: '5.9K' },
  { id: 'maya', title: 'MAYA AI assistant demo', duration: '6:30', views: '14.2K' },
  { id: 'commercial', title: 'Commercialization command center', duration: '10:12', views: '4.3K' },
];

export default function ResourceVideos() {
  const [active, setActive] = useState(VIDEOS[0].id);
  const video = VIDEOS.find((v) => v.id === active) ?? VIDEOS[0];

  return (
    <AdvancedMarketingPage
      pill="🎥 Video tutorials"
      title="Learn by"
      titleAccent="watching"
      subtitle="See how innovators use Maylet XLab across research, validation, funding, and launch. Mock playlist — no video player backend."
      ctaTitle="Try it yourself"
      ctaSubtitle="Walk through the interactive demo or create an account to use the full platform."
      ctas={[
        { label: 'Interactive Demo', to: '/demo', variant: 'primary' },
        { label: 'Create Account', to: '/register', variant: 'secondary' },
      ]}
      disclaimer="Video thumbnails and playback are illustrative — embed your CDN or YouTube links in production."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1rem' }}>
        <div
          className="mkt-panel"
          style={{
            minHeight: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            fontSize: '3rem',
          }}
        >
          ▶
        </div>
        <div>
          <h3 style={{ margin: '0 0 0.5rem' }}>{video.title}</h3>
          <p style={{ margin: 0, opacity: 0.65, fontSize: '0.85rem' }}>
            {video.duration} · {video.views} views
          </p>
          <p className="mkt-panel" style={{ marginTop: '1rem' }}>
            Sample tutorial showing how teams move a health-tech project through the innovation
            pipeline using XLab modules and MAYA guidance.
          </p>
        </div>
      </div>

      <ul className="mkt-list" style={{ marginTop: '1.5rem' }}>
        {VIDEOS.map((v) => (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => setActive(v.id)}
              style={{
                background: 'none',
                border: 'none',
                color: active === v.id ? '#2fd4ff' : 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                padding: 0,
              }}
            >
              {v.title}
            </button>
            <span style={{ opacity: 0.55, fontSize: '0.82rem' }}>
              {v.duration} · {v.views}
            </span>
          </li>
        ))}
      </ul>
    </AdvancedMarketingPage>
  );
}
