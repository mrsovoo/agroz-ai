import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cart_item.dart';

class CartState {
  final List<CartItem> items;

  const CartState({this.items = const []});

  int get totalCount => items.fold(0, (sum, it) => sum + it.quantity);
  int get totalPrice => items.fold(0, (sum, it) => sum + it.total);

  CartState copyWith({List<CartItem>? items}) {
    return CartState(items: items ?? this.items);
  }
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(const CartState());

  void addItem({
    required int medicineId,
    required int pharmacyId,
    required String name,
    required int price,
    String stockUnit = 'dona',
  }) {
    final existingIndex = state.items.indexWhere((it) => it.medicineId == medicineId);
    if (existingIndex != -1) {
      final updatedList = List<CartItem>.from(state.items);
      final current = updatedList[existingIndex];
      updatedList[existingIndex] = current.copyWith(quantity: current.quantity + 1);
      state = state.copyWith(items: updatedList);
    } else {
      final newItem = CartItem(
        medicineId: medicineId,
        pharmacyId: pharmacyId,
        name: name,
        price: price,
        quantity: 1,
        stockUnit: stockUnit,
      );
      state = state.copyWith(items: [...state.items, newItem]);
    }
  }

  void updateQuantity(int medicineId, int quantity) {
    if (quantity <= 0) {
      removeItem(medicineId);
      return;
    }
    final updatedList = state.items.map((it) {
      if (it.medicineId == medicineId) {
        return it.copyWith(quantity: quantity);
      }
      return it;
    }).toList();
    state = state.copyWith(items: updatedList);
  }

  void removeItem(int medicineId) {
    final filtered = state.items.where((it) => it.medicineId != medicineId).toList();
    state = state.copyWith(items: filtered);
  }

  void clear() {
    state = const CartState(items: []);
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});

