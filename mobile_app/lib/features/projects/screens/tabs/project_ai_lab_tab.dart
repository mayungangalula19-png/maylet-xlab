import 'package:flutter/material.dart';

class ProjectAILabTab extends StatefulWidget {
  final String projectId;
  final String projectName;

  const ProjectAILabTab({super.key, required this.projectId, required this.projectName});

  @override
  State<ProjectAILabTab> createState() => _ProjectAILabTabState();
}

class _ProjectAILabTabState extends State<ProjectAILabTab> {
  Map<String, dynamic>? _analysis;
  bool _running = false;
  bool _asking = false;
  final _questionController = TextEditingController();
  String? _aiResponse;

  @override
  void initState() {
    super.initState();
    // Simulate finding an existing analysis
    _analysis = {
      'score': 85,
      'risk_level': 'low',
      'market_fit': 78,
      'recommendations': [
        'Focus on user experience improvements',
        'Consider adding more automation features',
        'Expand your target market to include SMEs',
      ],
      'competitor_analysis': 'Your main competitors are FarmConnect (35% market share) and AgriTech Solutions (28% market share). Your advantage is lower pricing and mobile-first approach.'
    };
  }

  Future<void> _runNewAnalysis() async {
    setState(() => _running = true);
    await Future.delayed(const Duration(seconds: 2));
    setState(() {
      _analysis = {
        'score': 92,
        'risk_level': 'medium',
        'market_fit': 85,
        'recommendations': [
          'Strong market signals detected',
          'Optimize cloud costs before scaling',
          'Consider freemium model for quick acquisition',
          'Integrate with existing enterprise systems'
        ],
        'competitor_analysis': 'New competitors emerging in the APAC region. Double down on your core differentiator (AI insights) to maintain moat.'
      };
      _running = false;
    });
  }

  Future<void> _askAI() async {
    if (_questionController.text.isEmpty) return;
    setState(() => _asking = true);
    await Future.delayed(const Duration(seconds: 2));
    setState(() {
      _aiResponse = 'Based on my analysis of "${widget.projectName}", here is what I found:\n\n1. Market opportunity is strong\n2. Your pricing strategy is competitive\n3. Consider adding offline capabilities\n4. Project feasibility is high\n\nWould you like me to dive deeper?';
      _asking = false;
    });
  }

  Color _getRiskColor(String level) {
    switch(level) {
      case 'low': return Colors.green;
      case 'medium': return Colors.orange;
      case 'high': return Colors.red;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('AI Innovation Lab', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
              ElevatedButton.icon(
                onPressed: _running ? null : _runNewAnalysis,
                icon: _running ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.science, size: 18),
                label: Text(_running ? 'Analyzing...' : 'Run Analysis'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7c5fe6),
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          
          if (_analysis != null) ...[
            // Scores Row
            Row(
              children: [
                Expanded(child: _buildScoreCard('Feasibility', '${_analysis!['score']}/100', const Color(0xFF7c5fe6))),
                const SizedBox(width: 12),
                Expanded(child: _buildScoreCard('Risk Level', _analysis!['risk_level'].toString().toUpperCase(), _getRiskColor(_analysis!['risk_level']))),
                const SizedBox(width: 12),
                Expanded(child: _buildScoreCard('Market Fit', '${_analysis!['market_fit']}%', const Color(0xFF2fd4ff))),
              ],
            ),
            const SizedBox(height: 24),
            
            // Recommendations
            _buildInfoCard('🤖 AI Recommendations', Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: (_analysis!['recommendations'] as List).map((rec) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('💡 ', style: TextStyle(fontSize: 16)),
                    Expanded(child: Text(rec, style: const TextStyle(color: Colors.white70, height: 1.4))),
                  ],
                ),
              )).toList(),
            )),
            
            // Competitor Analysis
            _buildInfoCard('📊 Competitor Analysis', Text(_analysis!['competitor_analysis'], style: const TextStyle(color: Colors.white70, height: 1.5))),
            
            // Chat
            _buildInfoCard('💬 Ask AI Assistant', Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: _questionController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Ask anything about your project...',
                    hintStyle: const TextStyle(color: Colors.grey),
                    filled: true,
                    fillColor: const Color(0xFF1A1A2E),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 12),
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton(
                    onPressed: _asking ? null : _askAI,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6)),
                    child: _asking ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Text('Ask AI →', style: TextStyle(color: Colors.white)),
                  ),
                ),
                if (_aiResponse != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF7c5fe6).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF7c5fe6).withOpacity(0.3)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.auto_awesome, color: Color(0xFF7c5fe6), size: 16),
                            SizedBox(width: 8),
                            Text('MAYA AI', style: TextStyle(color: Color(0xFF7c5fe6), fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(_aiResponse!, style: const TextStyle(color: Colors.white, height: 1.5)),
                      ],
                    ),
                  ),
                ]
              ],
            )),
          ] else
            const Center(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: Column(
                  children: [
                    Icon(Icons.science, size: 64, color: Colors.grey),
                    SizedBox(height: 16),
                    Text('No analysis yet. Run AI analysis to get insights.', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            ),
            
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildScoreCard(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String title, Widget content) {
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 16),
          content,
        ],
      ),
    );
  }
}
