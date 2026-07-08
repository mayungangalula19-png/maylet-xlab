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
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(icon: const Icon(Icons.edit_square), onPressed: () {}),
        ],
      ),
      body: FutureBuilder<List<Conversation>>(
        future: _conversationsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final conversations = snapshot.data ?? [];
          if (conversations.isEmpty) {
            return const Center(child: Text('No conversations yet.', style: TextStyle(color: Colors.grey)));
          }
          
          return ListView.builder(
            itemCount: conversations.length,
            itemBuilder: (context, index) {
              final conv = conversations[index];
              return _chatTile(
                context, 
                conv.title ?? (conv.type == 'direct' ? 'Direct Message' : 'Project Chat'), 
                'Tap to view messages...', 
                'Active', 
                false,
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
      leading: CircleAvatar(
        backgroundColor: Colors.blue.withValues(alpha: 0.1),
        child: Text(name.isNotEmpty ? name[0] : 'C', style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
      ),
      title: Text(name, style: TextStyle(fontWeight: unread ? FontWeight.bold : FontWeight.normal)),
      subtitle: Text(
        lastMessage,
        style: TextStyle(color: unread ? Theme.of(context).colorScheme.onSurface : Colors.grey, fontWeight: unread ? FontWeight.bold : FontWeight.normal),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Text(time, style: TextStyle(color: unread ? Colors.blue : Colors.grey, fontSize: 12)),
      onTap: () => context.push('/messages/chat', extra: conversationId),
    );
  }
}

