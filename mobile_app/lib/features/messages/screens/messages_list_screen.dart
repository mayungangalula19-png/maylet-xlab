import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/messages_service.dart';
import 'package:provider/provider.dart';

class MessagesListScreen extends StatefulWidget {
  const MessagesListScreen({super.key});

  @override
  State<MessagesListScreen> createState() => _MessagesListScreenState();
}

class _MessagesListScreenState extends State<MessagesListScreen> {
  late Future<List<Conversation>> _conversationsFuture;

  @override
  void initState() {
    super.initState();
    _conversationsFuture = context.read<MessagesService>().getConversations();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: const Text('Messages'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_square, color: Color(0xFF7c5fe6)),
            onPressed: () {},
          ),
        ],
      ),
      body: FutureBuilder<List<Conversation>>(
        future: _conversationsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6)));
          }
          final conversations = snapshot.data ?? [];
          if (conversations.isEmpty) {
            return const Center(
              child: Text('No conversations yet.', style: TextStyle(color: Colors.grey, fontSize: 16)),
            );
          }
          
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: conversations.length,
            separatorBuilder: (context, index) => const Divider(color: Colors.white12),
            itemBuilder: (context, index) {
              final conv = conversations[index];
              return _chatTile(
                context, 
                conv.title ?? (conv.type == 'direct' ? 'Direct Message' : 'Project Chat'), 
                'Tap to view messages...', 
                'Active', 
                false, // Assume false for now as we don't track unread locally easily without joining messages
                conv.id
              );
            },
          );
        },
      ),
    );
  }

  Widget _chatTile(BuildContext context, String name, String lastMessage, String time, bool unread, String conversationId) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: const Color(0xFF7c5fe6).withOpacity(0.2),
        radius: 24,
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'C', 
          style: const TextStyle(color: Color(0xFF9b7ff0), fontWeight: FontWeight.bold, fontSize: 20)
        ),
      ),
      title: Text(
        name, 
        style: TextStyle(fontWeight: unread ? FontWeight.bold : FontWeight.w600, color: Colors.white)
      ),
      subtitle: Text(
        lastMessage,
        style: TextStyle(color: unread ? Colors.white : Colors.grey, fontWeight: unread ? FontWeight.bold : FontWeight.normal),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(time, style: TextStyle(color: unread ? const Color(0xFF2fd4ff) : Colors.grey, fontSize: 12)),
          if (unread) ...[
            const SizedBox(height: 4),
            Container(
              width: 10,
              height: 10,
              decoration: const BoxDecoration(
                color: Color(0xFF2fd4ff),
                shape: BoxShape.circle,
              ),
            ),
          ]
        ],
      ),
      onTap: () => context.push('/messages/chat', extra: conversationId),
    );
  }
}
