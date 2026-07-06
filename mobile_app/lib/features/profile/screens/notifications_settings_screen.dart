import 'package:flutter/material.dart';

class NotificationsSettingsScreen extends StatefulWidget {
  const NotificationsSettingsScreen({super.key});

  @override
  State<NotificationsSettingsScreen> createState() => _NotificationsSettingsScreenState();
}

class _NotificationsSettingsScreenState extends State<NotificationsSettingsScreen> {
  bool push = true;
  bool email = true;
  bool marketing = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SwitchListTile(
            title: const Text('Push Notifications'),
            subtitle: const Text('Receive alerts on your device'),
            value: push,
            onChanged: (v) => setState(() => push = v),
          ),
          const Divider(),
          SwitchListTile(
            title: const Text('Email Notifications'),
            subtitle: const Text('Receive updates in your inbox'),
            value: email,
            onChanged: (v) => setState(() => email = v),
          ),
          const Divider(),
          SwitchListTile(
            title: const Text('Marketing & Offers'),
            subtitle: const Text('Occasional promotional emails'),
            value: marketing,
            onChanged: (v) => setState(() => marketing = v),
          ),
        ],
      ),
    );
  }
}
