import 'package:flutter/material.dart';
import '../services/admin_service.dart';
import 'package:intl/intl.dart';

class UsersManagementScreen extends StatefulWidget {
  const UsersManagementScreen({super.key});

  @override
  State<UsersManagementScreen> createState() => _UsersManagementScreenState();
}

class _UsersManagementScreenState extends State<UsersManagementScreen> {
  final AdminService _adminService = AdminService();
  bool _isLoading = true;
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _filteredUsers = [];

  String _searchQuery = '';
  String _filterRole = 'All';

  @override
  void initState() {
    super.initState();
    _loadUsers();
  }

  Future<void> _loadUsers() async {
    setState(() => _isLoading = true);
    try {
      final users = await _adminService.getUsers();
      if (mounted) {
        setState(() {
          _users = users;
          _applyFilters();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading users: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredUsers = _users.where((u) {
        final name = (u['full_name'] ?? '').toString().toLowerCase();
        final email = (u['email'] ?? '').toString().toLowerCase();
        final role = (u['role'] ?? '').toString().toLowerCase();

        final matchesSearch = name.contains(_searchQuery) || email.contains(_searchQuery);
        final matchesRole = _filterRole == 'All' || role == _filterRole.toLowerCase();

        return matchesSearch && matchesRole;
      }).toList();
    });
  }

  Future<void> _toggleStatus(Map<String, dynamic> user) async {
    final currentStatus = user['status'] ?? 'active';
    final newStatus = currentStatus == 'active' ? 'suspended' : 'active';
    
    try {
      await _adminService.updateUserStatus(user['id'], newStatus);
      setState(() {
        user['status'] = newStatus;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('User ${newStatus == 'active' ? 'activated' : 'suspended'}')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error updating status: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        title: const Text('Users Management', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF1A1A2E),
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh, color: Colors.white), onPressed: _loadUsers),
        ],
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF7c5fe6)))
                : _filteredUsers.isEmpty
                    ? const Center(child: Text('No users found.', style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filteredUsers.length,
                        itemBuilder: (context, index) {
                          final user = _filteredUsers[index];
                          return _buildUserCard(user);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      color: const Color(0xFF1A1A2E),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          TextField(
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search by name or email...',
              hintStyle: const TextStyle(color: Colors.grey),
              prefixIcon: const Icon(Icons.search, color: Colors.grey),
              filled: true,
              fillColor: Colors.white.withOpacity(0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            onChanged: (val) {
              _searchQuery = val.toLowerCase();
              _applyFilters();
            },
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: ['All', 'Admin', 'Innovator', 'Investor', 'Mentor'].map((role) {
                final isSelected = _filterRole == role;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(role),
                    selected: isSelected,
                    onSelected: (val) {
                      setState(() => _filterRole = role);
                      _applyFilters();
                    },
                    backgroundColor: Colors.white.withOpacity(0.05),
                    selectedColor: const Color(0xFF7c5fe6).withOpacity(0.3),
                    labelStyle: TextStyle(color: isSelected ? const Color(0xFF7c5fe6) : Colors.white),
                    checkmarkColor: const Color(0xFF7c5fe6),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUserCard(Map<String, dynamic> user) {
    final role = (user['role'] ?? 'user').toString();
    final status = (user['status'] ?? 'active').toString();
    final name = user['full_name'] ?? 'Unknown User';
    final email = user['email'] ?? 'No email';
    final plan = user['plan'] ?? 'free';
    final date = user['created_at'] != null ? DateFormat.yMMMd().format(DateTime.parse(user['created_at'])) : 'Unknown';

    return Card(
      color: const Color(0xFF1A1A2E),
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: Colors.white.withOpacity(0.05))),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  backgroundColor: _getRoleColor(role).withOpacity(0.2),
                  child: Text(name.toString().substring(0, 1).toUpperCase(), style: TextStyle(color: _getRoleColor(role), fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                      Text(email, style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
                      const SizedBox(height: 4),
                      Text('Joined $date', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, color: Colors.grey),
                  color: const Color(0xFF1A1A2E),
                  onSelected: (val) {
                    if (val == 'toggle_status') _toggleStatus(user);
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: 'toggle_status',
                      child: Text(
                        status == 'active' ? 'Suspend User' : 'Activate User',
                        style: TextStyle(color: status == 'active' ? Colors.red : Colors.green),
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'edit_role',
                      child: Text('Change Role', style: TextStyle(color: Colors.white)),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _badge(role.toUpperCase(), _getRoleColor(role)),
                _badge(plan.toUpperCase(), plan == 'enterprise' ? Colors.purple : Colors.blue),
                _badge(status.toUpperCase(), status == 'active' ? Colors.green : Colors.red),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(text, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color)),
    );
  }

  Color _getRoleColor(String role) {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'super_admin':
        return Colors.red;
      case 'innovator':
        return const Color(0xFF7c5fe6);
      case 'investor':
        return Colors.green;
      case 'mentor':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}
