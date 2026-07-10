import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:go_router/go_router.dart';
import '../../../core/router.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:flutter_animate/flutter_animate.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  bool _isLastPage = false;

  final List<OnboardingPageData> _pages = [
    OnboardingPageData(
      image: 'assets/images/image1.png',
      title: 'Welcome to Maylet XLab',
      subtitle: 'Where ideas become reality. Start your innovation journey with the most advanced R&D platform.',
    ),
    OnboardingPageData(
      image: 'assets/images/image2.png',
      title: 'Collaborate & Build',
      subtitle: 'Work seamlessly with your team. Manage projects, run experiments, and track your metrics in real-time.',
    ),
    OnboardingPageData(
      image: 'assets/images/image3.png',
      title: 'Achieve Breakthroughs',
      subtitle: "Unlock insights with MAYA AI and secure your innovations in the Vault. Let's get started!",
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('hasSeenIntro', true);
    AppRouter.hasSeenIntro = true;
    if (mounted) {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Page View
          PageView.builder(
            controller: _controller,
            onPageChanged: (index) {
              setState(() => _isLastPage = index == _pages.length - 1);
            },
            itemCount: _pages.length,
            itemBuilder: (context, index) {
              final page = _pages[index];
              return Stack(
                fit: StackFit.expand,
                children: [
                  // Background Image (Covering the whole 9:16 screen beautifully)
                  Image.asset(
                    page.image,
                    fit: BoxFit.cover,
                  ),
                  
                  // Gradient Overlay for text readability
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(0.3),
                          Colors.black.withOpacity(0.8),
                        ],
                        stops: const [0.0, 0.5, 1.0],
                      ),
                    ),
                  ),

                  // Content
                  SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.end,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            page.title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              height: 1.2,
                            ),
                          ).animate().fade(duration: 600.ms).slideY(begin: 0.3, end: 0, curve: Curves.easeOutQuad),
                          const SizedBox(height: 16),
                          Text(
                            page.subtitle,
                            style: const TextStyle(
                              color: Colors.white70,
                              fontSize: 16,
                              height: 1.5,
                            ),
                          ).animate().fade(delay: 200.ms, duration: 600.ms).slideY(begin: 0.3, end: 0, curve: Curves.easeOutQuad),
                          const SizedBox(height: 100), // Space for bottom controls
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

          // Bottom Controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 24.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Dot Indicator
                    SmoothPageIndicator(
                      controller: _controller,
                      count: _pages.length,
                      effect: const ExpandingDotsEffect(
                        activeDotColor: Colors.white,
                        dotColor: Colors.white54,
                        dotHeight: 8,
                        dotWidth: 8,
                        expansionFactor: 3,
                      ),
                    ),

                    // Next / Get Started Button
                    _isLastPage
                        ? ElevatedButton(
                            onPressed: _completeOnboarding,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black,
                              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                            ),
                            child: const Text('Get Started', style: TextStyle(fontWeight: FontWeight.bold)),
                          ).animate().fade().scale()
                        : IconButton(
                            onPressed: () {
                              _controller.nextPage(
                                duration: const Duration(milliseconds: 500),
                                curve: Curves.easeInOut,
                              );
                            },
                            icon: const Icon(Icons.arrow_forward, color: Colors.white),
                            style: IconButton.styleFrom(
                              backgroundColor: Colors.white.withOpacity(0.2),
                              padding: const EdgeInsets.all(16),
                            ),
                          ).animate().fade(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class OnboardingPageData {
  final String image;
  final String title;
  final String subtitle;

  OnboardingPageData({
    required this.image,
    required this.title,
    required this.subtitle,
  });
}
