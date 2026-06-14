import { useState } from 'react';
import { AdvancedMarketingPage } from './marketing/AdvancedMarketingPage';

const TOPICS = [
  { id: 'validation', title: 'Validation gate best practices', replies: 42, tag: 'Validation' },
  { id: 'funding', title: 'First pitch deck review thread', replies: 28, tag: 'Funding' },
  { id: 'maya', title: 'MAYA prompt tips for research', replies: 67, tag: 'MAYA AI' },
  { id: 'teams', title: 'Finding a technical co-founder', replies: 19, tag: 'Teams' },
];

const EVENTS = [
  { date: 'Jun 18', title: 'Health-tech founder AMA', type: 'Live' },
  { date: 'Jun 22', title: 'Prototype testing workshop', type: 'Workshop' },
  { date: 'Jun 28', title: 'Funding readiness office hours', type: 'Mentorship' },
];

export default function Community() {
  const [activeTopic, setActiveTopic] = useState(TOPICS[0].id);
  const topic = TOPICS.find((t) => t.id === activeTopic) ?? TOPICS[0];

  return (
    <AdvancedMarketingPage
      pill="🌍 Global community"
      title="Innovator"
      titleAccent="Community"
      subtitle="Connect with builders, mentors, and founders across 35+ countries. Mock preview — full workspace requires an account."
      ctaTitle="Join the conversation"
      ctaSubtitle="Create a free account to access forums, hackathons, and mentorship matching."
      ctas={[
        { label: 'Create Account', to: '/register', variant: 'primary' },
        { label: 'Explore Hackathons', to: '/hackathons', variant: 'secondary' },
        { label: 'Request Demo', to: '/demo', variant: 'ghost' },
      ]}
    >
      <div className="mkt-stats">
        <div className="mkt-stat">
          <strong>10K+</strong>
          <span>Active innovators</span>
        </div>
        <div className="mkt-stat">
          <strong>35+</strong>
          <span>Countries</span>
        </div>
        <div className="mkt-stat">
          <strong>240</strong>
          <span>Weekly discussions</span>
        </div>
        <div className="mkt-stat">
          <strong>18</strong>
          <span>Live events / month</span>
        </div>
      </div>

      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Discussions</div>
          <h2>
            Trending <span>topics</span>
          </h2>
        </div>
        <div className="mkt-grid">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`mkt-card mkt-card--clickable ${activeTopic === t.id ? 'mkt-card--active' : ''}`}
              onClick={() => setActiveTopic(t.id)}
            >
              <div className="mkt-card__meta">{t.tag}</div>
              <h3>{t.title}</h3>
              <p>{t.replies} replies · Sample thread preview</p>
            </button>
          ))}
        </div>
        <p className="mkt-panel" style={{ marginTop: '1rem' }}>
          <strong>{topic.title}</strong> — Innovators share frameworks, MAYA prompts, and pipeline
          lessons. In the live platform, threads link to projects and mentorship requests.
        </p>
      </section>

      <section className="mkt-section">
        <div className="mkt-section__head">
          <div className="mkt-kicker">Events</div>
          <h2>
            Upcoming <span>sessions</span>
          </h2>
        </div>
        <ul className="mkt-list">
          {EVENTS.map((e) => (
            <li key={e.title}>
              <span>
                <strong>{e.date}</strong> — {e.title}
              </span>
              <span className="mkt-badge mkt-badge--info">{e.type}</span>
            </li>
          ))}
        </ul>
      </section>
    </AdvancedMarketingPage>
  );
}
