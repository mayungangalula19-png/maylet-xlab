import { Link } from 'react-router-dom';

const Ecosystem = () => {
  const ecosystemItems = [
    { icon: '🌱', title: 'Startup Incubator', description: 'From idea to incorporation – we guide you through every step of building your startup.', metric: '50+ startups accelerated' },
    { icon: '🎓', title: 'Innovation Academy', description: 'Masterclasses, workshops, and resources from top innovators and industry leaders.', metric: '10,000+ learners' },
    { icon: '🌍', title: 'Global Community', description: 'Connect with innovators, mentors, and investors across multiple countries worldwide.', metric: '35+ countries' },
  ];

  return (
    <div className="ecosystem-page">
      <div className="ecosystem-hero">
        <h1>A Complete Innovation Ecosystem</h1>
        <p>Beyond the platform — access capital, community, and expertise</p>
      </div>
      <div className="ecosystem-grid">
        {ecosystemItems.map((item, i) => (
          <div key={i} className="ecosystem-card">
            <div className="eco-icon">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="eco-metric">{item.metric}</div>
            <Link to="/register" className="eco-link">Learn More →</Link>
          </div>
        ))}
      </div>
      <style>{`
        .ecosystem-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          padding: 2rem;
        }
        .ecosystem-hero {
          text-align: center;
          padding: 3rem 2rem;
        }
        .ecosystem-hero h1 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        .ecosystem-hero p {
          color: rgba(255,255,255,0.7);
        }
        .ecosystem-grid {
          max-width: 1000px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .ecosystem-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 1.5rem;
          text-align: center;
        }
        .eco-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }
        .eco-metric {
          font-size: 0.75rem;
          color: #48bb78;
          margin: 0.5rem 0;
        }
        .eco-link {
          display: inline-block;
          margin-top: 0.5rem;
          color: #9b7ff0;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};

export default Ecosystem;