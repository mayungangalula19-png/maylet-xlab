import 'package:flutter/material.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & Support')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const ListTile(
            leading: Icon(Icons.chat_bubble_outline),
            title: Text('Contact Support'),
            subtitle: Text('Talk to our team'),
            trailing: Icon(Icons.chevron_right),
          ),
          const Divider(),
          const ListTile(
            leading: Icon(Icons.article_outlined),
            title: Text('FAQs'),
            subtitle: Text('Find answers to common questions'),
            trailing: Icon(Icons.chevron_right),
          ),
          const Divider(),
          const ListTile(
            leading: Icon(Icons.bug_report_outlined),
            title: Text('Report a Bug'),
            trailing: Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }
}
