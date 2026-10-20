import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/connectivity/connectivity_provider.dart';
import '../../core/constants/app_strings.dart';
import '../../core/theme/app_spacing.dart';

class NetworkBanner extends ConsumerWidget {
  const NetworkBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectivityAsync = ref.watch(connectivityStatusProvider);
    final isOnline = connectivityAsync.asData?.value ?? true;

    if (isOnline) {
      return const SizedBox.shrink();
    }

    return Container(
      width: double.infinity,
      color: Colors.amber.shade700,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.wifi_off, size: 16, color: Colors.white),
          SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              AppStrings.offlineMessage,
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}
