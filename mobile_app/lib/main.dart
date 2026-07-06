import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/supabase_client.dart';
import 'core/router.dart';
import 'core/theme_provider.dart';
import 'features/auth/services/auth_service.dart';
import 'features/projects/services/project_service.dart';
import 'features/teams/services/team_service.dart';
import 'features/experiments/services/experiment_service.dart';
import 'features/vault/services/vault_service.dart';
import 'features/prototypes/services/prototype_service.dart';
import 'features/funding/services/funding_service.dart';
import 'features/analytics/services/analytics_service.dart';
import 'features/maya_ai/services/maya_ai_service.dart';

import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await SupabaseConfig.initialize();
  final prefs = await SharedPreferences.getInstance();
  final hasSeenIntro = prefs.getBool('hasSeenIntro') ?? false;

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<ThemeProvider>(
          create: (_) => ThemeProvider(),
        ),
        Provider<AuthService>(
          create: (_) => AuthService(),
        ),
        Provider<ProjectService>(
          create: (_) => ProjectService(),
        ),
        Provider<TeamService>(
          create: (_) => TeamService(),
        ),
        Provider<ExperimentService>(
          create: (_) => ExperimentService(),
        ),
        Provider<VaultService>(
          create: (_) => VaultService(),
        ),
        Provider<PrototypeService>(
          create: (_) => PrototypeService(),
        ),
        Provider<FundingService>(
          create: (_) => FundingService(),
        ),
        Provider<AnalyticsService>(
          create: (_) => AnalyticsService(),
        ),
        Provider<MayaAiService>(
          create: (_) => MayaAiService(),
        ),
      ],
      child: MayletXLabApp(hasSeenIntro: hasSeenIntro),
    ),
  );
}

class MayletXLabApp extends StatelessWidget {
  final bool hasSeenIntro;
  const MayletXLabApp({super.key, required this.hasSeenIntro});

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    return MaterialApp.router(
      title: 'Maylet XLab',
      theme: ThemeProvider.lightTheme,
      darkTheme: ThemeProvider.darkTheme,
      themeMode: themeProvider.themeMode,
      routerConfig: AppRouter.createRouter(hasSeenIntro),
      debugShowCheckedModeBanner: false,
    );
  }
}
