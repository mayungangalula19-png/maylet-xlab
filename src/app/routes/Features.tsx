import { Link } from 'react-router-dom';

export const Features = () => {
  const features = [
    { id: 1, title: 'AI Idea Validation', description: 'Get instant market-fit scores and risk assessment powered by AI.', icon: '🤖', path: '/features/ai' },
    { id: 2, title: 'Prototypes & MVPs', description: 'Build and iterate prototypes with version control.', icon: '📦', path: '/features/prototypes' },
    { id: 3, title: 'Team Collaboration', description: 'Work together with real-time chat and kanban boards.', icon: '👥', path: '/features/collaboration' },
    { id: 4, title: 'Projects & Tasks', description: 'Manage projects, tasks and milestones in one workspace.', icon: '📊', path: '/features/projects' },
    { id: 5, title: 'Funding Hub', description: 'Connect with investors and raise capital for your startup.', icon: '💰', path: '/funding' },
    { id: 6, title: 'Innovation Vault', description: 'Protect your ideas with blockchain-grade security.', icon: '🔐', path: '/vault' },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Powerful Features</h1>
      <p style={{ color: '#a0a0b0', marginBottom: '2rem' }}>Everything you need to turn ideas into impact</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {features.map((feature) => (
          <Link key={feature.id} to={feature.path} style={{ textDecoration: 'none', color: 'white' }}>
            <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: '16px', transition: 'transform 0.2s', height: '100%' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{feature.title}</h3>
              <p style={{ color: '#a0a0b0', lineHeight: '1.6' }}>{feature.description}</p>
              <span style={{ color: '#7c5fe6', marginTop: '1rem', display: 'inline-block' }}>Learn More →</span>
            </div>
          </Link>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <Link to="/register" style={{ background: 'linear-gradient(135deg, #7c5fe6, #2fd4ff)', color: '#0a0d1a', padding: '0.8rem 2rem', borderRadius: '40px', textDecoration: 'none', fontWeight: '600' }}>Start Building Now →</Link>
      </div>
    </div>
  );
};