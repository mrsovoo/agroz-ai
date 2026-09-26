import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import 'auth_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({super.key});

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  String _code = '';
  final FocusNode _focusNode = FocusNode();
  final TextEditingController _textCtrl = TextEditingController();
  int _seconds = 300;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_seconds > 0) {
        setState(() {
          _seconds--;
        });
      } else {
        _timer?.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _focusNode.dispose();
    _textCtrl.dispose();
    super.dispose();
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
      if (mounted) {
        setState(() {
          _code = '';
          _textCtrl.clear();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Xato kod! Demo kod: 1 2 3 4 5'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final phone = ref.watch(authProvider).phone;

    return GestureDetector(
      onTap: () => _focusNode.requestFocus(),
      behavior: HitTestBehavior.opaque,
      child: Scaffold(
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
                const SizedBox(height: 20),
                const Text(
                  'Tasdiqlash kodi',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "Telefon raqamini tasdiqlash uchun 5-raqamli kod $phone raqamiga yuborildi",
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    '💡 Test uchun kod: 1 2 3 4 5',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primary,
                    ),
                  ),
                ),
                const SizedBox(height: 36),

                // Hidden TextField to receive keyboard input
                Opacity(
                  opacity: 0.01,
                  child: SizedBox(
                    height: 1,
                    width: 1,
                    child: TextField(
                      controller: _textCtrl,
                      focusNode: _focusNode,
                      autofocus: true,
                      keyboardType: TextInputType.number,
                      maxLength: 5,
                      onChanged: (val) {
                        setState(() {
                          _code = val;
                        });
                        if (val.length == 5) {
                          _verifyCode();
                        }
                      },
                    ),
                  ),
                ),

                // 5 ta doiracha (indikator)
                GestureDetector(
                  onTap: () => _focusNode.requestFocus(),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      final isFilled = index < _code.length;
                      final digit = isFilled ? _code[index] : '';
                      return Container(
                        margin: const EdgeInsets.symmetric(horizontal: 6),
                        width: 44,
                        height: 50,
                        decoration: BoxDecoration(
                          color: isFilled
                              ? AppColors.primary.withValues(alpha: 0.1)
                              : const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isFilled
                                ? AppColors.primary
                                : const Color(0xFFE5E7EB),
                            width: 1.5,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            digit,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      );
                    }),
                  ),
                ),
                const Spacer(),
                if (_seconds > 0)
                  Center(
                    child: Text(
                      "Agar kod kelmasa, $_seconds soniyada yangisini olishingiz mumkin",
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 13),
                    ),
                  )
                else
                  Center(
                    child: TextButton(
                      onPressed: () {
                        setState(() {
                          _seconds = 300;
                        });
                        _startTimer();
                      },
                      child: const Text(
                        'Kodni qayta yuborish',
                        style: TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
