import 'package:go_router/go_router.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/signup_screen.dart';
import '../features/dashboard/screens/dashboard_screen.dart';
import '../features/projects/screens/create_project_screen.dart';
import '../features/projects/screens/project_detail_screen.dart';
import '../features/teams/screens/create_team_screen.dart';
import '../features/experiments/screens/create_experiment_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/vault/screens/create_vault_entry_screen.dart';
import '../features/vault/screens/vault_detail_screen.dart';
import '../features/prototypes/screens/create_prototype_screen.dart';
import '../features/prototypes/screens/prototype_detail_screen.dart';
import '../features/funding/screens/funding_list_screen.dart';
import '../features/funding/screens/create_pitch_screen.dart';
import '../features/funding/screens/pitch_detail_screen.dart';
import '../features/maya_ai/screens/maya_ai_screen.dart';
import '../features/analytics/screens/analytics_screen.dart';
import '../features/onboarding/screens/onboarding_screen.dart';
import '../features/admin/screens/admin_dashboard_screen.dart';
import '../features/admin/screens/users_management_screen.dart';
import '../features/admin/screens/projects_management_screen.dart';
import '../features/ecosystem/screens/marketplace_screen.dart';
import '../features/ecosystem/screens/careers_screen.dart';
import '../features/funding/screens/investor_deal_room_screen.dart';
import '../features/messages/screens/messages_list_screen.dart';
import '../features/messages/screens/chat_screen.dart';
import '../features/marketing/screens/marketing_dashboard_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../features/auth/services/auth_service.dart';
import 'supabase_client.dart';

class AppRouter {
  static bool hasSeenIntro = false;

  static GoRouter createRouter(bool initialHasSeenIntro) {
    hasSeenIntro = initialHasSeenIntro;
    return GoRouter(
      initialLocation: hasSeenIntro ? '/login' : '/onboarding',
      redirect: (context, state) async {
        final session = SupabaseConfig.client.auth.currentSession;
        final isLoggedIn = session != null;
        
        final isOnboarding = state.matchedLocation == '/onboarding';
        final isLoggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/signup';

        // 1. Force onboarding if not seen
        if (!hasSeenIntro && !isOnboarding) return '/onboarding';
        
        // 2. Prevent returning to onboarding if already seen
        if (hasSeenIntro && isOnboarding) return '/login';

        // 3. Check 24-hour session expiry
        if (isLoggedIn && !isLoggingIn && !isOnboarding) {
          final prefs = await SharedPreferences.getInstance();
          final ts = prefs.getInt(AuthService.loginTimestampKey);
          if (ts != null) {
            final loginTime = DateTime.fromMillisecondsSinceEpoch(ts);
            if (DateTime.now().difference(loginTime).inHours >= 24) {
              await SupabaseConfig.client.auth.signOut();
              await prefs.remove(AuthService.loginTimestampKey);
              return '/login';
            }
          } else {
            // No timestamp recorded, force re-login
            await SupabaseConfig.client.auth.signOut();
            return '/login';
          }
        }

        // 4. Normal auth flow
        if (!isLoggedIn && !isLoggingIn && !isOnboarding) return '/login';
        if (isLoggedIn && (isLoggingIn || isOnboarding)) return '/dashboard';

        return null;
      },
    routes: [
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        builder: (context, state) => const SignupScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboardScreen(),
        routes: [
          GoRoute(
            path: 'users',
            builder: (context, state) => const UsersManagementScreen(),
          ),
          GoRoute(
            path: 'projects',
            builder: (context, state) => const ProjectsManagementScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/dashboard',
        builder: (context, state) => const DashboardScreen(),
        routes: [
          GoRoute(
            path: 'projects/create',
            builder: (context, state) => const CreateProjectScreen(),
          ),
          GoRoute(
            path: 'projects/:id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return ProjectDetailScreen(projectId: id);
            },
          ),
          GoRoute(
            path: 'teams/create',
            builder: (context, state) => const CreateTeamScreen(),
          ),
          GoRoute(
            path: 'experiments/create',
            builder: (context, state) => const CreateExperimentScreen(),
          ),
          GoRoute(
            path: 'profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: 'vault/create',
            builder: (context, state) => const CreateVaultEntryScreen(),
          ),
          GoRoute(
            path: 'vault/:id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return VaultDetailScreen(entryId: id);
            },
          ),
          GoRoute(
            path: 'prototypes/create',
            builder: (context, state) => const CreatePrototypeScreen(),
          ),
          GoRoute(
            path: 'prototypes/:id',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return PrototypeDetailScreen(prototypeId: id);
            },
          ),
          GoRoute(
            path: 'maya-ai',
            builder: (context, state) => const MayaAiScreen(),
          ),
          GoRoute(
            path: 'funding',
            builder: (context, state) => const FundingListScreen(),
            routes: [
              GoRoute(
                path: 'create',
                builder: (context, state) => const CreatePitchScreen(),
              ),
              GoRoute(
                path: ':id',
                builder: (context, state) {
                  final id = state.pathParameters['id']!;
                  return PitchDetailScreen(pitchId: id);
                },
              ),
            ],
          ),
          GoRoute(
            path: 'analytics',
            builder: (context, state) => const AnalyticsScreen(),
          ),
          GoRoute(
            path: 'marketplace',
            builder: (context, state) => const MarketplaceScreen(),
          ),
          GoRoute(
            path: 'careers',
            builder: (context, state) => const CareersScreen(),
          ),
          GoRoute(
            path: 'deal-room',
            builder: (context, state) => const InvestorDealRoomScreen(),
          ),
          GoRoute(
            path: 'newsletter',
            builder: (context, state) => const MarketingDashboardScreen(),
          ),
          GoRoute(
            path: 'messages',
            builder: (context, state) => const MessagesListScreen(),
            routes: [
              GoRoute(
                path: 'chat',
                builder: (context, state) => const ChatScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
}
