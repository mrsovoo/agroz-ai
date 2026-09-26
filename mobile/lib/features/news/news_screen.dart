import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class NewsScreen extends StatefulWidget {
  const NewsScreen({super.key});

  @override
  State<NewsScreen> createState() => _NewsScreenState();
}

class _NewsScreenState extends State<NewsScreen> {
  String _selectedTag = 'all';

  @override
  Widget build(BuildContext context) {
    final filteredNews = _sampleNews.where((n) {
      if (_selectedTag == 'all') return true;
      return n['tagKey'] == _selectedTag;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(CupertinoIcons.back,
              color: Color(0xFF111827), size: 26),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'Foydali maslahatlar',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 18,
            color: Color(0xFF111827),
          ),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              child: Row(
                children: [
                  _chip('Barchasi', 'all'),
                  const SizedBox(width: 8),
                  _chip('🌱 Ekin parvarishi', 'crop'),
                  const SizedBox(width: 8),
                  _chip('🐄 Chorvachilik', 'animal'),
                  const SizedBox(width: 8),
                  _chip('🌿 Texnologiyalar', 'agri'),
                ],
              ),
            ),
          ),

          // News List
          Expanded(
            child: ListView.separated(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.all(16),
              itemCount: filteredNews.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (ctx, i) => _NewsCard(
                news: filteredNews[i],
                onTap: () => _openArticleModal(context, filteredNews[i]),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, String key) {
    final active = _selectedTag == key;
    return GestureDetector(
      onTap: () => setState(() => _selectedTag = key),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : const Color(0xFF4B5563),
          ),
        ),
      ),
    );
  }

  void _openArticleModal(BuildContext context, Map<String, String> item) {
    showCupertinoModalPopup(
      context: context,
      builder: (ctx) => Material(
        color: Colors.transparent,
        child: Container(
          height: MediaQuery.of(context).size.height * 0.75,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: const Color(0xFFD1D5DB),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              item['tag']!,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            item['date']!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF9CA3AF),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Text(
                        item['title']!,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF111827),
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        item['full'] ?? item['body']!,
                        style: const TextStyle(
                          fontSize: 15,
                          color: Color(0xFF374151),
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.lightbulb_outline_rounded,
                                color: AppColors.primary, size: 22),
                            SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Qo\'shimcha savollar bo\'lsa, "Mutaxassis" bo\'limida agronom yoki veterinar bilan to\'g\'ridan-to\'g\'ri maslahatlashing.',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF166534),
                                  height: 1.4,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 30),
                    ],
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'Tushunarli',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
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

const _sampleNews = [
  {
    'title': 'Bahor ekinlarini kasalliklardan saqlash',
    'body':
        'Bahorda havo harorati ko\'tarilishi va namlik ortishi natijasida zamburug\'li hamda bakterial kasalliklar faollashadi. Profilaktik purkash va mineral oziqlantirishni o\'z vaqtida amalga oshiring...',
    'full':
        'Bahorda havo harorati ko\'tarilishi va namlik ortishi natijasida zamburug\'li hamda bakterial kasalliklar faollashadi. \n\n1. O\'z vaqtida profilaktika: Zang, un-shudring va chirish kasalliklariga qarshi sertifikatlangan fungitsidlar bilan dastlabki ishlov berish tavsiya qilinadi.\n\n2. Ildiz tizimini mustahkamlash: Fosfor va kaliyga boy organik o\'g\'itlar ekinlarning sovuqqa va kasalliklarga chidamliligini 40% ga oshiradi.\n\n3. Mutaxassis ko\'rigi: Ekin maydonida kasallik alomatlari paydo bo\'lganda, Agroz AI ilovasidagi "AI Tashxis" xizmati orqali rasmga olib tahlil qiling.',
    'tag': '🌱 Ekin',
    'tagKey': 'crop',
    'date': '2024-04-10',
  },
  {
    'title': 'Chorva mollari uchun bahorgi vitaminlar',
    'body':
        'Qish faslidan so\'ng qoramol va qo\'ylarda vitamin yetishmovchiligi (gipovitaminoz) ko\'p uchraydi. A, D3, E vitamin kompleksi hamda mineral bloklar tavsiya etiladi...',
    'full':
        'Qish faslidan so\'ng qoramol va qo\'ylarda vitamin yetishmovchiligi ko\'p uchraydi. Bu sut mahsuldorligini kamaytiradi va yosh mollarning o\'sishini susaytiradi.\n\n1. Kerakli vitaminlar: Ayniqsa A, D3, E guruh vitaminlari hamda kalsiy-fosfor balansini to\'ldirish zarur.\n\n2. Bento Max va premikslar: Kunlik ratsionga mineral qo\'shimchalar qo\'shish hazm qilish tizimini yaxshilaydi.\n\n3. Emlash: Bahorgi emlash taqvimi bo\'yicha veterinaringiz bilan maslahatlashing.',
    'tag': '🐄 Chorva',
    'tagKey': 'animal',
    'date': '2024-04-08',
  },
  {
    'title': 'Tomchilatib sug\'orish tizimining afzalliklari',
    'body':
        'Suv resurslarini tejash va hosildorlikni 30-50% oshirish uchun tomchilatib sug\'orish texnologiyasi eng samarali usul hisoblanadi...',
    'full':
        'Suv resurslarini tejash va hosildorlikni oshirish uchun zamonaviy tomchilatib sug\'orish tizimi:\n\n1. Suv tejami: An\'anaviy ariqdan sug\'orishga nisbatan 50-60% gacha suv tejaladi.\n\n2. O\'g\'itlarni samarali yetkazish: O\'g\'itlar suv bilan birga to\'g\'ridan-to\'g\'ri ildiz zonasiga yuboriladi.\n\n3. Begona o\'tlarning kamayishi: Qator oralari quruq qolgani sababli begona o\'tlar o\'smaydi.',
    'tag': '🌿 Texnologiya',
    'tagKey': 'agri',
    'date': '2024-04-05',
  },
];

class _NewsCard extends StatelessWidget {
  final Map<String, String> news;
  final VoidCallback onTap;

  const _NewsCard({required this.news, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    news['tag']!,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  news['date']!,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF9CA3AF),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              news['title']!,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              news['body']!,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF6B7280),
                height: 1.4,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}
