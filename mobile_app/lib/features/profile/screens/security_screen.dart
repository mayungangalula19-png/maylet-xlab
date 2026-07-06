import 'package:flutter/material.dart';

class SecurityScreen extends StatelessWidget {
  const SecurityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Security')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const ListTile(
            leading: Icon(Icons.password),
            title: Text('Change Password'),
            subtitle: Text('Last changed 3 months ago'),
            trailing: Icon(Icons.chevron_right),
          ),
          const Divider(),
          SwitchListTile(
            secondary: const Icon(Icons.security),
            title: const Text('Two-Factor Authentication'),
            subtitle: const Text('Add an extra layer of security'),
            value: false,
            onChanged: (val) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('2FA setup coming soon')));
            },
          ),
          const Divider(),
          const ListTile(
            leading: Icon(Icons.devices),
            title: Text('Active Sessions'),
            subtitle: Text('Manage devices logged into your account'),
            trailing: Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }
}
