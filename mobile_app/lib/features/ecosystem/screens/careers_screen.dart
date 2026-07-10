import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../auth/services/auth_service.dart';
import 'package:go_router/go_router.dart';

class CareersScreen extends StatefulWidget {
  const CareersScreen({super.key});

  @override
  State<CareersScreen> createState() => _CareersScreenState();
}

class _CareersScreenState extends State<CareersScreen> {
  final _formKey = GlobalKey<FormState>();
  String _name = '';
  String _email = '';
  String _role = '';
  String _skills = '';
  String _portfolio = '';
  bool _isSubmitting = false;

  final List<Map<String, String>> _coreRoles = [
    {'title': 'Developers', 'icon': '💻', 'desc': 'Build and ship features across the Idea → Commercialization pipeline.', 'tag': 'Engineering'},
    {'title': 'AI Engineers (MAYA)', 'icon': '🤖', 'desc': 'Design prompts, agents, and intelligence layers that power MAYA.', 'tag': 'AI / MAYA'},
    {'title': 'Researchers', 'icon': '🔬', 'desc': 'Advance literature review, evidence models, and research workflows.', 'tag': 'Research'},
    {'title': 'Designers', 'icon': '🎨', 'desc': 'Craft product UX for innovators, teams, and ecosystem programs.', 'tag': 'Design'},
    {'title': 'Data Engineers', 'icon': '📊', 'desc': 'Pipeline analytics, scoring systems, and platform intelligence infrastructure.', 'tag': 'Data'},
    {'title': 'Innovation Fellows', 'icon': '🌱', 'desc': 'Bridge community, academy, and incubator programs with real builder outcomes.', 'tag': 'Ecosystem'},
  ];

  final List<Map<String, String>> _innovationRoles = [
    {'title': 'Research Contributors', 'icon': '📚', 'desc': 'Curate findings, documents, and research gates tied to active projects.'},
    {'title': 'Prototype Builders', 'icon': '📦', 'desc': 'Help teams iterate MVPs, uploads, and prototype testing workflows.'},
    {'title': 'Experiment Analysts', 'icon': '🧪', 'desc': 'Design and interpret structured experiments with measurable outcomes.'},
    {'title': 'Validation Reviewers', 'icon': '✅', 'desc': 'Evaluate readiness evidence and scoring before projects enter funding.'},
    {'title': 'Funding Analysts', 'icon': '💰', 'desc': 'Support pitch quality, investor matching, and capital readiness reviews.'},
  ];

  final ScrollController _scrollController = ScrollController();

  void _scrollToApply(String roleTitle) {
    setState(() => _role = roleTitle);
    _scrollController.animateTo(
      _scrollController.position.maxScrollExtent,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeOut,
    );
  }

  Future<void> _submitApplication() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();
    
    setState(() => _isSubmitting = true);
    final user = context.read<AuthService>().currentUser;
    
    try {
      await Supabase.instance.client.from('career_applications').insert({
        'user_id': user?.id,
        'full_name': _name,
        'email': _email,
        'role_interest': _role,
        'skills': _skills,
        'portfolio_link': _portfolio,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Application submitted successfully!')));
        _formKey.currentState!.reset();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: const Text('Careers'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        controller: _scrollController,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [const Color(0xFF7c5fe6).withOpacity(0.2), Colors.transparent],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: const Color(0xFF7c5fe6).withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                    child: const Text('🌟 Ecosystem Talent', style: TextStyle(color: Color(0xFF9b7ff0))),
                  ),
                  const SizedBox(height: 16),
                  const Text('Join Maylet XLab', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 12),
                  const Text('The innovation operating system needs builders, researchers, and analysts who want to turn ideas into funded, scalable ventures.', style: TextStyle(color: Colors.grey, fontSize: 16)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => _scrollToApply(''),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7c5fe6), padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12)),
                    child: const Text('Apply Now →', style: TextStyle(color: Colors.white, fontSize: 16)),
                  ),
                ],
              ),
            ),
            
            // Core Roles
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Core roles', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 8),
                  const Text('Full-time and contract paths across product, AI, design, data, and ecosystem programs.', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 16),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.8,
                    ),
                    itemCount: _coreRoles.length,
                    itemBuilder: (context, index) {
                      final role = _coreRoles[index];
                      return _buildRoleCard(role, true);
                    },
                  ),
                ],
              ),
            ),

            // Innovation Roles
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Innovation-specific roles', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 8),
                  const Text('Contribute at each stage of the Idea → Commercialization workflow.', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 16),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.85,
                    ),
                    itemCount: _innovationRoles.length,
                    itemBuilder: (context, index) {
                      final role = _innovationRoles[index];
                      return _buildRoleCard(role, false);
                    },
                  ),
                ],
              ),
            ),

            // Application Form
            Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1A1A2E),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Join the ecosystem', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 8),
                    const Text('Tell us about yourself. We review applications on a rolling basis.', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 24),
                    
                    TextFormField(
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Full name', labelStyle: TextStyle(color: Colors.grey)),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                      onSaved: (v) => _name = v!,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Email', labelStyle: TextStyle(color: Colors.grey)),
                      validator: (v) => v!.isEmpty || !v.contains('@') ? 'Valid email required' : null,
                      onSaved: (v) => _email = v!,
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: _role.isEmpty ? null : _role,
                      dropdownColor: const Color(0xFF1A1A2E),
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Role of interest', labelStyle: TextStyle(color: Colors.grey)),
                      items: [
                        ..._coreRoles.map((r) => DropdownMenuItem(value: r['title'], child: Text(r['title']!))),
                        ..._innovationRoles.map((r) => DropdownMenuItem(value: r['title'], child: Text(r['title']!))),
                      ],
                      onChanged: (v) => setState(() => _role = v!),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Skills (e.g. React, Python)', labelStyle: TextStyle(color: Colors.grey)),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                      onSaved: (v) => _skills = v!,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      style: const TextStyle(color: Colors.white),
                      decoration: const InputDecoration(labelText: 'Portfolio / LinkedIn', labelStyle: TextStyle(color: Colors.grey)),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                      onSaved: (v) => _portfolio = v!,
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submitApplication,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7c5fe6),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: _isSubmitting 
                            ? const CircularProgressIndicator(color: Colors.white) 
                            : const Text('Submit Application →', style: TextStyle(color: Colors.white, fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleCard(Map<String, String> role, bool isCore) {
    return InkWell(
      onTap: () => _scrollToApply(role['title']!),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1A1A2E),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(role['icon']!, style: const TextStyle(fontSize: 24)),
                const SizedBox(height: 8),
                Text(role['title']!, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14)),
                const SizedBox(height: 4),
                Text(role['desc']!, style: const TextStyle(color: Colors.grey, fontSize: 11), maxLines: 3, overflow: TextOverflow.ellipsis),
              ],
            ),
            if (isCore && role.containsKey('tag'))
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFF7c5fe6).withOpacity(0.2), borderRadius: BorderRadius.circular(8)),
                child: Text(role['tag']!, style: const TextStyle(color: Color(0xFF9b7ff0), fontSize: 10)),
              ),
          ],
        ),
      ),
    );
  }
}
