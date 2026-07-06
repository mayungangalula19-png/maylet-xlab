import 'package:flutter/material.dart';

class BillingScreen extends StatelessWidget {
  const BillingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Billing & Plans')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF6C3AED), Color(0xFF2563EB)]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Current Plan', style: TextStyle(color: Colors.white70)),
                const SizedBox(height: 8),
                const Text('Innovator Pro', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black),
                  child: const Text('Manage Subscription'),
                )
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text('Payment Methods', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          ListTile(
            leading: const Icon(Icons.credit_card),
            title: const Text('Visa ending in 4242'),
            subtitle: const Text('Expires 12/25'),
            trailing: TextButton(onPressed: () {}, child: const Text('Edit')),
          ),
          const Divider(),
          const Text('Billing History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 12),
          const ListTile(title: Text('May 2025'), trailing: Text('\$49.00')),
          const ListTile(title: Text('Apr 2025'), trailing: Text('\$49.00')),
          const ListTile(title: Text('Mar 2025'), trailing: Text('\$49.00')),
        ],
      ),
    );
  }
}
