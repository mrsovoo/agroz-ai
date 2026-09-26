import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/models/medicine.dart';
import '../../core/models/cart_item.dart';

class CartState {
  final List<CartItem> items;
  const CartState({this.items = const []});

  double get totalAmount => items.fold(0, (sum, item) => sum + item.subtotal);

  int get itemCount => items.fold(0, (sum, item) => sum + item.qty);

  bool containsMedicine(dynamic id) =>
      items.any((e) => e.medicine.id.toString() == id.toString());

  int qtyOf(dynamic id) => items
      .where((e) => e.medicine.id.toString() == id.toString())
      .fold(0, (s, e) => s + e.qty);

  CartState copyWith({List<CartItem>? items}) =>
      CartState(items: items ?? this.items);
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(const CartState()) {
    _load();
  }

  static const _key = 'cart_items_v2';

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return;
    try {
      jsonDecode(raw);
    } catch (_) {}
  }

  Future<void> _save() async {
    final prefs = await SharedPreferences.getInstance();
    final list = state.items.map((e) => e.toJson()).toList();
    await prefs.setString(_key, jsonEncode(list));
  }

  void addItem(Medicine medicine) {
    final items = List<CartItem>.from(state.items);
    final idx = items
        .indexWhere((e) => e.medicine.id.toString() == medicine.id.toString());
    if (idx >= 0) {
      items[idx] = CartItem(medicine: medicine, qty: items[idx].qty + 1);
    } else {
      items.add(CartItem(medicine: medicine));
    }
    state = state.copyWith(items: items);
    _save();
  }

  void removeOne(dynamic medicineId) {
    final items = List<CartItem>.from(state.items);
    final idx = items
        .indexWhere((e) => e.medicine.id.toString() == medicineId.toString());
    if (idx < 0) return;
    if (items[idx].qty > 1) {
      items[idx] =
          CartItem(medicine: items[idx].medicine, qty: items[idx].qty - 1);
    } else {
      items.removeAt(idx);
    }
    state = state.copyWith(items: items);
    _save();
  }

  void removeItem(dynamic medicineId) {
    final items = state.items
        .where((e) => e.medicine.id.toString() != medicineId.toString())
        .toList();
    state = state.copyWith(items: items);
    _save();
  }

  void clear() {
    state = const CartState();
    SharedPreferences.getInstance().then((p) => p.remove(_key));
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>(
  (ref) => CartNotifier(),
);
