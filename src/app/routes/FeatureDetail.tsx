import { useParams, Link } from 'react-router-dom';

const FeatureDetail = () => {
  const { featureId } = useParams();

  const features: Record<string, { title: string; description: string; benefits: string[] }> = {
    ai: {
      title: 'AI Idea Validation',
      description: 'Get instant market-fit scores, competitor analysis, and risk assessment powered by AI before writing any code.',
      benefits: ['Instant market-fit scoring (0-100%)', 'Competitor landscape analysis', 'Risk assessment and mitigation strategies', 'Target audience identification', 'Revenue potential estimation'],
    },
    prototypes: {
      title: 'Prototypes & MVPs',
      description: 'Build, iterate and showcase prototypes with integrated file management, version history, and user feedback tools.',
      benefits: ['Upload multiple file formats', 'Version control for every iteration', 'User feedback collection', 'Shareable prototype links', 'Embed live demos'],
    },
    collaboration: {
      title: 'Team Collaboration',
      description: 'Find co-founders, assemble teams, and work together with real-time kanban, chat, and shared documents.',
      benefits: ['Real-time chat and video calls', 'Kanban boards for task management', 'Role-based access control', 'Shared document workspace', 'Activity tracking and notifications'],
    },
    projects: {
      title: 'Projects & Tasks',
      description: 'Manage projects, tasks and milestones in one powerful workspace with progress tracking and deadline reminders.',
      benefits: ['Milestone tracking with percentage complete', 'Task assignment and deadlines', 'Progress dashboard and analytics', 'Automated reminders and notifications', 'Project templates for quick start'],
    },
  };

  const feature = features[featureId || 'ai'];

  return (
    <div className="feature-detail-page">
      <div className="feature-detail-container">
        <div className="feature-header">
          <Link to="/features" className="back-link">← Back to Features</Link>
          <h1>{feature?.title || 'Feature Detail'}</h1>
        </div>
        <div className="feature-content">
          <p className="feature-description">{feature?.description}</p>
          <h2>Key Benefits</h2>
          <ul>
            {feature?.benefits.map((benefit, i) => <li key={i}>✓ {benefit}</li>)}
          </ul>
          <Link to="/register" className="cta-button">Try This Feature →</Link>
        </div>
      </div>
      <style>{`
        .feature-detail-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
          padding: 2rem;
        }
        .feature-detail-container {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 24px;
          padding: 2rem;
        }
        .feature-header {
          margin-bottom: 2rem;
        }
        .back-link {
          color: #9b7ff0;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 2rem;
        }
        .feature-description {
          font-size: 1rem;
          line-height: 1.6;
          color: rgba(255,255,255,0.8);
          margin-bottom: 2rem;
        }
        h2 {
          font-size: 1.2rem;
          margin-bottom: 1rem;
          color: #9b7ff0;
        }
        ul {
          list-style: none;
          padding: 0;
          margin-bottom: 2rem;
        }
        li {
          padding: 0.5rem 0;
          color: rgba(255,255,255,0.7);
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          color: #0a0d1a;
          padding: 0.8rem 1.5rem;
          border-radius: 40px;
          text-decoration: none;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default FeatureDetail;