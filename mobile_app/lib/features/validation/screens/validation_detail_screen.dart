import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../models/validation_record.dart';
import '../services/validation_service.dart';

class ValidationDetailScreen extends StatefulWidget {
  final String validationId;

  const ValidationDetailScreen({super.key, required this.validationId});

  @override
  State<ValidationDetailScreen> createState() => _ValidationDetailScreenState();
}

class _ValidationDetailScreenState extends State<ValidationDetailScreen> {
  late Future<ValidationRecord> _validationFuture;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() {
    _validationFuture = context.read<ValidationService>().getValidation(widget.validationId);
  }

  Color _decisionColor(String decision) {
    switch (decision) {
      case 'pass': return Colors.green;
      case 'hold': return Colors.orange;
      case 'fail': return Colors.red;
      default: return Colors.blue;
    }
  }

  Color _scoreColor(int score) {
    if (score < 50) return Colors.red;
    if (score < 80) return Colors.orange;
    return Colors.green;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0F),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: FutureBuilder<ValidationRecord>(
          future: _validationFuture,
          builder: (context, snapshot) {
            if (snapshot.hasData) {
              final rec = snapshot.data!;
              return Row(
                children: [
                  Expanded(
                    child: Text(
                      rec.projectName ?? 'Validation Review',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.only(left: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _decisionColor(rec.decision).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _decisionColor(rec.decision).withValues(alpha: 0.5)),
                    ),
                    child: Text(
                      rec.decision.toUpperCase(),
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _decisionColor(rec.decision)),
                    ),
                  ),
                ],
              );
            }
            return const Text('Loading...', style: TextStyle(color: Colors.white));
          },
        ),
      ),
      body: FutureBuilder<ValidationRecord>(
        future: _validationFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF2fd4ff)));
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
          } else if (!snapshot.hasData) {
            return const Center(child: Text('Validation record not found', style: TextStyle(color: Colors.grey)));
          }

          final record = snapshot.data!;
          return RefreshIndicator(
            onRefresh: () async { setState(() { _load(); }); },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildScorePanel(record.scores),
                const SizedBox(height: 16),
                _buildEvidencePanel(record.evidence),
                const SizedBox(height: 16),
                _buildDecisionPanel(record),
                const SizedBox(height: 16),
                _buildFundingReadinessPanel(record),
                const SizedBox(height: 40),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildScorePanel(ValidationScores scores) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Validation Scores', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildScoreCircle('Overall', scores.overall, 32),
              _buildScoreCircle('Market', scores.market, 20),
              _buildScoreCircle('Tech', scores.technical, 20),
              _buildScoreCircle('Finance', scores.financial, 20),
              _buildScoreCircle('Team', scores.team, 20),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildScoreCircle(String label, int score, double radius) {
    final color = _scoreColor(score);
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: radius * 2,
              height: radius * 2,
              child: CircularProgressIndicator(
                value: score / 100,
                backgroundColor: color.withValues(alpha: 0.1),
                valueColor: AlwaysStoppedAnimation<Color>(color),
                strokeWidth: radius > 25 ? 6 : 4,
              ),
            ),
            Text(score.toString(), style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: radius > 25 ? 20 : 14)),
          ],
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
      ],
    );
  }

  Widget _buildEvidencePanel(ValidationEvidence evidence) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Required Evidence', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _evidenceRow('Market Research Data', evidence.marketResearch),
          _evidenceRow('Technical Feasibility Proof', evidence.technicalFeasibility),
          _evidenceRow('Financial Projections', evidence.financialProjections),
          _evidenceRow('Team Capability Assessment', evidence.teamCapabilities),
          _evidenceRow('User Testing / Feedback', evidence.userFeedback),
        ],
      ),
    );
  }

  Widget _evidenceRow(String label, bool isProvided) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(isProvided ? Icons.check_circle : Icons.radio_button_unchecked, color: isProvided ? Colors.green : Colors.grey, size: 20),
          const SizedBox(width: 12),
          Text(label, style: TextStyle(color: isProvided ? Colors.white : Colors.grey, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildDecisionPanel(ValidationRecord record) {
    final isLocked = record.promotedAt != null;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Committee Decision', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              if (isLocked) const Icon(Icons.lock, color: Colors.grey, size: 16),
            ],
          ),
          const SizedBox(height: 16),
          
          DropdownButtonFormField<String>(
            initialValue: record.decision,
            dropdownColor: const Color(0xFF2A2A3E),
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Verdict',
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
            items: const [
              DropdownMenuItem(value: 'pending', child: Text('Pending Review')),
              DropdownMenuItem(value: 'hold', child: Text('Hold (Needs Work)')),
              DropdownMenuItem(value: 'pass', child: Text('Pass (Approved)')),
              DropdownMenuItem(value: 'fail', child: Text('Fail (Rejected)')),
            ],
            onChanged: isLocked ? null : (val) {}, // State updates omitted for brevity
          ),
          const SizedBox(height: 16),
          TextField(
            controller: TextEditingController(text: record.reviewerNotes),
            enabled: !isLocked,
            maxLines: 4,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Reviewer Notes',
              filled: true,
              fillColor: Colors.white.withValues(alpha: 0.05),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFundingReadinessPanel(ValidationRecord record) {
    final isPass = record.decision == 'pass';
    final isPromoted = record.promotedAt != null;
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPass ? [const Color(0xFF0F766E), const Color(0xFF064E3B)] : [const Color(0xFF1E293B), const Color(0xFF0F172A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.monetization_on, color: Colors.white),
              const SizedBox(width: 8),
              const Text('Funding Readiness', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const Spacer(),
              if (isPromoted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(12)),
                  child: const Text('PROMOTED', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            isPromoted 
              ? 'This project has been promoted to the Funding Pipeline.'
              : isPass 
                  ? 'Project is approved! You can now promote it to pitch to investors.'
                  : 'Project must achieve a PASS verdict before it can be promoted to the funding stage.',
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: (!isPass || isPromoted) ? null : () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Promote to Funding Pipeline', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
