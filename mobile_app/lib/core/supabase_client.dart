import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseConfig {
  // TODO: Replace with your actual Supabase URL and Anon Key from your .env file
  static const String supabaseUrl = 'https://bonglgozhezuwfkyypsg.supabase.co';
  static const String supabaseAnonKey = 'sb_publishable_WDMlw6i9xHT_SR4eNwSfaQ_W6OuyJR7';

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      publishableKey: supabaseAnonKey,
    );
  }

  static SupabaseClient get client => Supabase.instance.client;
}
