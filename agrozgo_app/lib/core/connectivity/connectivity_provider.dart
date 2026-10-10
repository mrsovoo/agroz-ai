import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final connectivityProvider = Provider<Connectivity>((ref) {
  return Connectivity();
});

final connectivityStatusProvider = StreamProvider<bool>((ref) {
  final connectivity = ref.watch(connectivityProvider);
  return connectivity.onConnectivityChanged.map((results) {
    if (results.isEmpty) return false;
    return results.any((result) => result != ConnectivityResult.none);
  });
});

final isOnlineProvider = FutureProvider<bool>((ref) async {
  final connectivity = ref.watch(connectivityProvider);
  final results = await connectivity.checkConnectivity();
  if (results.isEmpty) return false;
  return results.any((result) => result != ConnectivityResult.none);
});

