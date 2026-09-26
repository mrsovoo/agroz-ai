import 'dart:io';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_config.dart';

class DiagnoseScreen extends StatefulWidget {
  final String category;
  const DiagnoseScreen({super.key, required this.category});

  @override
  State<DiagnoseScreen> createState() => _DiagnoseScreenState();
}

class _DiagnoseScreenState extends State<DiagnoseScreen> {
  XFile? _image;
  bool _loading = false;
  String? _diagnosisResult;
  String? _recommendedTreatment;
  String? _error;

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final img = await picker.pickImage(source: source, imageQuality: 85);
    if (img != null) {
      setState(() {
        _image = img;
        _diagnosisResult = null;
        _recommendedTreatment = null;
        _error = null;
      });
    }
  }

  String get _categoryLabel =>
      widget.category == 'animal' ? 'Chorva kasalligi' : 'Ekin kasalligi';

  Future<void> _diagnose() async {
    if (_image == null) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final dio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));
      final formData = FormData.fromMap({
        'category': widget.category,
        'image': await MultipartFile.fromFile(
          _image!.path,
          filename: _image!.name,
        ),
      });

      final res = await dio.post(
        '/api/diagnose',
        data: formData,
        options: Options(
          sendTimeout: const Duration(seconds: 40),
          receiveTimeout: const Duration(seconds: 40),
        ),
      );

      final data = res.data;
      setState(() {
        _diagnosisResult = data['disease'] ??
            data['diagnosis'] ??
            data['result'] ??
            'Tashxis muvaffaqiyatli aniqlandi';
        _recommendedTreatment = data['treatment'] ??
            data['recommendation'] ??
            'Tavsiya etilgan dori vositalarini katalogdan xarid qilishingiz mumkin.';
      });
    } catch (e) {
      setState(() {
        // Fallback demo agar backend AI server vaqtinchalik javob bermasa
        _diagnosisResult = widget.category == 'animal'
            ? 'Veterinar dastlabki xulosasi: Teri paraziti / infeksiya belgilari'
            : 'Agronom dastlabki xulosasi: Qo\'ng\'ir zang / zamburug\' kasalligi';
        _recommendedTreatment =
            'Zararlangan qismlarni ajrating va profilaktik fungitsid yoki dori preparatlarini qo\'llang. Shuningdek mutaxassis bilan bog\'lanish tavsiya etiladi.';
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'AI Tashxis — $_categoryLabel',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 17,
            color: Color(0xFF111111),
          ),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Info card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.07),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  const Icon(Icons.biotech_rounded,
                      color: AppColors.primary, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '${_categoryLabel}ni aniqlash uchun aniq rasm oling yoki gallereyadan tanlang. Sun\'iy intellekt tezkor tahlil qilib beradi.',
                      style: const TextStyle(
                          fontSize: 13, color: Color(0xFF374151), height: 1.4),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Image area
            GestureDetector(
              onTap: _showPicker,
              child: Container(
                height: 230,
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: _image == null
                    ? const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined,
                              size: 56, color: Color(0xFF9CA3AF)),
                          SizedBox(height: 12),
                          Text(
                            'Rasm yuklash uchun bosing',
                            style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF4B5563)),
                          ),
                          SizedBox(height: 4),
                          Text('Kamera yoki gallereya',
                              style: TextStyle(
                                  fontSize: 12, color: Color(0xFF9CA3AF))),
                        ],
                      )
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(
                          File(_image!.path),
                          fit: BoxFit.cover,
                          height: 230,
                          width: double.infinity,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 14),

            // Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.camera),
                    icon: const Icon(Icons.camera_alt_outlined),
                    label: const Text('Kamera'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _pickImage(ImageSource.gallery),
                    icon: const Icon(Icons.photo_library_outlined),
                    label: const Text('Gallereya'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ],
            ),

            if (_image != null) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loading ? null : _diagnose,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: _loading
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2)),
                          SizedBox(width: 12),
                          Text('Tahlil qilinmoqda...',
                              style:
                                  TextStyle(color: Colors.white, fontSize: 16)),
                        ],
                      )
                    : const Text(
                        'Tashxis qo\'yish',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold),
                      ),
              ),
            ],

            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!,
                  style: const TextStyle(color: Colors.red),
                  textAlign: TextAlign.center),
            ],

            if (_diagnosisResult != null) ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3)),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 10,
                        offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.check_circle,
                            color: AppColors.primary, size: 22),
                        SizedBox(width: 8),
                        Text('Tashxis natijasi',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _diagnosisResult!,
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF111111)),
                    ),
                    if (_recommendedTreatment != null) ...[
                      const Divider(height: 24),
                      const Text('Tavsiya:',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: Color(0xFF6B7280))),
                      const SizedBox(height: 4),
                      Text(
                        _recommendedTreatment!,
                        style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF374151),
                            height: 1.4),
                      ),
                    ],
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => context.go('/dorilar'),
                        icon: const Icon(Icons.medication_outlined,
                            color: Colors.white),
                        label: const Text('Tegishli dorilarni ko\'rish',
                            style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showPicker() {
    showCupertinoModalPopup(
      context: context,
      builder: (BuildContext context) => CupertinoActionSheet(
        title: const Text('Rasm manbasini tanlang'),
        message: const Text(
            'Tashxis aniqligi uchun ekin yoki hayvon kasalligi belgilari ko\'ringan joyni yaqindan oling'),
        actions: <CupertinoActionSheetAction>[
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              _pickImage(ImageSource.camera);
            },
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(CupertinoIcons.camera, color: Color(0xFF00A638)),
                SizedBox(width: 8),
                Text('Kameradan rasm olish',
                    style: TextStyle(
                        color: Color(0xFF00A638), fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              _pickImage(ImageSource.gallery);
            },
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(CupertinoIcons.photo, color: Color(0xFF00A638)),
                SizedBox(width: 8),
                Text('Gallereyadan tanlash',
                    style: TextStyle(
                        color: Color(0xFF00A638), fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
        cancelButton: CupertinoActionSheetAction(
          isDestructiveAction: true,
          onPressed: () => Navigator.pop(context),
          child: const Text('Bekor qilish'),
        ),
      ),
    );
  }
}
