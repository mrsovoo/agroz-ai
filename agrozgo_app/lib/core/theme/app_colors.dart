import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // User flavor colors (Green dominant)
  static const Color userPrimary = Color(0xFF16A34A); // Green 600
  static const Color userPrimaryDark = Color(0xFF15803D); // Green 700
  static const Color userPrimaryLight = Color(0xFFDCFCE7); // Green 100

  // Business flavor colors (Teal/Emerald dominant)
  static const Color businessPrimary = Color(0xFF0F766E); // Teal 700
  static const Color businessPrimaryDark = Color(0xFF115E59); // Teal 800
  static const Color businessPrimaryLight = Color(0xFFCCFBF1); // Teal 100

  // Shared neutral colors
  static const Color backgroundLight = Color(0xFFF9FAFB);
  static const Color backgroundDark = Color(0xFF111827);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceDark = Color(0xFF1F2937);

  static const Color textPrimaryLight = Color(0xFF111827);
  static const Color textSecondaryLight = Color(0xFF6B7280);
  static const Color textPrimaryDark = Color(0xFFF9FAFB);
  static const Color textSecondaryDark = Color(0xFF9CA3AF);

  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color borderDark = Color(0xFF374151);

  // Status colors
  static const Color success = Color(0xFF22C55E);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
}
