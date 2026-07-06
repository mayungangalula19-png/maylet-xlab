import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/ai_chat_models.dart';
import '../services/maya_ai_service.dart';

class MayaAiScreen extends StatefulWidget {
  const MayaAiScreen({super.key});

  @override
  State<MayaAiScreen> createState() => _MayaAiScreenState();
}

class _MayaAiScreenState extends State<MayaAiScreen> with TickerProviderStateMixin {
  late MayaAiService _service;
  AiChatSession? _currentSession;
  final List<AiChatMessage> _messages = [];
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;
  bool _isMayaTyping = false;
  List<AiChatSession> _sessions = [];
  bool _showSessions = false;

  @override
  void initState() {
    super.initState();
    _service = context.read<MayaAiService>();
    _loadSessions();
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadSessions() async {
    try {
      final sessions = await _service.listSessions();
      if (mounted) {
        setState(() => _sessions = sessions);
        if (sessions.isNotEmpty && _currentSession == null) {
          _openSession(sessions.first);
        }
      }
    } catch (_) {}
  }

  Future<void> _openSession(AiChatSession session) async {
    setState(() {
      _currentSession = session;
      _messages.clear();
      _isLoading = true;
      _showSessions = false;
    });
    try {
      final msgs = await _service.getMessages(session.id);
      if (mounted) {
        setState(() {
          _messages.addAll(msgs);
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _startNewSession() async {
    try {
      final session = await _service.createSession();
      if (mounted) {
        setState(() {
          _sessions.insert(0, session);
          _currentSession = session;
          _messages.clear();
          _showSessions = false;
        });
        // Show greeting
        _addLocalMessage(
          role: 'assistant',
          content: "Hello! I'm MAYA — your Maylet XLab AI innovation assistant. I'm here to help you with project strategy, funding pitches, team building, experiments, and protecting your IP. What would you like to explore today?",
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _addLocalMessage({required String role, required String content}) {
    final msg = AiChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      sessionId: _currentSession?.id ?? '',
      role: role,
      content: content,
      createdAt: DateTime.now(),
    );
    setState(() => _messages.add(msg));
    _scrollToBottom();
  }

  Future<void> _sendMessage() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _currentSession == null) return;

    _inputController.clear();

    // Save user message to DB and display locally
    try {
      await _service.saveMessage(
        sessionId: _currentSession!.id,
        role: 'user',
        content: text,
      );
    } catch (_) {}

    _addLocalMessage(role: 'user', content: text);

    // Show MAYA typing indicator
    setState(() => _isMayaTyping = true);
    _scrollToBottom();

    // Simulate processing delay for natural feel
    await Future.delayed(const Duration(milliseconds: 1200));

    if (!mounted) return;

    final response = _service.generateMayaResponse(text, _messages);

    // Save AI response to DB
    try {
      await _service.saveMessage(
        sessionId: _currentSession!.id,
        role: 'assistant',
        content: response,
      );
    } catch (_) {}

    setState(() => _isMayaTyping = false);
    _addLocalMessage(role: 'assistant', content: response);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [Colors.blue.shade400, Colors.purple.shade400],
                ),
              ),
              child: const Icon(Icons.smart_toy, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('MAYA AI', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text(
                  _currentSession?.title ?? 'Select a conversation',
                  style: TextStyle(fontSize: 11, color: scheme.onSurface.withValues(alpha: 0.6)),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(_showSessions ? Icons.close : Icons.history),
            onPressed: () => setState(() => _showSessions = !_showSessions),
            tooltip: 'Chat history',
          ),
          IconButton(
            icon: const Icon(Icons.add_comment_outlined),
            onPressed: _startNewSession,
            tooltip: 'New chat',
          ),
        ],
      ),
      body: Column(
        children: [
          // Session history panel
          if (_showSessions) _buildSessionsPanel(scheme, isDark),

          // Welcome / empty state
          if (_currentSession == null && !_showSessions)
            Expanded(child: _buildWelcomeState(scheme))
          else if (!_showSessions)
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _buildMessageList(scheme, isDark),
            ),

          // Input bar
          if (_currentSession != null && !_showSessions)
            _buildInputBar(scheme, isDark),
        ],
      ),
    );
  }

  Widget _buildWelcomeState(ColorScheme scheme) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header section
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 16),
                    Text(
                      'Your AI partner for\nideas, analysis &\nsmart solutions.',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: scheme.onSurface,
                        height: 1.2,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [const Color(0xFF6C3AED).withValues(alpha: 0.2), Colors.transparent],
                  ),
                ),
                child: const Center(
                  child: Icon(Icons.smart_toy, size: 64, color: Color(0xFF6C3AED)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // What can AI do for you?
          const Text('What can AI do for you?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.5,
            children: [
              _aiFeatureCard(Icons.lightbulb_outline, 'Analyze Ideas', 'Get AI insights', const Color(0xFFD97706), isDark, scheme),
              _aiFeatureCard(Icons.article_outlined, 'Summarize', 'Documents', const Color(0xFF2563EB), isDark, scheme),
              _aiFeatureCard(Icons.trending_up, 'Suggest', 'Next Steps', const Color(0xFF059669), isDark, scheme),
              _aiFeatureCard(Icons.security, 'Risk Analysis', '& Validation', const Color(0xFFDB2777), isDark, scheme),
            ],
          ),
          const SizedBox(height: 32),

          // Recent Insights
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('AI Recent Insights', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Text('See all', style: TextStyle(color: const Color(0xFF6C3AED), fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 12),
          _insightCard(
            icon: Icons.auto_awesome, iconColor: const Color(0xFF6C3AED),
            text: 'Your idea "AI-Powered Farm" has High Impact Potential. 🚀',
            time: '2 min ago', isDark: isDark, scheme: scheme
          ),
          _insightCard(
            icon: Icons.insights, iconColor: const Color(0xFF059669),
            text: 'Market demand for "Smart Health Assistant" is Growing. 📈',
            time: '1 hour ago', isDark: isDark, scheme: scheme
          ),
          _insightCard(
            icon: Icons.monetization_on_outlined, iconColor: const Color(0xFFD97706),
            text: 'Suggested next step: Prototype Validation.',
            time: '3 hours ago', isDark: isDark, scheme: scheme
          ),

          const SizedBox(height: 40),
          
          // Ask AI Anything Button
          GestureDetector(
            onTap: _startNewSession,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6C3AED), Color(0xFF2563EB)],
                ),
                borderRadius: BorderRadius.circular(30),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.auto_awesome, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Text('Ask AI Anything', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  SizedBox(width: 80),
                  Icon(Icons.arrow_forward, color: Colors.white, size: 20),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _aiFeatureCard(IconData icon, String title, String subtitle, Color color, bool isDark, ColorScheme scheme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131829) : scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11), overflow: TextOverflow.ellipsis),
                Text(subtitle, style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.6), fontSize: 9), overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _insightCard({required IconData icon, required Color iconColor, required String text, required String time, required bool isDark, required ColorScheme scheme}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131829) : scheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: scheme.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
          ),
          Text(time, style: TextStyle(color: scheme.onSurface.withValues(alpha: 0.5), fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildSessionsPanel(ColorScheme scheme, bool isDark) {
    return Container(
      height: 250,
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(bottom: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.3))),
      ),
      child: _sessions.isEmpty
          ? const Center(child: Text('No conversations yet', style: TextStyle(color: Colors.grey)))
          : ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 4),
              itemCount: _sessions.length,
              itemBuilder: (context, index) {
                final session = _sessions[index];
                final isActive = _currentSession?.id == session.id;
                return ListTile(
                  leading: CircleAvatar(
                    radius: 18,
                    backgroundColor: isActive ? Colors.blue : scheme.surfaceContainerHighest,
                    child: Icon(Icons.chat_bubble_outline, size: 16, color: isActive ? Colors.white : Colors.grey),
                  ),
                  title: Text(session.title, overflow: TextOverflow.ellipsis),
                  subtitle: Text(session.agentRole.toUpperCase(), style: const TextStyle(fontSize: 11)),
                  selected: isActive,
                  selectedTileColor: Colors.blue.withValues(alpha: 0.08),
                  onTap: () => _openSession(session),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline, size: 18, color: Colors.grey),
                    onPressed: () async {
                      await _service.deleteSession(session.id);
                      setState(() {
                        _sessions.removeAt(index);
                        if (_currentSession?.id == session.id) {
                          _currentSession = null;
                          _messages.clear();
                        }
                      });
                    },
                  ),
                );
              },
            ),
    );
  }

  Widget _buildMessageList(ColorScheme scheme, bool isDark) {
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: _messages.length + (_isMayaTyping ? 1 : 0),
      itemBuilder: (context, index) {
        if (_isMayaTyping && index == _messages.length) {
          return _buildTypingIndicator(scheme);
        }
        final msg = _messages[index];
        final isUser = msg.role == 'user';
        return _buildMessageBubble(msg, isUser, scheme, isDark);
      },
    );
  }

  Widget _buildMessageBubble(AiChatMessage msg, bool isUser, ColorScheme scheme, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 32,
              height: 32,
              margin: const EdgeInsets.only(right: 8, top: 2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [Colors.blue.shade400, Colors.purple.shade400],
                ),
              ),
              child: const Icon(Icons.smart_toy, color: Colors.white, size: 16),
            ),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isUser
                    ? Colors.blue
                    : isDark
                        ? scheme.surfaceContainerHighest
                        : scheme.surfaceContainerLow,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(18),
                  topRight: const Radius.circular(18),
                  bottomLeft: Radius.circular(isUser ? 18 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 18),
                ),
                boxShadow: [
                  BoxShadow(
                    color: scheme.shadow.withValues(alpha: 0.06),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                msg.content,
                style: TextStyle(
                  color: isUser ? Colors.white : scheme.onSurface,
                  fontSize: 14.5,
                  height: 1.5,
                ),
              ),
            ),
          ),
          if (isUser) const SizedBox(width: 8),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator(ColorScheme scheme) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            margin: const EdgeInsets.only(right: 8),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(colors: [Colors.blue.shade400, Colors.purple.shade400]),
            ),
            child: const Icon(Icons.smart_toy, color: Colors.white, size: 16),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18), topRight: Radius.circular(18),
                bottomLeft: Radius.circular(4), bottomRight: Radius.circular(18),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(0),
                const SizedBox(width: 4),
                _buildDot(1),
                const SizedBox(width: 4),
                _buildDot(2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(int index) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.4, end: 1.0),
      duration: Duration(milliseconds: 400 + index * 150),
      builder: (_, value, child) => Opacity(
        opacity: value,
        child: Container(
          width: 8, height: 8,
          decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.grey),
        ),
      ),
      onEnd: () => setState(() {}),
    );
  }

  Widget _buildInputBar(ColorScheme scheme, bool isDark) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
        decoration: BoxDecoration(
          color: scheme.surface,
          border: Border(top: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.3))),
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _inputController,
                maxLines: 4,
                minLines: 1,
                decoration: InputDecoration(
                  hintText: 'Ask MAYA anything...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: isDark ? scheme.surfaceContainerHighest : scheme.surfaceContainerLow,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF7C3AED)],
                ),
              ),
              child: IconButton(
                icon: const Icon(Icons.send_rounded, color: Colors.white),
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
