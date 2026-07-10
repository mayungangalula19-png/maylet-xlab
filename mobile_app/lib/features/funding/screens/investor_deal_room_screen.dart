import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:provider/provider.dart';
import '../../auth/services/auth_service.dart';

class InvestorDealRoomScreen extends StatefulWidget {
  const InvestorDealRoomScreen({super.key});

  @override
  State<InvestorDealRoomScreen> createState() => _InvestorDealRoomScreenState();
}

class _InvestorDealRoomScreenState extends State<InvestorDealRoomScreen> {
  bool _isLoading = true;
  List<dynamic> _pitches = [];
  String _error = '';

  @override
  void initState() {
    super.initState();
    _loadPitches();
  }

  Future<void> _loadPitches() async {
    try {
      setState(() {
        _isLoading = true;
        _error = '';
      });
      
      final res = await Supabase.instance.client
          .from('funding_pitches')
          .select('*')
          .eq('status', 'submitted')
          .order('created_at', ascending: false);
          
      // Fetch profiles manually
      final userIds = res.map((p) => p['user_id']).whereType<String>().toSet().toList();
      Map<String, String> userNames = {};
      if (userIds.isNotEmpty) {
        final profilesRes = await Supabase.instance.client
            .from('profiles')
            .select('id, full_name')
            .inFilter('id', userIds);
        for (var profile in profilesRes) {
          userNames[profile['id']] = profile['full_name'] ?? 'Unknown User';
        }
      }
      
      final pitchesWithProfiles = res.map((p) {
        final mutablePitch = Map<String, dynamic>.from(p);
        mutablePitch['profiles'] = {
          'full_name': userNames[p['user_id']] ?? 'Unknown User'
        };
        return mutablePitch;
      }).toList();
      
      if (mounted) {
        setState(() {
          _pitches = pitchesWithProfiles;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _requestAccess(dynamic pitch) async {
    final user = context.read<AuthService>().currentUser;
    if (user == null) return;
    
    try {
      await Supabase.instance.client.from('pitch_investor_applications').insert({
        'pitch_id': pitch['id'],
        'investor_id': user.id, // Assuming current user is registered as an investor
        'status': 'pending',
        'message': 'Requested access from Deal Room',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Access requested!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to request access: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: const Text('Investor Deal Room'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadPitches,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF3B82F6)]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Deal Flow Pipeline', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  SizedBox(height: 8),
                  Text('Review vetted startups, analyze cap tables, and securely manage your investments.', style: TextStyle(color: Colors.white70)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Active Deals', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                if (_isLoading) const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
              ],
            ),
            const SizedBox(height: 16),
            
            if (_error.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text('Error: $_error', style: const TextStyle(color: Colors.red)),
              )
            else if (!_isLoading && _pitches.isEmpty)
              const Padding(
                padding: EdgeInsets.all(32),
                child: Center(
                  child: Text('No active deals right now.', style: TextStyle(color: Colors.grey, fontSize: 16)),
                ),
              )
            else
              ..._pitches.map((pitch) => _dealCard(pitch)),
          ],
        ),
      ),
    );
  }

  Widget _dealCard(dynamic pitch) {
    final title = pitch['title'] ?? 'Unknown Pitch';
    final amount = pitch['amount'] ?? 0;
    final industry = pitch['industry'] ?? 'General';
    final desc = pitch['description'] ?? '';
    final creator = pitch['profiles'] != null ? pitch['profiles']['full_name'] : 'Unknown';

    return Card(
      color: const Color(0xFF1A1A2E),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.white.withOpacity(0.1))),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xFF2fd4ff).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.rocket_launch, color: Color(0xFF2fd4ff)),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text('By $creator', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text('\$${(amount as num).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2fd4ff))),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(desc, style: const TextStyle(color: Colors.white70, fontSize: 14), maxLines: 3, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFF7c5fe6).withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                  child: Text(industry, style: const TextStyle(color: Color(0xFF9b7ff0), fontSize: 12)),
                ),
                ElevatedButton(
                  onPressed: () => _requestAccess(pitch),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7c5fe6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                  ),
                  child: const Text('Request Access', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
