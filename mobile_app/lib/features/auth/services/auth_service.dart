import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/supabase_client.dart';

class AuthService {
  final SupabaseClient _client = SupabaseConfig.client;
  static const String loginTimestampKey = 'last_login_timestamp';
  static const int _sessionHours = 24;
  static const String _loginTimestampKey = loginTimestampKey;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  User? get currentUser => _client.auth.currentUser;

  bool get isAdmin {
    final email = currentUser?.email?.toLowerCase();
    if (email == null) return false;
    return const ['admintest@gmail.com', 'mayungangalula19@gmail.com'].contains(email);
  }

  /// Returns true if the 24-hour session window has expired.
  Future<bool> isSessionExpired() async {
    final prefs = await SharedPreferences.getInstance();
    final ts = prefs.getInt(_loginTimestampKey);
    if (ts == null) return true;
    final loginTime = DateTime.fromMillisecondsSinceEpoch(ts);
    return DateTime.now().difference(loginTime).inHours >= _sessionHours;
  }

  Future<AuthResponse> signInWithEmail(String email, String password) async {
    try {
      final response = await _client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      // Record login timestamp on success
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_loginTimestampKey, DateTime.now().millisecondsSinceEpoch);
      return response;
    } catch (e) {
      rethrow;
    }
  }

  Future<AuthResponse> signUpWithEmail(String email, String password, String fullName) async {
    try {
      return await _client.auth.signUp(
        email: email,
        password: password,
        data: {'full_name': fullName},
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_loginTimestampKey);
    await _client.auth.signOut();
  }
}
