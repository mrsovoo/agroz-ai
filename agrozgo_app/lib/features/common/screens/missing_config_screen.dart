import 'package:flutter/material.dart';

class MissingConfigScreen extends StatelessWidget {
  const MissingConfigScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFFF5F5F5),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 24.0),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.cloud_off_rounded,
                  color: Color(0xFFFA2B36),
                  size: 64,
                ),
                SizedBox(height: 20),
                Text(
                  'API_URL Sozlanmagan',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Arial',
                    color: Colors.black,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 12),
                Text(
                  'Ilova ishlashi uchun --dart-define=API_URL=... parametri kiritilishi shart.\n\nJonli server manzili dastur kodida saqlanmaydi.',
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.4,
                    fontFamily: 'Arial',
                    color: Color(0xFF666666),
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
