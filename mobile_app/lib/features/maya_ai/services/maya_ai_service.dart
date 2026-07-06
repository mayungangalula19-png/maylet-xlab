import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';
import '../models/ai_chat_models.dart';

class MayaAiService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<AiChatSession>> listSessions() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];
    final data = await _client
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', ascending: false);
    return (data as List<dynamic>)
        .map((e) => AiChatSession.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<AiChatSession> createSession({String title = 'New Conversation', String agentRole = 'chat'}) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated');
    final data = await _client.from('ai_chat_sessions').insert({
      'user_id': userId,
      'title': title,
    }).select().single();
    return AiChatSession.fromJson(data);
  }

  Future<List<AiChatMessage>> getMessages(String sessionId) async {
    final data = await _client
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', ascending: true);
    return (data as List<dynamic>)
        .map((e) => AiChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Save a message to the database
  Future<AiChatMessage> saveMessage({
    required String sessionId,
    required String role,
    required String content,
  }) async {
    final data = await _client.from('ai_chat_messages').insert({
      'session_id': sessionId,
      'role': role,
      'content': content,
    }).select().single();
    return AiChatMessage.fromJson(data);
  }

  /// Generates a smart AI response based on user message context.
  /// This simulates MAYA AI logic using keyword matching until a backend AI endpoint is connected.
  String generateMayaResponse(String userMessage, List<AiChatMessage> history) {
    final lower = userMessage.toLowerCase();

    if (lower.contains('project') || lower.contains('idea')) {
      return "Great innovation starts with a clear problem statement! I can help you structure your project — define the problem, target users, and success metrics. Would you like to start a new project outline?";
    } else if (lower.contains('funding') || lower.contains('pitch') || lower.contains('investor')) {
      return "Securing funding requires a compelling narrative. Key elements for your pitch deck:\n1. Problem & Solution\n2. Market Size (TAM/SAM/SOM)\n3. Business Model\n4. Traction & Metrics\n5. Team Credentials\n\nWould you like me to help you build any of these sections?";
    } else if (lower.contains('team') || lower.contains('collaborate')) {
      return "Building the right team is critical for innovation. I suggest defining clear roles: a technical lead, a market expert, and a business strategist. What skills does your current team have?";
    } else if (lower.contains('experiment') || lower.contains('test')) {
      return "Excellent! Every great innovation is validated through experiments. I recommend the Build-Measure-Learn loop:\n1. Define your hypothesis\n2. Build the smallest test\n3. Measure real outcomes\n4. Learn and iterate.\nWhat are you testing?";
    } else if (lower.contains('prototype') || lower.contains('build') || lower.contains('develop')) {
      return "Prototyping is where ideas come alive! Start with a low-fidelity mockup before investing in code. Focus on user flows, not features. What's the core problem your prototype solves?";
    } else if (lower.contains('hello') || lower.contains('hi') || lower.contains('hey')) {
      return "Hello! I'm MAYA — your Maylet XLab AI assistant. I can help you with innovation strategy, project planning, funding pitches, team building, and more. What would you like to explore today?";
    } else if (lower.contains('vault') || lower.contains('ip') || lower.contains('patent')) {
      return "Protecting your intellectual property is crucial! The Innovation Vault secures your ideas with cryptographic timestamps. This creates a verifiable proof of creation. Have you added your latest innovation to the Vault yet?";
    } else if (lower.contains('analytics') || lower.contains('metric') || lower.contains('data')) {
      return "Data drives decisions! Your analytics dashboard gives you a real-time view of all your innovation metrics. I suggest tracking: project velocity, experiment success rates, and funding progress weekly. What metrics matter most to you?";
    } else {
      return "I'm MAYA, your innovation intelligence layer. I can assist with projects, funding strategy, team dynamics, experiments, and protecting your IP. What challenge can I help you solve today?";
    }
  }

  Future<void> deleteSession(String sessionId) async {
    await _client.from('ai_chat_sessions').delete().eq('id', sessionId);
  }
}
