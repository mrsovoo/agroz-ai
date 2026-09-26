import 'package:flutter/material.dart';
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
                Text(authState.error!,
                    style: const TextStyle(color: Colors.red)),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: authState.isLoading
                    ? null
                    : () async {
                        final rawDigits = _controller.text
                            .replaceAll('-', '')
                            .replaceAll(' ', '');
                        final phone = '+998$rawDigits';
                        ref.read(authProvider.notifier).setPhone(phone);
                        final success =
                            await ref.read(authProvider.notifier).sendOtp();
                        if (success && context.mounted) {
                          context.push('/auth/otp');
                        }
                      },
                child: authState.isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Kodni olish',
                        style: TextStyle(color: Colors.white, fontSize: 16)),
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
                    style: TextStyle(
                        decoration: TextDecoration.underline,
                        color: AppColors.primary),
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
