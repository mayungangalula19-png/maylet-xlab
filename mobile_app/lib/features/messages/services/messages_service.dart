import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase_client.dart';

class Message {
  final String id;
  final String content;
  final String senderId;
  final String conversationId;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.content,
    required this.senderId,
    required this.conversationId,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      content: json['content'] ?? '',
      senderId: json['sender_id'],
      conversationId: json['conversation_id'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class Conversation {
  final String id;
  final String type;
  final String? title;
  final DateTime createdAt;
  final DateTime updatedAt;

  Conversation({
    required this.id,
    required this.type,
    this.title,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'],
      type: json['type'] ?? 'direct',
      title: json['title'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}

class MessagesService {
  final SupabaseClient _client = SupabaseConfig.client;

  Future<List<Conversation>> getConversations() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    try {
      final data = await _client
          .from('conversations')
          .select('*')
          .or('user1_id.eq.$userId,user2_id.eq.$userId')
          .order('updated_at', ascending: false);

      return (data as List).map((json) => Conversation.fromJson(json)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<Message>> getMessages(String conversationId) async {
    try {
      final data = await _client
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', ascending: true);

      return (data as List).map((json) => Message.fromJson(json)).toList();
    } catch (_) {
      return [];
    }
  }
}
