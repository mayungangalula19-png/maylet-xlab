import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MessagesListScreen extends StatelessWidget {
  const MessagesListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(icon: const Icon(Icons.edit_square), onPressed: () {}),
        ],
      ),
      body: ListView(
        children: [
          _chatTile(context, 'Team Alpha', 'Are we ready for the pitch?', '10:42 AM', true),
          _chatTile(context, 'John Doe', 'Can you review the prototype?', 'Yesterday', false),
          _chatTile(context, 'Jane Smith (Investor)', 'I am interested in your project.', 'Monday', false),
        ],
      ),
    );
  }

  Widget _chatTile(BuildContext context, String name, String lastMessage, String time, bool unread) {
    return ListTile(
      leading: CircleAvatar(
        backgroundColor: Colors.blue.withValues(alpha: 0.1),
        child: Text(name[0], style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
      ),
      title: Text(name, style: TextStyle(fontWeight: unread ? FontWeight.bold : FontWeight.normal)),
      subtitle: Text(
        lastMessage,
        style: TextStyle(color: unread ? Theme.of(context).colorScheme.onSurface : Colors.grey, fontWeight: unread ? FontWeight.bold : FontWeight.normal),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Text(time, style: TextStyle(color: unread ? Colors.blue : Colors.grey, fontSize: 12)),
      onTap: () => context.push('/messages/chat'),
    );
  }
}
