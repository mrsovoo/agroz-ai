import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/theme/home_theme_tokens.dart';
import '../../../shared/widgets/catalog_search_bar.dart';
import '../../../shared/widgets/empty_view.dart';
import '../../home/providers/home_providers.dart';
import '../../home/widgets/home_floating_nav.dart';
import '../../home/widgets/home_header.dart';
import '../../home/widgets/home_medicines_section.dart';

/// Figma "Dorilar" tab: header, Qidiruv, Barchasi/Chorva/Ekin, 2-column grid.
class MedicinesScreen extends ConsumerStatefulWidget {
  const MedicinesScreen({super.key});

  @override
  ConsumerState<MedicinesScreen> createState() => _MedicinesScreenState();
}

class _MedicinesScreenState extends ConsumerState<MedicinesScreen> {
  static const _filters = ['Barchasi', 'Chorva', 'Ekin'];
  static const _filterTypes = [null, 'animal', 'crop'];

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
    final type = _filterTypes[_filter];
    final q = _query.trim().toLowerCase();
    final items = ref.watch(catalogMedicinesProvider).where((m) {
      if (type != null && m.type != type) return false;
      if (q.isNotEmpty && !m.name.toLowerCase().contains(q)) return false;
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
                  child: Container(
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: tokens.productSectionBg,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: items.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.only(top: 40),
                            child: EmptyView(message: AppStrings.medicinesEmpty),
                          )
                        : GridView.builder(
                            physics: const BouncingScrollPhysics(
                              parent: AlwaysScrollableScrollPhysics(),
                            ),
                            padding: const EdgeInsets.fromLTRB(10, 10, 10, 120),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 8,
                              mainAxisSpacing: 10,
                              mainAxisExtent: 335,
                            ),
                            itemCount: items.length,
                            itemBuilder: (context, i) => MedicineCard(
                              medicine: items[i],
                              tokens: tokens,
                              width: null,
                            ),
                          ),
                  ),
                ),
              ],
            ),
            const Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: HomeFloatingNav(activeIndex: 1),
            ),
          ],
        ),
      ),
    );
  }
}
