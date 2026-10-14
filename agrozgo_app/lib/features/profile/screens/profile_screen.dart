import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../auth/models/auth_models.dart';
import '../../auth/providers/auth_provider.dart';
import '../../cart/providers/cart_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  static const _greenColor = Color(0xFF00A82D);
  static const _greyTextColor = Color(0xFF8E8E93);
  static const _cardBg = Colors.white;

  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _regionController = TextEditingController(text: 'Farg‘ona viloyati');
  final TextEditingController _districtController = TextEditingController(text: 'Farg‘ona shahri');
  bool _isLocationGranted = true;

  final List<TextEditingController> _otpControllers =
      List.generate(4, (_) => TextEditingController());
  final List<FocusNode> _otpFocusNodes = List.generate(4, (_) => FocusNode());

  @override
  void dispose() {
    _phoneController.dispose();
    _nameController.dispose();
    _regionController.dispose();
    _districtController.dispose();
    for (final c in _otpControllers) {
      c.dispose();
    }
    for (final f in _otpFocusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _clearOtp() {
    for (final c in _otpControllers) {
      c.clear();
    }
  }

  String _getEnteredOtp() {
    return _otpControllers.map((c) => c.text).join();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: tokens.screenBackground,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.black, size: 20),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
        title: Text(
          _getAppBarTitle(authState),
          style: const TextStyle(
            color: Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            fontFamily: 'Arial',
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: _buildCurrentContent(authState),
        ),
      ),
    );
  }

  String _getAppBarTitle(AuthState authState) {
    if (authState.isAuthenticated) {
      return 'Mening profilim';
    } else if (authState.step == AuthStep.otpVerification) {
      return 'Tasdiqlash kodi';
    } else if (authState.step == AuthStep.nameAndLocationSetup) {
      return 'Profilni sozlash';
    }
    return 'Kirish / Roʻyxatdan oʻtish';
  }

  Widget _buildCurrentContent(AuthState authState) {
    if (authState.isAuthenticated) {
      return _buildAuthenticatedView(authState.user!);
    } else if (authState.step == AuthStep.otpVerification) {
      return _buildOtpVerificationView(authState);
    } else if (authState.step == AuthStep.nameAndLocationSetup) {
      return _buildNameAndLocationSetupView(authState);
    } else {
      return _buildLoginView(authState);
    }
  }

  // -------------------------------------------------------------
  // 1. LOGIN VIEW (Phone-only authentication)
  // -------------------------------------------------------------
  Widget _buildLoginView(AuthState authState) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Logo & Welcome Icon
          Center(
            child: Container(
              width: 76,
              height: 76,
              decoration: BoxDecoration(
                color: _greenColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.person_pin_rounded,
                  size: 42,
                  color: _greenColor,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'AgrozGo Profiliga kirish',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 21,
              fontWeight: FontWeight.w800,
              fontFamily: 'Arial',
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Xizmatlardan toʻliq foydalanish va buyurtmalarni boshqarish uchun telefon raqamingizni kiriting',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13.5,
              color: _greyTextColor,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 24),

          // Error Message Banner
          if (authState.error != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFEBEE),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, color: Colors.red, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      authState.error!,
                      style: const TextStyle(color: Colors.red, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Phone Number Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0C000000),
                  blurRadius: 15,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Telefon raqamingiz',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF2F2F7),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Text('🇺🇿 ', style: TextStyle(fontSize: 16)),
                          Text(
                            '+998',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        maxLength: 9,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.2,
                        ),
                        decoration: InputDecoration(
                          counterText: '',
                          hintText: '90 123 45 67',
                          hintStyle: TextStyle(
                            color: Colors.grey.shade400,
                            letterSpacing: 0.5,
                          ),
                          filled: true,
                          fillColor: const Color(0xFFF2F2F7),
                          contentPadding:
                              const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                // Send SMS Button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: authState.isLoading
                        ? null
                        : () async {
                            HapticFeedback.mediumImpact();
                            final raw = _phoneController.text.trim();
                            final fullPhone = '+998$raw';
                            final ok =
                                await ref.read(authProvider.notifier).requestCode(fullPhone);
                            if (ok) {
                              _clearOtp();
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _greenColor,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: authState.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            'SMS kodni olish',
                            style: TextStyle(
                              fontSize: 15.5,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Center(
            child: Text(
              'Raqamingizga 4 xonali SMS tasdiqlash kodi yuboriladi',
              style: TextStyle(
                fontSize: 12.5,
                color: _greyTextColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // 2. OTP VERIFICATION VIEW (Enter 4-digit code)
  // -------------------------------------------------------------
  Widget _buildOtpVerificationView(AuthState authState) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: _greenColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.mark_email_read_outlined,
                  size: 38,
                  color: _greenColor,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Tasdiqlash kodi',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              fontFamily: 'Arial',
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'SMS kod ${authState.pendingPhone ?? ""} raqamiga yuborildi',
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 13.5,
              color: _greyTextColor,
            ),
          ),
          const SizedBox(height: 20),

          // Test / Demo Helper Banner: One-tap auto fill
          if (authState.lastSentOtp != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F5E9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _greenColor.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, color: _greenColor, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'SMS kod: ${authState.lastSentOtp}',
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1B5E20),
                      ),
                    ),
                  ),
                  InkWell(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      final otp = authState.lastSentOtp ?? '';
                      for (int i = 0; i < 4 && i < otp.length; i++) {
                        _otpControllers[i].text = otp[i];
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _greenColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Toʻldirish',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Error banner
          if (authState.error != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFEBEE),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                authState.error!,
                style: const TextStyle(color: Colors.red, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 16),
          ],

          // 4-box OTP Input
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(4, (index) {
              return Container(
                width: 58,
                height: 64,
                margin: const EdgeInsets.symmetric(horizontal: 6),
                child: TextField(
                  controller: _otpControllers[index],
                  focusNode: _otpFocusNodes[index],
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  maxLength: 1,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    fontFamily: 'Arial',
                    color: Colors.black,
                  ),
                  decoration: InputDecoration(
                    counterText: '',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFFE5E5EA), width: 1.5),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: _greenColor, width: 2),
                    ),
                  ),
                  onChanged: (val) {
                    if (val.isNotEmpty && index < 3) {
                      _otpFocusNodes[index + 1].requestFocus();
                    } else if (val.isEmpty && index > 0) {
                      _otpFocusNodes[index - 1].requestFocus();
                    }
                    if (_getEnteredOtp().length == 4) {
                      _verifyCurrentOtp();
                    }
                  },
                ),
              );
            }),
          ),

          const SizedBox(height: 24),

          // Confirm Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: authState.isLoading ? null : _verifyCurrentOtp,
              style: ElevatedButton.styleFrom(
                backgroundColor: _greenColor,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: authState.isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Tasdiqlash',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
            ),
          ),

          const SizedBox(height: 16),

          // Countdown or Resend
          Center(
            child: authState.otpSecondsRemaining > 0
                ? Text(
                    'Kodni qayta yuborish: 00:${authState.otpSecondsRemaining.toString().padLeft(2, '0')}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: _greyTextColor,
                      fontWeight: FontWeight.w500,
                    ),
                  )
                : TextButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      final phone = authState.pendingPhone ?? '';
                      ref.read(authProvider.notifier).requestCode(phone);
                    },
                    child: const Text(
                      'Kodni qayta yuborish',
                      style: TextStyle(
                        color: _greenColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
          ),

          // Change number / Back
          Center(
            child: TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                ref.read(authProvider.notifier).cancelOtpAndGoBack();
              },
              child: const Text(
                'Raqamni oʻzgartirish',
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _verifyCurrentOtp() {
    HapticFeedback.mediumImpact();
    final otp = _getEnteredOtp();
    ref.read(authProvider.notifier).verifyOtp(otp);
  }

  // -------------------------------------------------------------
  // 3. NAME & LOCATION SETUP VIEW (Ism kiritish va Location ruxsat)
  // -------------------------------------------------------------
  Widget _buildNameAndLocationSetupView(AuthState authState) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: _greenColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.person_add_alt_1_rounded,
                  size: 38,
                  color: _greenColor,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Profilingizni sozlang',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              fontFamily: 'Arial',
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Xizmatlar va buyurtmalar toʻgʻri yetkazilishi uchun ismingizni kiriting va joylashuvga ruxsat bering',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13.5,
              color: _greyTextColor,
              height: 1.35,
            ),
          ),
          const SizedBox(height: 24),

          // Name Input Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0C000000),
                  blurRadius: 15,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ismingiz va familiyangiz *',
                  style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w600),
                  decoration: InputDecoration(
                    hintText: 'Masalan: Sohibjon Sulaymonov',
                    hintStyle: TextStyle(color: Colors.grey.shade400),
                    filled: true,
                    fillColor: const Color(0xFFF2F2F7),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Location Permission Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0C000000),
                  blurRadius: 15,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _greenColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.location_on_rounded, color: _greenColor, size: 20),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Joylashuvga ruxsat berish',
                            style: TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w700,
                              color: Colors.black,
                            ),
                          ),
                          SizedBox(height: 2),
                          Text(
                            'Hududingiz boʻyicha ob-havo va dorilar uchun',
                            style: TextStyle(fontSize: 11.5, color: _greyTextColor),
                          ),
                        ],
                      ),
                    ),
                    Switch.adaptive(
                      value: _isLocationGranted,
                      activeTrackColor: _greenColor,
                      onChanged: (val) {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _isLocationGranted = val;
                        });
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Divider(height: 1, thickness: 0.5, color: Color(0xFFE5E5EA)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _regionController,
                        decoration: InputDecoration(
                          labelText: 'Viloyat',
                          filled: true,
                          fillColor: const Color(0xFFF2F2F7),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        controller: _districtController,
                        decoration: InputDecoration(
                          labelText: 'Tuman / Shahar',
                          filled: true,
                          fillColor: const Color(0xFFF2F2F7),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Save & Start Button
          SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: () {
                final name = _nameController.text.trim();
                if (name.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Iltimos, ismingizni kiriting')),
                  );
                  return;
                }
                HapticFeedback.mediumImpact();
                ref.read(authProvider.notifier).completeNameAndLocationSetup(
                      name: name,
                      region: _regionController.text.trim(),
                      district: _districtController.text.trim(),
                      isLocationGranted: _isLocationGranted,
                    );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: _greenColor,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text(
                'Profilni saqlash va boshlash',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // 4. AUTHENTICATED PROFILE VIEW (No Telegram, Purely Phone & Profile)
  // -------------------------------------------------------------
  Widget _buildAuthenticatedView(UserModel user) {
    final cartState = ref.watch(cartProvider);

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Profile User Hero Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(22),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0C000000),
                  blurRadius: 15,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    // Avatar Circle
                    Container(
                      width: 66,
                      height: 66,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [_greenColor, Color(0xFF35CA56)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          _getUserInitials(user.name),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Arial',
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  user.name ?? 'Foydalanuvchi',
                                  style: const TextStyle(
                                    fontSize: 17.5,
                                    fontWeight: FontWeight.w800,
                                    fontFamily: 'Arial',
                                    color: Colors.black,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              InkWell(
                                onTap: () => _showEditNameDialog(context, user.name),
                                child: const Padding(
                                  padding: EdgeInsets.all(4),
                                  child: Icon(Icons.edit_outlined, size: 18, color: _greyTextColor),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          // Phone number
                          Text(
                            user.phone ?? 'Raqam yoʻq',
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 6),
                          // Verified badge
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8F5E9),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.check_circle_rounded, color: _greenColor, size: 14),
                                SizedBox(width: 4),
                                Text(
                                  'Tasdiqlangan raqam',
                                  style: TextStyle(
                                    color: Color(0xFF1B5E20),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),
                const Divider(height: 1, thickness: 0.5, color: Color(0xFFE5E5EA)),
                const SizedBox(height: 12),

                // Change & verify number action
                InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    _showChangeNumberBottomSheet(context);
                  },
                  borderRadius: BorderRadius.circular(10),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.phone_iphone_rounded, color: _greenColor, size: 18),
                        SizedBox(width: 6),
                        Text(
                          'Raqamni oʻzgartirish va tasdiqlash',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: _greenColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Quick Action Cards (Orders & Cart count)
          Row(
            children: [
              Expanded(
                child: _buildMetricCard(
                  icon: Icons.local_shipping_outlined,
                  iconColor: const Color(0xFF0094FF),
                  title: 'Buyurtmalar',
                  subtitle: 'Tarix va holat',
                  onTap: () {
                    HapticFeedback.lightImpact();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Hozircha yangi buyurtmalar mavjud emas'),
                        duration: Duration(seconds: 2),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricCard(
                  icon: Icons.shopping_cart_outlined,
                  iconColor: _greenColor,
                  title: 'Savatda',
                  subtitle: '${cartState.totalCount} ta mahsulot',
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.push('/cart');
                  },
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Menu Options List Card
          Container(
            decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x0C000000),
                  blurRadius: 15,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                _buildMenuItem(
                  icon: Icons.location_on_outlined,
                  iconColor: const Color(0xFFFF9500),
                  title: 'Yetkazib berish manzili',
                  trailingText: '${user.region ?? "Fargʻona"}, ${user.district ?? "shahar"}',
                  onTap: () => _showLocationDialog(context, user),
                ),
                _buildMenuDivider(),
                _buildMenuItem(
                  icon: Icons.notifications_none_rounded,
                  iconColor: const Color(0xFF5856D6),
                  title: 'Ob-havo xabarnomalari',
                  trailing: Switch.adaptive(
                    value: user.isWeatherPushEnabled,
                    activeTrackColor: _greenColor,
                    onChanged: (val) {
                      HapticFeedback.selectionClick();
                      ref.read(authProvider.notifier).updateProfile(
                            isWeatherPushEnabled: val,
                          );
                    },
                  ),
                ),
                _buildMenuDivider(),
                _buildMenuItem(
                  icon: Icons.language_rounded,
                  iconColor: const Color(0xFF007AFF),
                  title: 'Ilova tili',
                  trailingText: 'Oʻzbekcha',
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Joriy til: Oʻzbekcha')),
                    );
                  },
                ),
                _buildMenuDivider(),
                _buildMenuItem(
                  icon: Icons.support_agent_rounded,
                  iconColor: _greenColor,
                  title: 'Qoʻllab-quvvatlash xizmati',
                  trailingText: '+998 71 200 00 00',
                  onTap: () => _showSupportDialog(context),
                ),
                _buildMenuDivider(),
                _buildMenuItem(
                  icon: Icons.info_outline_rounded,
                  iconColor: _greyTextColor,
                  title: 'Ilova haqida',
                  trailingText: 'v1.0.0 (Release)',
                  onTap: () {
                    showAboutDialog(
                      context: context,
                      applicationName: 'AgrozGo',
                      applicationVersion: '1.0.0',
                      applicationLegalese: '© 2026 AgrozGo. Barcha huquqlar himoyalangan.',
                    );
                  },
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Logout Button
          InkWell(
            onTap: () => _showLogoutConfirmDialog(context),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFFFEBEE),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout_rounded, color: Colors.red, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Tizimdan chiqish',
                    style: TextStyle(
                      color: Colors.red,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Arial',
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // HELPER WIDGETS & DIALOGS
  // -------------------------------------------------------------
  String _getUserInitials(String? name) {
    if (name == null || name.trim().isEmpty) return 'AG';
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  Widget _buildMetricCard({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _cardBg,
          borderRadius: BorderRadius.circular(18),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0C000000),
              blurRadius: 12,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(
                fontSize: 14.5,
                fontWeight: FontWeight.w700,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 12,
                color: _greyTextColor,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required Color iconColor,
    required String title,
    String? trailingText,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(9),
              ),
              child: Icon(icon, color: iconColor, size: 19),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ),
            if (trailing != null)
              trailing
            else if (trailingText != null) ...[
              Text(
                trailingText,
                style: const TextStyle(
                  fontSize: 13,
                  color: _greyTextColor,
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFFC7C7CC)),
            ] else
              const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFFC7C7CC)),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuDivider() {
    return const Padding(
      padding: EdgeInsets.only(left: 54, right: 16),
      child: Divider(height: 1, thickness: 0.5, color: Color(0xFFE5E5EA)),
    );
  }

  // Change & verify number bottom sheet
  void _showChangeNumberBottomSheet(BuildContext context) {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (bottomSheetContext) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(bottomSheetContext).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Raqamni oʻzgartirish',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  fontFamily: 'Arial',
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Yangi raqamni kiriting. Tasdiqlangach, barcha roʻyxatdan oʻtgan nomerlaringiz shu yangi raqamga oʻzgaradi.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12.5,
                  color: _greyTextColor,
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF2F2F7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      '+998',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: controller,
                      keyboardType: TextInputType.phone,
                      maxLength: 9,
                      decoration: InputDecoration(
                        counterText: '',
                        hintText: '90 123 45 67',
                        filled: true,
                        fillColor: const Color(0xFFF2F2F7),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: () async {
                    final raw = controller.text.trim();
                    if (raw.length < 9) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Raqamni toʻliq kiriting')),
                      );
                      return;
                    }
                    Navigator.pop(bottomSheetContext);
                    HapticFeedback.mediumImpact();
                    final full = '+998$raw';
                    _clearOtp();
                    await ref.read(authProvider.notifier).requestCode(full);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _greenColor,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Tasdiqlash kodini yuborish',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showEditNameDialog(BuildContext context, String? currentName) {
    final controller = TextEditingController(text: currentName ?? '');
    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          title: const Text('Ismni oʻzgartirish', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              hintText: 'Ism va familiyangiz',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Bekor qilish'),
            ),
            ElevatedButton(
              onPressed: () {
                final newName = controller.text.trim();
                if (newName.isNotEmpty) {
                  ref.read(authProvider.notifier).updateProfile(name: newName);
                }
                Navigator.pop(dialogCtx);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: _greenColor,
                foregroundColor: Colors.white,
              ),
              child: const Text('Saqlash'),
            ),
          ],
        );
      },
    );
  }

  void _showLocationDialog(BuildContext context, UserModel user) {
    final regionController = TextEditingController(text: user.region ?? 'Fargʻona');
    final districtController = TextEditingController(text: user.district ?? 'Fargʻona shahri');
    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          title: const Text('Manzilni tahrirlash', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: regionController,
                decoration: const InputDecoration(labelText: 'Viloyat'),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: districtController,
                decoration: const InputDecoration(labelText: 'Tuman / Shahar'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Bekor qilish'),
            ),
            ElevatedButton(
              onPressed: () {
                ref.read(authProvider.notifier).updateProfile(
                      region: regionController.text.trim(),
                      district: districtController.text.trim(),
                    );
                Navigator.pop(dialogCtx);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: _greenColor,
                foregroundColor: Colors.white,
              ),
              child: const Text('Saqlash'),
            ),
          ],
        );
      },
    );
  }

  void _showSupportDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Text('Qoʻllab-quvvatlash xizmati', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          content: const Text(
            'Har qanday savol yoki takliflar boʻyicha markazimizga murojaat qiling:\n\n📞 Qoʻllab-quvvatlash: +998 71 200 00 00\n⏰ Ish vaqti: 09:00 - 18:00',
            style: TextStyle(fontSize: 14, height: 1.4),
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(dialogCtx),
              style: ElevatedButton.styleFrom(
                backgroundColor: _greenColor,
                foregroundColor: Colors.white,
              ),
              child: const Text('Tushunarli'),
            ),
          ],
        );
      },
    );
  }

  void _showLogoutConfirmDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogCtx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Text('Tizimdan chiqish', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
          content: const Text('Haqiqatan ham profilingizdan chiqmoqchimisiz?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogCtx),
              child: const Text('Bekor qilish', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(dialogCtx);
                HapticFeedback.mediumImpact();
                ref.read(authProvider.notifier).logout();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text('Chiqish'),
            ),
          ],
        );
      },
    );
  }
}
