import { useState } from 'react';
import { AdvancedMarketingPage } from '../marketing/AdvancedMarketingPage';

const COURSES = [
  { id: 'validation', category: 'Validation', title: 'Evidence-based validation', duration: '4h', level: 'Intermediate' },
  { id: 'prototype', category: 'Build', title: 'Rapid prototyping playbook', duration: '3h', level: 'Beginner' },
  { id: 'funding', category: 'Funding', title: 'Pitch deck that closes', duration: '5h', level: 'Advanced' },
  { id: 'maya', category: 'MAYA AI', title: 'MAYA prompts for innovators', duration: '2h', level: 'All levels' },
  { id: 'gtm', category: 'Launch', title: 'Go-to-market for health-tech', duration: '3.5h', level: 'Intermediate' },
  { id: 'research', category: 'Research', title: 'Literature review mastery', duration: '4h', level: 'Beginner' },
];

const CATEGORIES = ['All', 'Validation', 'Build', 'Funding', 'MAYA AI', 'Launch', 'Research'];

export default function EcosystemAcademy() {
  const [category, setCategory] = useState('All');
  const filtered =
    category === 'All' ? COURSES : COURSES.filter((c) => c.category === category);

  return (
    <AdvancedMarketingPage
      pill="🎓 Innovation Academy"
      title="Learn the"
      titleAccent="pipeline"
      subtitle="Masterclasses, workshops, and playbooks from experienced founders — 10,000+ learners on the ecosystem program."
      ctaTitle="Start learning on XLab"
      ctaSubtitle="Full courses unlock inside the platform Learning Hub for registered innovators."
      ctas={[
        { label: 'Learning Hub', to: '/learning', variant: 'primary' },
        { label: 'Create Account', to: '/register', variant: 'secondary' },
        { label: 'Resource Guide', to: '/resources/guide', variant: 'ghost' },
      ]}
    >
      <div className="mkt-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`mkt-tab ${category === cat ? 'mkt-tab--active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mkt-grid">
        {filtered.map((c) => (
          <div key={c.id} className="mkt-card">
            <div className="mkt-card__meta">
              {c.category} · {c.duration}
            </div>
            <h3>{c.title}</h3>
            <p>{c.level} — Sample course preview</p>
          </div>
        ))}
      </div>
    </AdvancedMarketingPage>
  );
}
