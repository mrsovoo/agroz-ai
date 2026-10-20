import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Figma "Qidiruv" search field + 3 equal filter chips (Dorilar / Mutaxasislar).
class CatalogSearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onQueryChanged;
  final List<String> filters;
  final int selectedFilter;
  final ValueChanged<int> onFilterSelected;

  const CatalogSearchBar({
    super.key,
    required this.controller,
    required this.onQueryChanged,
    required this.filters,
    required this.selectedFilter,
    required this.onFilterSelected,
  });

  static const _green = Color(0xFF35CA56);
  static const _border = Color(0xFFBDBDBD);
  static const _text = Color(0xFF3F3F3F);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        children: [
          // Search field
          Container(
            height: 50,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(25),
              border: Border.all(color: _border, width: 1),
            ),
            alignment: Alignment.center,
            child: TextField(
              controller: controller,
              onChanged: onQueryChanged,
              textInputAction: TextInputAction.search,
              cursorColor: _green,
              style: const TextStyle(
                color: Colors.black,
                fontSize: 16,
                fontFamily: 'PingFang SC',
                fontWeight: FontWeight.w500,
              ),
              decoration: const InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                hintText: 'Qidiruv',
                hintStyle: TextStyle(
                  color: _text,
                  fontSize: 16,
                  fontFamily: 'PingFang SC',
                  fontWeight: FontWeight.w500,
                ),
                contentPadding: EdgeInsets.symmetric(horizontal: 16),
              ),
            ),
          ),
          const SizedBox(height: 8),

          // Filter chips
          Row(
            children: [
              for (int i = 0; i < filters.length; i++) ...[
                if (i > 0) const SizedBox(width: 10),
                Expanded(
                  child: _Chip(
                    label: filters[i],
                    active: i == selectedFilter,
                    onTap: () {
                      HapticFeedback.selectionClick();
                      onFilterSelected(i);
                    },
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _Chip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: active,
      label: label,
      child: Material(
        color: active ? CatalogSearchBar._green : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: active
              ? BorderSide.none
              : const BorderSide(color: CatalogSearchBar._border, width: 1),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            constraints: const BoxConstraints(minHeight: 38),
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: active ? Colors.white : CatalogSearchBar._text,
                fontSize: 13,
                fontFamily: 'PingFang SC',
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
