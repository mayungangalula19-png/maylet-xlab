import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'general' | 'project' | 'experiment' | 'code' | 'document';
  context?: {
    projectId?: string;
    experimentId?: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  sector: string;
  progress: number;
}

interface Experiment {
  id: string;
  project_id: string;
  hypothesis: string;
  type: string;
  status: string;
}

interface AIModel {
  id: 'gpt' | 'gemini' | 'groq' | 'deepseek' | 'maylet';
  name: string;
  icon: string;
  description: string;
  free: boolean;
  apiRequired: boolean;
  apiKeyName: string;
  apiUrl: string;
}

interface AIAnalytics {
  totalPrompts: number;
  tokensUsed: number;
  projectsAssisted: number;
  experimentsAssisted: number;
  documentsGenerated: number;
  lastActive: Date;
  modelsUsed: Record<string, number>;
}
const availableModels: AIModel[] = [
  {
    id: 'groq',
    name: 'Groq (Llama 3)',
    icon: '⚡',
    description: 'Fastest, 10k+ free requests/day',
    free: true,
    apiRequired: true,
    apiKeyName: 'VITE_GROQ_API_KEY',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '🔵',
    description: '60 requests/min free',
    free: true,
    apiRequired: true,
    apiKeyName: 'VITE_GEMINI_API_KEY',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  },
  {
    id: 'gpt',
    name: 'OpenAI GPT',
    icon: '🟢',
    description: '$5 free credits',
    free: false,
    apiRequired: true,
    apiKeyName: 'VITE_OPENAI_API_KEY',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔴',
    description: 'Cheap & powerful',
    free: false,
    apiRequired: true,
    apiKeyName: 'VITE_DEEPSEEK_API_KEY',
    apiUrl: 'https://api.deepseek.com/v1/chat/completions',
  },
  {
    id: 'maylet',
    name: 'Maylet AI (Local)',
    icon: '🟣',
    description: 'Simulated responses - No API key needed',
    free: true,
    apiRequired: false,
    apiKeyName: '',
    apiUrl: '',
  },
];
const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const mainMenu = [
    { icon: '📊', label: 'Dashboard', route: '/dashboard' },
    { icon: '📁', label: 'Projects', route: '/projects' },
    { icon: '🧪', label: 'Experiments', route: '/experiments' },
    { icon: '🤖', label: 'AI Assistant', route: '/ai-assistant', active: true },
    { icon: '📦', label: 'Prototypes', route: '/prototypes' },
    { icon: '👥', label: 'Teams', route: '/teams' },
    { icon: '📄', label: 'Documents', route: '/documents' },
    { icon: '🔐', label: 'Innovation Vault', route: '/vault' },
    { icon: '💰', label: 'Funding Hub', route: '/funding' },
    { icon: '🎓', label: 'Mentorship', route: '/mentorship' },
    { icon: '🏢', label: 'Enterprise', route: '/enterprise' },
    { icon: '🏆', label: 'Hackathons', route: '/hackathons' },
    { icon: '📚', label: 'Learning Hub', route: '/learning' },
    { icon: '📈', label: 'Analytics', route: '/analytics' },
    { icon: '🛒', label: 'Marketplace', route: '/marketplace' },
    { icon: '💬', label: 'Feedback', route: '/feedback' },
    { icon: '🛠️', label: 'Help & Support', route: '/help' },
  ];

  const userMenu = [
    { icon: '🔔', label: 'Notifications', route: '/notifications' },
    { icon: '⚙️', label: 'Settings', route: '/settings' },
    { icon: '👤', label: 'Profile', route: '/profile' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      <button className="mobile-sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">✦</div>
          {!collapsed && (
            <div className="logo-text">
              <div className="logo-title">MAYLET X LAB</div>
              <div className="logo-tagline">Innovate. Build. Scale.</div>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>
        <nav className="sidebar-nav">
          {mainMenu.map((item) => (
            <Link key={item.label} to={item.route} className={`sidebar-link ${item.active ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-divider"></div>
        <nav className="sidebar-nav user-nav">
          {userMenu.map((item) => (
            <Link key={item.label} to={item.route} className="sidebar-link" title={collapsed ? item.label : undefined}>
              <span className="sidebar-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </Link>
          ))}
          <button onClick={handleLogout} className="sidebar-link logout-link">
            <span className="sidebar-icon">🚪</span>
            {!collapsed && <span className="sidebar-label">Sign Out</span>}
          </button>
        </nav>
      </aside>
      <style>{`
        .sidebar-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 98; display: none; }
        .mobile-sidebar-toggle { display: none; position: fixed; top: 1rem; left: 1rem; z-index: 100; background: #7c5fe6; border: none; color: white; font-size: 1.5rem; width: 48px; height: 48px; border-radius: 12px; cursor: pointer; }
        .sidebar { position: fixed; top: 0; left: 0; height: 100vh; background: #0a0d1a; color: rgba(255,255,255,0.7); display: flex; flex-direction: column; z-index: 99; transition: width 0.3s ease; overflow-y: auto; overflow-x: hidden; width: 280px; box-shadow: 2px 0 10px rgba(0,0,0,0.3); }
        .sidebar.collapsed { width: 80px; }
        .sidebar-logo { padding: 1.5rem 1rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); position: relative; }
        .logo-icon { font-size: 2rem; font-weight: bold; background: linear-gradient(135deg, #7c5fe6, #2fd4ff); -webkit-background-clip: text; background-clip: text; color: transparent; min-width: 40px; text-align: center; }
        .logo-title { font-weight: 700; font-size: 1rem; color: white; }
        .logo-tagline { font-size: 0.65rem; color: rgba(255,255,255,0.5); }
        .sidebar-toggle { position: absolute; right: 0.5rem; background: rgba(255,255,255,0.1); border: none; color: white; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; }
        .sidebar-nav { flex: 1; padding: 1rem 0; }
        .sidebar-link { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 1rem; color: rgba(255,255,255,0.7); text-decoration: none; transition: all 0.2s; margin: 0.25rem 0.5rem; border-radius: 12px; background: none; border: none; width: calc(100% - 1rem); cursor: pointer; font-size: 0.9rem; }
        .sidebar-link:hover { background: rgba(124,95,230,0.2); color: white; }
        .sidebar-link.active { background: #7c5fe6; color: white; }
        .sidebar-icon { font-size: 1.25rem; min-width: 24px; text-align: center; }
        .sidebar-label { font-size: 0.85rem; white-space: nowrap; }
        .sidebar.collapsed .sidebar-label { display: none; }
        .sidebar.collapsed .sidebar-link { justify-content: center; padding: 0.75rem; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.1); margin: 0.5rem 1rem; }
        .user-nav { margin-bottom: 1rem; }
        .logout-link { color: #fc8181; }
        .logout-link:hover { background: rgba(252,129,129,0.2); color: #fc8181; }
        @media (max-width: 768px) { .mobile-sidebar-toggle { display: block; } .sidebar { transform: translateX(-100%); width: 280px; } .sidebar.mobile-open { transform: translateX(0); } .sidebar-overlay { display: block; } }
      `}</style>
    </>
  );
};

class AIService {
  private static instance: AIService;
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async getAIResponse(
    model: AIModel,
    message: string,
    context: { project?: Project; experiment?: Experiment },
    apiKey: string
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    
    // If no API key and model requires one, use simulation
    if (model.apiRequired && !apiKey) {
      return this.getSimulatedResponse(message, context);
    }

    try {
      switch (model.id) {
        case 'groq':
          return await this.callGroqAPI(model, systemPrompt, message, apiKey);
        case 'gemini':
          return await this.callGeminiAPI(model, systemPrompt, message, apiKey);
        case 'gpt':
          return await this.callOpenAIAPI(model, systemPrompt, message, apiKey);
        case 'deepseek':
          return await this.callDeepSeekAPI(model, systemPrompt, message, apiKey);
        default:
          return this.getSimulatedResponse(message, context);
      }
    } catch (error) {
      console.error('AI API Error:', error);
      return this.getSimulatedResponse(message, context);
    }
  }

  private buildSystemPrompt(context: { project?: Project; experiment?: Experiment }): string {
    let prompt = `You are Maylet AI, an advanced innovation assistant for Maylet XLab platform. `;
    prompt += `Help users with project development, experiment validation, code generation, and business strategy. `;
    prompt += `Be concise, practical, and action-oriented. Provide specific recommendations.\n\n`;
    
    if (context.project) {
      prompt += `Current Project Context:\n`;
      prompt += `- Name: ${context.project.name}\n`;
      prompt += `- Sector: ${context.project.sector}\n`;
      prompt += `- Description: ${context.project.description}\n`;
      prompt += `- Progress: ${context.project.progress}%\n\n`;
    }
    
    if (context.experiment) {
      prompt += `Current Experiment Context:\n`;
      prompt += `- Hypothesis: ${context.experiment.hypothesis}\n`;
      prompt += `- Type: ${context.experiment.type}\n\n`;
    }
    
    prompt += `Provide helpful, actionable responses tailored to the user's innovation journey.`;
    return prompt;
  }

  private async callGroqAPI(model: AIModel, systemPrompt: string, userMessage: string, apiKey: string): Promise<string> {
    const response = await fetch(model.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || this.getSimulatedResponse(userMessage);
  }

  private async callGeminiAPI(model: AIModel, systemPrompt: string, userMessage: string, apiKey: string): Promise<string> {
    const response = await fetch(`${model.apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt + '\n\nUser: ' + userMessage }
            ]
          }
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      }),
    });
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || this.getSimulatedResponse(userMessage);
  }

  private async callOpenAIAPI(model: AIModel, systemPrompt: string, userMessage: string, apiKey: string): Promise<string> {
    const response = await fetch(model.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || this.getSimulatedResponse(userMessage);
  }

  private async callDeepSeekAPI(model: AIModel, systemPrompt: string, userMessage: string, apiKey: string): Promise<string> {
    const response = await fetch(model.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || this.getSimulatedResponse(userMessage);
  }

  private getSimulatedResponse(userMessage: string, context?: { project?: Project }): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('analyze') || lowerMessage.includes('project')) {
      const projectName = context?.project?.name || 'your project';
      return `📊 **Project Analysis: ${projectName}**\n\n` +
             `Based on my analysis:\n\n` +
             `• **Feasibility Score**: 85/100\n` +
             `• **Market Potential**: High\n` +
             `• **Risk Level**: Low\n\n` +
             `**Recommendations:**\n` +
             `1. Focus on mobile-first users\n` +
             `2. Partner with local organizations\n` +
             `3. Consider freemium pricing model\n\n` +
             `*Note: This is a simulated response. Connect an AI API for real analysis.*`;
    }
    
    if (lowerMessage.includes('code') || lowerMessage.includes('generate')) {
      return `💻 **Code Assistant**\n\n` +
             `\`\`\`tsx\n` +
             `// Example React Component for ${context?.project?.name || 'your project'}\n` +
             `const ProjectCard = ({ project }) => {\n` +
             `  return (\n` +
             `    <div className="project-card">\n` +
             `      <h3>{project.name}</h3>\n` +
             `      <p>{project.description}</p>\n` +
             `      <div className="progress-bar">\n` +
             `        <div style={{ width: \`\${project.progress}%\` }} />\n` +
             `      </div>\n` +
             `    </div>\n` +
             `  );\n` +
             `};\n` +
             `\`\`\`\n\n` +
             `*Note: This is a simulated response. Connect an AI API for real code generation.*`;
    }
    
    if (lowerMessage.includes('proposal') || lowerMessage.includes('document')) {
      return `📄 **Document Assistant**\n\n` +
             `I can help you generate:\n\n` +
             `• 📊 **Investor Proposal** - Pitch deck and executive summary\n` +
             `• 📈 **Business Plan** - Market analysis and financial projections\n` +
             `• 🔬 **Research Report** - Methodology and findings\n` +
             `• 📝 **Project Documentation** - Technical specs and user guides\n\n` +
             `Which document would you like me to create?\n\n` +
             `*Note: This is a simulated response. Connect an AI API for real document generation.*`;
    }
    
    return `🤖 **AI Innovation Assistant**\n\n` +
           `I'm here to help you with:\n\n` +
           `• 📊 **Project Analysis** - Feasibility, market potential, risks\n` +
           `• 💻 **Code Generation** - React components, API integration\n` +
           `• 📄 **Document Creation** - Proposals, reports, documentation\n` +
           `• 🧪 **Experiment Design** - Hypothesis testing and validation\n` +
           `• 🔍 **Market Research** - Competitor analysis, trends\n\n` +
           `What would you like me to assist you with today?\n\n` +
           `*Note: This is a simulated response. Add your API key in .env file for real AI responses.*\n\n` +
           `**Free API Keys:**\n` +
           `• Groq: https://console.groq.com/keys\n` +
           `• Google Gemini: https://aistudio.google.com/apikey`;
  }
}

// ============================================================
// MAIN AI ASSISTANT COMPONENT
// ============================================================
const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "🤖 **Welcome to Maylet AI Innovation Assistant!**\n\nI'm here to help you with:\n\n• 📊 **Project Analysis** - Get feasibility scores and market insights\n• 💻 **Code Generation** - Create React components and API integrations\n• 📄 **Document Creation** - Generate proposals, reports, and documentation\n• 🧪 **Experiment Design** - Validate hypotheses and analyze results\n• 🔍 **Market Research** - Competitor analysis and industry trends\n\n**To get started:**\n1. Select an AI model below\n2. Choose a project for context (optional)\n3. Ask me anything!\n\n*💡 Tip: Add your API key in `.env` file for real AI responses. Get free keys at https://console.groq.com/keys*",
      timestamp: new Date(),
      type: 'general',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(availableModels[0]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [analytics, setAnalytics] = useState<AIAnalytics>({
    totalPrompts: 0,
    tokensUsed: 0,
    projectsAssisted: 0,
    experimentsAssisted: 0,
    documentsGenerated: 0,
    lastActive: new Date(),
    modelsUsed: {},
  });
  const [showApiSettings, setShowApiSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics' | 'models'>('chat');
  const aiService = AIService.getInstance();

  // Load API keys from environment
  useEffect(() => {
    const keys: Record<string, string> = {};
    if (import.meta.env.VITE_GROQ_API_KEY) keys['groq'] = import.meta.env.VITE_GROQ_API_KEY;
    if (import.meta.env.VITE_GEMINI_API_KEY) keys['gemini'] = import.meta.env.VITE_GEMINI_API_KEY;
    if (import.meta.env.VITE_OPENAI_API_KEY) keys['gpt'] = import.meta.env.VITE_OPENAI_API_KEY;
    if (import.meta.env.VITE_DEEPSEEK_API_KEY) keys['deepseek'] = import.meta.env.VITE_DEEPSEEK_API_KEY;
    setApiKeys(keys);
  }, []);

  // Fetch projects and experiments
  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, description, sector, progress')
        .eq('user_id', session.user.id);

      setProjects(projectsData || []);

      if (projectsData && projectsData.length > 0) {
        const { data: experimentsData } = await supabase
          .from('experiments')
          .select('id, project_id, hypothesis, type, status')
          .eq('user_id', session.user.id);
        setExperiments(experimentsData || []);
      }
    };
    fetchData();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getProjectById = (id: string | null) => projects.find(p => p.id === id);
  const getExperimentsByProject = (projectId: string | null) => 
    experiments.filter(e => e.project_id === projectId);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      context: { projectId: selectedProject || undefined, experimentId: selectedExperiment || undefined },
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Update analytics
    setAnalytics(prev => ({
      ...prev,
      totalPrompts: prev.totalPrompts + 1,
      projectsAssisted: selectedProject ? prev.projectsAssisted + 1 : prev.projectsAssisted,
      experimentsAssisted: selectedExperiment ? prev.experimentsAssisted + 1 : prev.experimentsAssisted,
      modelsUsed: { ...prev.modelsUsed, [selectedModel.id]: (prev.modelsUsed[selectedModel.id] || 0) + 1 },
      lastActive: new Date(),
    }));

    // Get AI response
    const context = {
      project: getProjectById(selectedProject),
      experiment: experiments.find(e => e.id === selectedExperiment),
    };
    
    const responseContent = await aiService.getAIResponse(
      selectedModel,
      userMessage.content,
      context,
      apiKeys[selectedModel.id] || ''
    );
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      type: selectedProject ? 'project' : 'general',
      context: { projectId: selectedProject || undefined, experimentId: selectedExperiment || undefined },
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setLoading(false);
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      content: "Chat cleared. How can I help you today?\n\n*Tip: Select a project above for context-specific assistance!*",
      timestamp: new Date(),
      type: 'general',
    }]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasApiKey = (model: AIModel) => !model.apiRequired || !!apiKeys[model.id];

  return (
    <div className="ai-assistant-container">
      <Sidebar />
      
      <main className="ai-assistant-main">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1>🤖 AI Innovation Assistant</h1>
            <p>Powered by multiple AI models • Innovation workflow integration</p>
          </div>
          <div className="header-right">
            <button onClick={() => setShowApiSettings(!showApiSettings)} className="btn-api-settings">
              🔑 API Keys
            </button>
            <button onClick={clearChat} className="btn-clear">🗑️ Clear Chat</button>
          </div>
        </div>

        {/* API Settings Panel */}
        {showApiSettings && (
          <div className="api-settings-panel">
            <h3>🔑 AI API Configuration</h3>
            <p>Get free API keys from these providers:</p>
            <div className="api-links">
              <div className="api-link">
                <span>⚡ Groq (Recommended - Free)</span>
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">https://console.groq.com/keys</a>
                <code>VITE_GROQ_API_KEY=your_key_here</code>
              </div>
              <div className="api-link">
                <span>🔵 Google Gemini (Free)</span>
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">https://aistudio.google.com/apikey</a>
                <code>VITE_GEMINI_API_KEY=your_key_here</code>
              </div>
              <div className="api-link">
                <span>🟢 OpenAI (Limited free)</span>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">https://platform.openai.com/api-keys</a>
                <code>VITE_OPENAI_API_KEY=your_key_here</code>
              </div>
            </div>
            <p className="api-note">💡 Add these to your <code>.env</code> file and redeploy. Without API keys, AI will use simulated responses.</p>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
            💬 Chat
          </button>
          <button className={`tab ${activeTab === 'models' ? 'active' : ''}`} onClick={() => setActiveTab('models')}>
            🤖 Models
          </button>
          <button className={`tab ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            📊 Analytics
          </button>
        </div>

        {activeTab === 'chat' && (
          <>
            {/* Model Selector */}
            <div className="model-section">
              <div className="section-label">Active AI Model</div>
              <div className="model-selector">
                {availableModels.map((model) => (
                  <button
                    key={model.id}
                    className={`model-btn ${selectedModel.id === model.id ? 'active' : ''} ${!hasApiKey(model) ? 'no-key' : ''}`}
                    onClick={() => setSelectedModel(model)}
                    title={!hasApiKey(model) ? `No API key found. Add ${model.apiKeyName} to .env file` : model.description}
                  >
                    <span>{model.icon}</span> {model.name}
                    {!hasApiKey(model) && <span className="no-key-badge">No Key</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Context Selector */}
            <div className="context-section">
              <div className="context-selector">
                <div className="context-group">
                  <label>📁 Project Context</label>
                  <select value={selectedProject || ''} onChange={(e) => { setSelectedProject(e.target.value || null); setSelectedExperiment(null); }}>
                    <option value="">None (General)</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sector})</option>)}
                  </select>
                </div>
                {selectedProject && (
                  <div className="context-group">
                    <label>🧪 Experiment Context</label>
                    <select value={selectedExperiment || ''} onChange={(e) => setSelectedExperiment(e.target.value || null)}>
                      <option value="">None</option>
                      {getExperimentsByProject(selectedProject).map(e => (
                        <option key={e.id} value={e.id}>{e.hypothesis.substring(0, 50)}...</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="chat-container">
              <div className="messages-area">
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.role}`}>
                    <div className="message-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
                    <div className="message-bubble">
                      <div className="message-content">
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                      <div className="message-time">{msg.timestamp.toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="message assistant">
                    <div className="message-avatar">🤖</div>
                    <div className="message-bubble typing">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="input-area">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything... (e.g., 'Analyze my project', 'Generate code', 'Write a proposal')"
                  rows={3}
                />
                <button onClick={handleSendMessage} disabled={loading}>
                  {loading ? 'Thinking...' : 'Send →'}
                </button>
              </div>

              <div className="quick-actions">
                <button onClick={() => setInput("Analyze my current project")}>📊 Analyze Project</button>
                <button onClick={() => setInput("Generate investor proposal")}>📄 Generate Proposal</button>
                <button onClick={() => setInput("Write React component code")}>💻 Generate Code</button>
                <button onClick={() => setInput("Research market trends in my sector")}>🔍 Market Research</button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'models' && (
          <div className="models-tab">
            <h2>🤖 Available AI Models</h2>
            <div className="models-grid">
              {availableModels.map((model) => (
                <div key={model.id} className="model-card">
                  <div className="model-card-icon">{model.icon}</div>
                  <div className="model-card-name">{model.name}</div>
                  <div className="model-card-desc">{model.description}</div>
                  <div className={`model-card-status ${hasApiKey(model) ? 'active' : 'inactive'}`}>
                    {hasApiKey(model) ? '✅ API Key Configured' : '❌ No API Key'}
                  </div>
                  {model.apiRequired && !hasApiKey(model) && (
                    <div className="model-card-link">
                      <a href={model.id === 'groq' ? 'https://console.groq.com/keys' : 
                               model.id === 'gemini' ? 'https://aistudio.google.com/apikey' :
                               model.id === 'gpt' ? 'https://platform.openai.com/api-keys' :
                               'https://platform.deepseek.com/api_keys'} 
                         target="_blank" rel="noopener noreferrer">
                        Get Free API Key →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="analytics-grid">
              <div className="analytics-card">
                <div className="analytics-icon">💬</div>
                <div className="analytics-value">{analytics.totalPrompts}</div>
                <div className="analytics-label">Total Prompts</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-icon">📁</div>
                <div className="analytics-value">{analytics.projectsAssisted}</div>
                <div className="analytics-label">Projects Assisted</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-icon">🧪</div>
                <div className="analytics-value">{analytics.experimentsAssisted}</div>
                <div className="analytics-label">Experiments Assisted</div>
              </div>
              <div className="analytics-card">
                <div className="analytics-icon">📄</div>
                <div className="analytics-value">{analytics.documentsGenerated}</div>
                <div className="analytics-label">Documents Generated</div>
              </div>
            </div>

            <div className="insights-card">
              <h3>🧠 Model Usage</h3>
              <div className="model-usage">
                {Object.entries(analytics.modelsUsed).map(([model, count]) => (
                  <div key={model} className="usage-item">
                    <span>{availableModels.find(m => m.id === model)?.name || model}</span>
                    <div className="usage-bar"><div className="usage-fill" style={{ width: `${Math.min((count / Math.max(analytics.totalPrompts, 1)) * 100, 100)}%` }}></div></div>
                    <span>{count} prompts</span>
                  </div>
                ))}
                {Object.keys(analytics.modelsUsed).length === 0 && (
                  <p className="no-data">No model usage data yet. Start chatting!</p>
                )}
              </div>
            </div>

            <div className="insights-card">
              <h3>🚀 Innovation Workflow Integration</h3>
              <div className="workflow-steps">
                <div className="step">💡 Idea</div>
                <span>→</span>
                <div className="step">🧪 Experiment</div>
                <span>→</span>
                <div className="step">📦 Prototype</div>
                <span>→</span>
                <div className="step">💰 Funding</div>
                <span>→</span>
                <div className="step">🚀 Launch</div>
              </div>
              <p className="workflow-note">AI assists at every stage of your innovation journey</p>
            </div>

            <div className="insights-card">
              <h3>📊 Quick Stats</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span>Projects Available:</span>
                  <strong>{projects.length}</strong>
                </div>
                <div className="stat-item">
                  <span>Experiments Available:</span>
                  <strong>{experiments.length}</strong>
                </div>
                <div className="stat-item">
                  <span>Last Active:</span>
                  <strong>{analytics.lastActive.toLocaleDateString()}</strong>
                </div>
                <div className="stat-item">
                  <span>Active Model:</span>
                  <strong>{selectedModel.name}</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .ai-assistant-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #1a1a2e 100%);
        }
        
        .ai-assistant-main {
          flex: 1;
          margin-left: 280px;
          padding: 2rem;
          transition: margin-left 0.3s ease;
        }
        
        @media (max-width: 768px) {
          .ai-assistant-main {
            margin-left: 0;
            padding: 1rem;
            padding-top: 5rem;
          }
        }
        
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .page-header h1 {
          font-size: 1.8rem;
          background: linear-gradient(135deg, #fff, #9b7ff0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .btn-api-settings, .btn-clear {
          padding: 0.5rem 1rem;
          border-radius: 30px;
          cursor: pointer;
        }
        
        .btn-api-settings {
          background: rgba(47,212,255,0.2);
          border: 1px solid rgba(47,212,255,0.3);
          color: #2fd4ff;
        }
        
        .btn-clear {
          background: rgba(252,129,129,0.2);
          border: 1px solid rgba(252,129,129,0.3);
          color: #fc8181;
        }
        
        .api-settings-panel {
          background: rgba(0,0,0,0.5);
          border-radius: 16px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .api-settings-panel h3 {
          margin-bottom: 0.5rem;
        }
        
        .api-links {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin: 1rem 0;
        }
        
        .api-link {
          background: rgba(0,0,0,0.3);
          padding: 0.75rem;
          border-radius: 10px;
        }
        
        .api-link span {
          font-weight: 600;
          display: block;
          margin-bottom: 0.25rem;
        }
        
        .api-link a {
          color: #2fd4ff;
          font-size: 0.75rem;
        }
        
        .api-link code {
          display: block;
          background: rgba(0,0,0,0.5);
          padding: 0.25rem;
          border-radius: 4px;
          font-size: 0.7rem;
          margin-top: 0.25rem;
        }
        
        .api-note {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 0.5rem;
        }
        
        .tab {
          padding: 0.5rem 1rem;
          background: none;
          border: none;
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          border-radius: 8px;
        }
        
        .tab.active {
          background: rgba(124,95,230,0.2);
          color: #9b7ff0;
        }
        
        .model-section {
          margin-bottom: 1rem;
        }
        
        .section-label {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
        }
        
        .model-selector {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .model-btn {
          padding: 0.4rem 1rem;
          background: rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 30px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          position: relative;
        }
        
        .model-btn.active {
          background: #7c5fe6;
          color: white;
          border-color: #7c5fe6;
        }
        
        .model-btn.no-key {
          opacity: 0.6;
          border-color: rgba(252,129,129,0.3);
        }
        
        .no-key-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #fc8181;
          color: white;
          font-size: 0.6rem;
          padding: 0.1rem 0.3rem;
          border-radius: 10px;
        }
        
        .context-section {
          margin-bottom: 1rem;
        }
        
        .context-selector {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          background: rgba(0,0,0,0.3);
          padding: 1rem;
          border-radius: 12px;
        }
        
        .context-group {
          flex: 1;
        }
        
        .context-group label {
          display: block;
          font-size: 0.7rem;
          margin-bottom: 0.25rem;
          color: rgba(255,255,255,0.6);
        }
        
        .context-group select {
          width: 100%;
          padding: 0.5rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          color: white;
        }
        
        .chat-container {
          background: rgba(0,0,0,0.3);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 420px);
          min-height: 450px;
        }
        
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .message {
          display: flex;
          gap: 0.75rem;
          max-width: 85%;
        }
        
        .message.user {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        
        .message-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .message.user .message-avatar {
          background: #2a2a3a;
        }
        
        .message-bubble {
          background: rgba(0,0,0,0.5);
          padding: 0.75rem 1rem;
          border-radius: 16px;
          max-width: 100%;
        }
        
        .message.user .message-bubble {
          background: rgba(124,95,230,0.2);
        }
        
        .message-content p {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.5;
        }
        
        .message-time {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.4);
          margin-top: 0.25rem;
        }
        
        .typing {
          display: flex;
          gap: 0.25rem;
          padding: 0.5rem 1rem;
        }
        
        .typing span {
          width: 8px;
          height: 8px;
          background: rgba(255,255,255,0.6);
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }
        
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        
        @keyframes typing {
          0%,60%,100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
        
        .input-area {
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex;
          gap: 0.5rem;
        }
        
        .input-area textarea {
          flex: 1;
          padding: 0.75rem;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white;
          resize: none;
          font-family: inherit;
        }
        
        .input-area button {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #7c5fe6, #2fd4ff);
          border: none;
          border-radius: 12px;
          color: #0a0d1a;
          font-weight: 600;
          cursor: pointer;
        }
        
        .quick-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          flex-wrap: wrap;
        }
        
        .quick-actions button {
          padding: 0.3rem 0.8rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          color: rgba(255,255,255,0.7);
          font-size: 0.7rem;
          cursor: pointer;
        }
        
        /* Models Tab */
        .models-tab h2 {
          font-size: 1.2rem;
          margin-bottom: 1rem;
        }
        
        .models-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }
        
        .model-card {
          background: rgba(0,0,0,0.35);
          border-radius: 16px;
          padding: 1rem;
          text-align: center;
        }
        
        .model-card-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }
        
        .model-card-name {
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        
        .model-card-desc {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.5rem;
        }
        
        .model-card-status {
          font-size: 0.7rem;
          margin-bottom: 0.5rem;
        }
        
        .model-card-status.active { color: #48bb78; }
        .model-card-status.inactive { color: #fc8181; }
        
        .model-card-link a {
          font-size: 0.7rem;
          color: #2fd4ff;
        }
        
        /* Analytics Tab */
        .analytics-tab {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        
        @media (max-width: 800px) {
          .analytics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        .analytics-card {
          background: rgba(0,0,0,0.35);
          border-radius: 16px;
          padding: 1rem;
          text-align: center;
        }
        
        .analytics-icon {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .analytics-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2fd4ff;
        }
        
        .analytics-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.6);
        }
        
        .insights-card {
          background: rgba(0,0,0,0.35);
          border-radius: 16px;
          padding: 1rem;
        }
        
        .insights-card h3 {
          font-size: 0.9rem;
          margin-bottom: 0.75rem;
        }
        
        .model-usage {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .usage-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
        }
        
        .usage-bar {
          flex: 1;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .usage-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c5fe6, #2fd4ff);
          border-radius: 3px;
        }
        
        .workflow-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin: 1rem 0;
        }
        
        .step {
          background: rgba(124,95,230,0.2);
          padding: 0.3rem 0.6rem;
          border-radius: 20px;
          font-size: 0.7rem;
        }
        
        .workflow-note {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
          text-align: center;
        }
        
        .stats-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          padding: 0.25rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .no-data {
          text-align: center;
          color: rgba(255,255,255,0.5);
          padding: 1rem;
        }
      `}</style>
    </div>
  );
};

export default AIAssistant;