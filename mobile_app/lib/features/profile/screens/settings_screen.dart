import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    
    return Scaffold(
      appBar: AppBar(title: const Text('App Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SwitchListTile(
            title: const Text('Dark Mode'),
            subtitle: const Text('Toggle app appearance'),
            value: themeProvider.isDark,
            onChanged: (v) => themeProvider.toggleTheme(),
          ),
          const Divider(),
          const ListTile(
            title: Text('Language'),
            subtitle: Text('English (US)'),
            trailing: Icon(Icons.language),
          ),
          const Divider(),
          const ListTile(
            title: Text('App Version'),
            subtitle: Text('1.0.0 (Build 42)'),
          ),
        ],
      ),
    );
  }
}
