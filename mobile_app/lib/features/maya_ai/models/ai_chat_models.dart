class AiChatSession {
  final String id;
  final String userId;
  final String? projectId;
  final String title;
  final String agentRole;
  final DateTime createdAt;

  AiChatSession({
    required this.id,
    required this.userId,
    this.projectId,
    required this.title,
    required this.agentRole,
    required this.createdAt,
  });

  factory AiChatSession.fromJson(Map<String, dynamic> json) {
    return AiChatSession(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      projectId: json['project_id'] as String?,
      title: json['title'] as String? ?? 'New conversation',
      agentRole: json['agent_role'] as String? ?? 'chat',
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}

class AiChatMessage {
  final String id;
  final String sessionId;
  final String role; // 'user' | 'assistant' | 'system'
  final String content;
  final DateTime createdAt;

  AiChatMessage({
    required this.id,
    required this.sessionId,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  factory AiChatMessage.fromJson(Map<String, dynamic> json) {
    return AiChatMessage(
      id: json['id'] as String,
      sessionId: json['session_id'] as String,
      role: json['role'] as String,
      content: json['content'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
