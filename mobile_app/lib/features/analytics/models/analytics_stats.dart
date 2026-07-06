class AnalyticsStats {
  final int totalProjects;
  final int activeTeams;
  final int totalExperiments;
  final int totalPrototypes;
  final int vaultEntries;
  final double totalFundingRaised;
  final double totalFundingTarget;
  final int totalPitches;

  AnalyticsStats({
    required this.totalProjects,
    required this.activeTeams,
    required this.totalExperiments,
    required this.totalPrototypes,
    required this.vaultEntries,
    required this.totalFundingRaised,
    required this.totalFundingTarget,
    required this.totalPitches,
  });

  double get fundingProgress =>
      totalFundingTarget > 0 ? (totalFundingRaised / totalFundingTarget).clamp(0.0, 1.0) : 0.0;
}
