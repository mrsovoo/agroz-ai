import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../../shared/widgets/catalog_search_bar.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../home/providers/home_providers.dart';
import '../../home/widgets/home_floating_nav.dart';
import '../../home/widgets/home_header.dart';
import '../../home/widgets/home_specialists_section.dart';

/// Figma "Mutaxasislar" tab: header, Qidiruv, Barchasi/Agronom/Veterinar, card list.
class SpecialistsScreen extends ConsumerStatefulWidget {
  const SpecialistsScreen({super.key});

  @override
  ConsumerState<SpecialistsScreen> createState() => _SpecialistsScreenState();
}

class _SpecialistsScreenState extends ConsumerState<SpecialistsScreen> {
  static const _filters = ['Barchasi', 'Agronom', 'Veterinar'];

  final _controller = TextEditingController();
  String _query = '';
  int _filter = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<HomeThemeTokens>() ?? HomeThemeTokens.light;
    final q = _query.trim().toLowerCase();
    final specialty = _filter == 0 ? null : _filters[_filter].toLowerCase();
    final items = ref.watch(catalogSpecialistsProvider).where((s) {
      if (specialty != null && (s.specialty ?? '').toLowerCase() != specialty) return false;
      if (q.isNotEmpty && !s.name.toLowerCase().contains(q)) return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: tokens.screenBackground,
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            Column(
              children: [
                const HomeHeader(),
                CatalogSearchBar(
                  controller: _controller,
                  onQueryChanged: (v) => setState(() => _query = v),
                  filters: _filters,
                  selectedFilter: _filter,
                  onFilterSelected: (i) => setState(() => _filter = i),
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: items.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.only(top: 40),
                          child: EmptyView(message: AppStrings.specialistsEmpty),
                        )
                      : ListView.builder(
                          physics: const BouncingScrollPhysics(
                            parent: AlwaysScrollableScrollPhysics(),
                          ),
                          padding: const EdgeInsets.fromLTRB(8, 0, 8, 120),
                          itemCount: items.length,
                          itemBuilder: (context, i) => SpecialistCard(
                            specialist: items[i],
                            tokens: tokens,
                          ),
                        ),
                ),
              ],
            ),
            const Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: HomeFloatingNav(activeIndex: 2),
            ),
          ],
        ),
      ),
    );
  }
}
