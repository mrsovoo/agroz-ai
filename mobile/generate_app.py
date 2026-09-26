import os

base_dir = "/Users/sohibjonsulaymonov/kodlar/agroz-ai/apps/mobile/lib"

files = {
    "router/app_router.dart": """import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../features/auth/auth_provider.dart';
import '../features/auth/phone_screen.dart';
import '../features/auth/otp_screen.dart';
import '../features/auth/name_screen.dart';
import '../features/home/home_screen.dart';
import '../main.dart'; // for sharedPrefs

part 'app_router.g.dart';

@riverpod
GoRouter appRouter(AppRouterRef ref) {
  final authState = ref.watch(authProvider);
  
  return GoRouter(
    initialLocation: sharedPrefs.getString('token') != null ? '/' : '/auth/phone',
    routes: [
      GoRoute(
        path: '/auth/phone',
        builder: (context, state) => const PhoneScreen(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (context, state) => const OtpScreen(),
      ),
      GoRoute(
        path: '/auth/name',
        builder: (context, state) => const NameScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeScreen(),
      ),
      // Add other routes here...
    ],
  );
}
""",
    "features/auth/auth_provider.dart": """import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../../core/constants/api_config.dart';

class AuthState {
  final String phone;
  final bool isLoading;
  final String? error;
  final String? token;
  final bool isNewUser;

  AuthState({this.phone = '', this.isLoading = false, this.error, this.token, this.isNewUser = false});

  AuthState copyWith({String? phone, bool? isLoading, String? error, String? token, bool? isNewUser}) {
    return AuthState(
      phone: phone ?? this.phone,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      token: token ?? this.token,
      isNewUser: isNewUser ?? this.isNewUser,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState());
  final Dio _dio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));

  void setPhone(String phone) {
    state = state.copyWith(phone: phone);
  }

  Future<bool> sendOtp() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _dio.post('/api/auth/send-otp', data: {'phone': state.phone});
      state = state.copyWith(isLoading: false);
      return res.data['ok'] == true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> verifyOtp(String code) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _dio.post('/api/auth/verify-otp', data: {'phone': state.phone, 'code': code});
      if (res.data['ok'] == true) {
        final token = res.data['token'];
        final isNewUser = res.data['isNewUser'] ?? false;
        
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        
        state = state.copyWith(isLoading: false, token: token, isNewUser: isNewUser);
        return true;
      }
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<bool> updateProfile(String name, String surname) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _dio.patch('/api/me', 
        data: {'name': "\$name \$surname"},
        options: Options(headers: {'Authorization': 'Bearer \${state.token}'}),
      );
      state = state.copyWith(isLoading: false, isNewUser: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
""",
    "features/auth/phone_screen.dart": """import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import 'auth_provider.dart';

class PhoneScreen extends ConsumerStatefulWidget {
  const PhoneScreen({super.key});

  @override
  ConsumerState<PhoneScreen> createState() => _PhoneScreenState();
}

class _PhoneScreenState extends ConsumerState<PhoneScreen> {
  final _controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Align(
                alignment: Alignment.topRight,
                child: IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {},
                ),
              ),
              const SizedBox(height: 40),
              const Text(
                "Agroz'ga kirish",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 40),
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Text('+998 | ', style: TextStyle(fontSize: 18)),
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          hintText: '000-00-00',
                          border: InputBorder.none,
                        ),
                        style: const TextStyle(fontSize: 18),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),
              if (authState.error != null)
                Text(authState.error!, style: const TextStyle(color: Colors.red)),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: authState.isLoading ? null : () async {
                  final phone = '+998\${_controller.text.replaceAll('-', '').replaceAll(' ', '')}';
                  ref.read(authProvider.notifier).setPhone(phone);
                  final success = await ref.read(authProvider.notifier).sendOtp();
                  if (success && mounted) {
                    context.push('/auth/otp');
                  }
                },
                child: authState.isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Kodni olish', style: TextStyle(color: Colors.white, fontSize: 16)),
              ),
              const SizedBox(height: 16),
              const Text(
                "Davom etgan holda men shaxsga doir ma'lumotlarni qayta ishlashga siyosati va AgrozAI ommaviy oferta bilan rozi bo'laman",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 8),
              Center(
                child: InkWell(
                  onTap: () {},
                  child: const Text(
                    "AgrozAI o'zi nima",
                    style: TextStyle(decoration: TextDecoration.underline, color: AppColors.primary),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
""",
    "features/auth/otp_screen.dart": """import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import '../../core/constants/app_colors.dart';
import 'auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  String _code = '';
  int _seconds = 300;
  Timer? _timer;
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _startTimer();
    Future.delayed(Duration.zero, () => _focusNode.requestFocus());
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_seconds > 0) {
        setState(() => _seconds--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _focusNode.dispose();
    super.dispose();
  }

  void _handleKey(String value) {
    if (_code.length < 5) {
      setState(() {
        _code += value;
      });
      if (_code.length == 5) {
        _verifyCode();
      }
    }
  }

  void _verifyCode() async {
    final success = await ref.read(authProvider.notifier).verifyOtp(_code);
    if (success && mounted) {
      final isNewUser = ref.read(authProvider).isNewUser;
      if (isNewUser) {
        context.go('/auth/name');
      } else {
        context.go('/');
      }
    } else {
      setState(() {
        _code = '';
      });
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Xato kod')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final phone = ref.read(authProvider).phone;
    
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left, size: 32),
                onPressed: () => context.pop(),
                padding: EdgeInsets.zero,
                alignment: Alignment.centerLeft,
              ),
              const SizedBox(height: 24),
              const Text(
                "Kodni kiriting",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                "Telefon raqamini tasdiqlash uchun 5-raqamli kod \$phone raqamiga yuborildi",
                style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 40),
              // Hidden TextField just to show keyboard
              Opacity(
                opacity: 0,
                child: SizedBox(
                  height: 1,
                  child: TextField(
                    focusNode: _focusNode,
                    keyboardType: TextInputType.number,
                    onChanged: (val) {
                      if (val.length <= 5) {
                        setState(() {
                          _code = val;
                        });
                        if (_code.length == 5) _verifyCode();
                      }
                    },
                  ),
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final isFilled = index < _code.length;
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isFilled ? AppColors.primary : AppColors.border,
                    ),
                  );
                }),
              ),
              const Spacer(),
              if (_seconds > 0)
                Center(
                  child: Text(
                    "Agar kod kelmasa, \$_seconds soniyada yangisini olishingiz mumkin",
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                )
              else
                Center(
                  child: TextButton(
                    onPressed: () {
                      ref.read(authProvider.notifier).sendOtp();
                      setState(() => _seconds = 300);
                      _startTimer();
                    },
                    child: const Text("Kodni qayta olish", style: TextStyle(color: AppColors.primary)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
""",
    "features/auth/name_screen.dart": """import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import 'auth_provider.dart';

class NameScreen extends ConsumerStatefulWidget {
  const NameScreen({super.key});

  @override
  ConsumerState<NameScreen> createState() => _NameScreenState();
}

class _NameScreenState extends ConsumerState<NameScreen> {
  final _nameController = TextEditingController();
  final _surnameController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left, size: 32),
                onPressed: () => context.pop(),
                padding: EdgeInsets.zero,
                alignment: Alignment.centerLeft,
              ),
              const SizedBox(height: 24),
              const Text(
                "Ismingizni kiriting",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _nameController,
                decoration: InputDecoration(
                  hintText: 'Ism',
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _surnameController,
                decoration: InputDecoration(
                  hintText: 'Familiya',
                  filled: true,
                  fillColor: AppColors.surface,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const Spacer(),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: authState.isLoading ? null : () async {
                  if (_nameController.text.isEmpty) return;
                  final success = await ref.read(authProvider.notifier).updateProfile(
                    _nameController.text,
                    _surnameController.text,
                  );
                  if (success && mounted) {
                    context.go('/');
                  }
                },
                child: authState.isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Tasdiqlash', style: TextStyle(color: Colors.white, fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
""",
    "features/home/home_screen.dart": """import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Asosiy'),
      ),
      body: const Center(
        child: Text('Home Screen Placeholder'),
      ),
    );
  }
}
"""
}

for filepath, content in files.items():
    full_path = os.path.join(base_dir, filepath)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w") as f:
        f.write(content)
        
print("Files generated successfully.")
