import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class MarketingDashboardScreen extends StatefulWidget {
  const MarketingDashboardScreen({super.key});

  @override
  State<MarketingDashboardScreen> createState() => _MarketingDashboardScreenState();
}

class _MarketingDashboardScreenState extends State<MarketingDashboardScreen> {
  final _formKey = GlobalKey<FormState>();
  String _email = '';
  String _organization = '';
  String _role = 'Innovation Manager';
  bool _isEnterprise = false;
  bool _isLoading = false;
  bool _isSuccess = false;

  final List<String> _roles = [
    'Enterprise Admin',
    'Director',
    'Innovation Manager',
    'Research Lead',
    'Engineer',
    'Investor / Partner',
  ];

  Future<void> _subscribe() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() => _isLoading = true);
    
    try {
      await Supabase.instance.client.from('newsletter_subscribers').insert({
        'email': _email,
        'organization': _isEnterprise ? _organization : null,
        'role': _isEnterprise ? _role : null,
        'source': _isEnterprise ? 'enterprise_mobile' : 'mobile_app',
        'subscribed_at': DateTime.now().toIso8601String(),
      });
      
      if (mounted) {
        setState(() {
          _isSuccess = true;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Subscription failed: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSuccess) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A0A0F),
        appBar: AppBar(title: const Text('Newsletter'), backgroundColor: Colors.transparent, elevation: 0),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 64),
                const SizedBox(height: 24),
                const Text("You're subscribed!", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                const SizedBox(height: 12),
                Text(
                  _isEnterprise 
                      ? 'Your organization is on the enterprise innovation briefing list. Check your inbox for onboarding and vault setup tips.'
                      : 'Thanks for joining. Check your inbox for a welcome note and your first insights.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.grey, fontSize: 16),
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () => setState(() { _isSuccess = false; _email = ''; }),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6), padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
                  child: const Text('Subscribe another', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(title: const Text('Newsletter'), backgroundColor: Colors.transparent, elevation: 0),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(color: const Color(0xFF7c5fe6).withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
              child: Text(
                _isEnterprise ? 'Maylet X Lab · Enterprise' : 'Maylet X Lab Newsletter',
                style: const TextStyle(color: Color(0xFF9b7ff0)),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _isEnterprise ? 'Enterprise innovation briefing' : 'Innovation insights for serious builders',
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 12),
            Text(
              _isEnterprise 
                  ? 'Executive pipeline intelligence, validation playbooks, funding signals, and MAYA prompts for innovation leaders.'
                  : 'Weekly Maylet X Lab updates on research, validation, funding, and product releases. Unsubscribe anytime.',
              style: const TextStyle(color: Colors.grey, fontSize: 16),
            ),
            const SizedBox(height: 32),
            
            Row(
              children: [
                Switch(
                  value: _isEnterprise,
                  onChanged: (v) => setState(() => _isEnterprise = v),
                  activeColor: const Color(0xFF7c5fe6),
                ),
                const SizedBox(width: 8),
                const Text('Enterprise Mode', style: TextStyle(color: Colors.white)),
              ],
            ),
            const SizedBox(height: 24),

            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_isEnterprise) ...[
                    const Text('Organization name', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 8),
                    TextFormField(
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        hintText: 'Acme Innovation Labs',
                        hintStyle: const TextStyle(color: Colors.grey),
                      ),
                      onSaved: (v) => _organization = v ?? '',
                    ),
                    const SizedBox(height: 16),
                    const Text('Your role', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _role,
                      dropdownColor: const Color(0xFF1A1A2E),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.05),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      items: _roles.map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                      onChanged: (v) => setState(() => _role = v!),
                    ),
                    const SizedBox(height: 16),
                  ],

                  Text(_isEnterprise ? 'Work email (organization)' : 'Email address', style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 8),
                  TextFormField(
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.05),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      hintText: _isEnterprise ? 'innovation@yourcompany.com' : 'you@company.com',
                      hintStyle: const TextStyle(color: Colors.grey),
                    ),
                    validator: (v) => v!.isEmpty || !v.contains('@') ? 'Valid email required' : null,
                    onSaved: (v) => _email = v!,
                  ),
                  const SizedBox(height: 32),
                  
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _subscribe,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF7c5fe6),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(
                              _isEnterprise ? 'Join enterprise briefing' : 'Join Newsletter',
                              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
