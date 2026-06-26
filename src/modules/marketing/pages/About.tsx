import { Link } from 'react-router-dom';

const About = () => {
  const teamMembers = [
    { name: 'Engineer Mayunga', role: 'Founder & Lead Developer', bio: 'Full-stack engineer passionate about innovation and technology in Africa.', avatar: 'EM', color: '#7c5fe6' },
    { name: 'Amedinana Charles', role: 'Head of Innovation', bio: 'AgriTech specialist with 10+ years of experience in startup incubation.', avatar: 'AK', color: '#4fd1c5' },
    { name: 'Faustine Jonas', role: 'Technical Lead', bio: 'Full-stack developer and open source contributor.', avatar: 'DM', color: '#48bb78' },
    { name: 'Ibrahim ndonsi', role: 'Product Manager', bio: 'Product strategist focused on user-centered design.', avatar: 'SO', color: '#f093fb' },
  ];

  const values = [
    { title: 'Innovation First', description: 'We believe in the power of ideas to change the world.', icon: '💡' },
    { title: 'Collaboration', description: 'Great things happen when people work together.', icon: '🤝' },
    { title: 'Excellence', description: 'We strive for the highest quality in everything we do.', icon: '⭐' },
    { title: 'Impact', description: 'Building solutions that make a real difference.', icon: '🌍' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)', color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>

      {/* Hero Section */}
      <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(124,95,230,0.12)', border: '1px solid rgba(124,95,230,0.25)', borderRadius: '40px', padding: '0.4rem 1rem', fontSize: '0.8rem', color: '#9b7ff0', marginBottom: '1rem' }}>
          <span>🌟</span> About Us
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '700', marginBottom: '1rem' }}>
          Building the Future of <span style={{ background: 'linear-gradient(135deg, #9b7ff0, #2fd4ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Innovation</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Maylet XLab is on a mission to empower innovators across Africa and beyond to turn their ideas into impactful solutions.
        </p>
      </div>

      {/* Mission Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Our Mission</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>To democratize innovation by providing accessible tools, resources, and funding opportunities for every aspiring innovator.</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👁️</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Our Vision</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>To become the leading innovation operating system in Africa, connecting 1 million innovators by 2030.</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Our Story</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>Born from the need to bridge the gap between ideas and execution, Maylet XLab started as a small project and grew into a full innovation ecosystem.</p>
        </div>
      </div>

      {/* Values Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' }}>Our Core <span style={{ color: '#2fd4ff' }}>Values</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {values.map((value, index) => (
            <div key={index} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.5rem', textAlign: 'center', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{value.icon}</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{value.title}</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: '1.5' }}>{value.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2rem' }}>Meet the <span style={{ color: '#2fd4ff' }}>Team</span></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {teamMembers.map((member, index) => (
            <div key={index} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: member.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 1rem' }}>{member.avatar}</div>
              <h3 style={{ marginBottom: '0.25rem' }}>{member.name}</h3>
              <p style={{ color: member.color, fontSize: '0.8rem', marginBottom: '0.5rem' }}>{member.role}</p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', lineHeight: '1.5' }}>{member.bio}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c5fe6' }}>10K+</div>
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>Innovators</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4fd1c5' }}>2K+</div>
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>Projects Built</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#48bb78' }}>$5M+</div>
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>Funds Raised</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1.5rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f6c90e' }}>35+</div>
          <div style={{ color: 'rgba(255,255,255,0.7)' }}>Countries</div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '3rem auto', padding: '3rem', background: 'linear-gradient(135deg, rgba(124,95,230,0.08), rgba(47,212,255,0.04))', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Join Our Journey</h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>Be part of the innovation revolution. Start building your future today.</p>
        <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, #7c5fe6, #2fd4ff)', color: '#0a0d1a', padding: '0.8rem 2rem', borderRadius: '40px', textDecoration: 'none', fontWeight: '600', transition: 'all 0.2s' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(124,95,230,0.3)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
          Get Started <span>→</span>
        </Link>
      </div>
    </div>
  );
};

export default About;