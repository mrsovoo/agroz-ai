import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cart_item.dart';

class CartState {
  final List<CartItem> items;

  const CartState({this.items = const []});

  int get totalCount => items.fold(0, (sum, it) => sum + it.quantity);
  int get totalPrice => items.fold(0, (sum, it) => sum + it.total);

  int get selectedCount =>
      items.where((it) => it.isSelected).fold(0, (sum, it) => sum + it.quantity);

  int get selectedSubtotal =>
      items.where((it) => it.isSelected).fold(0, (sum, it) => sum + ((it.oldPrice ?? it.price) * it.quantity));

  int get selectedDiscount =>
      items.where((it) => it.isSelected).fold(0, (sum, it) {
        if (it.oldPrice != null && it.oldPrice! > it.price) {
          return sum + ((it.oldPrice! - it.price) * it.quantity);
        }
        return sum;
      });

  int get selectedTotal =>
      items.where((it) => it.isSelected).fold(0, (sum, it) => sum + it.total);

  bool get isAllSelected => items.isNotEmpty && items.every((it) => it.isSelected);

  CartState copyWith({List<CartItem>? items}) {
    return CartState(items: items ?? this.items);
  }
}

const List<CartItem> figmaDemoCartItems = [
  CartItem(
    medicineId: 101,
    pharmacyId: 1,
    name: 'Mahsulot nomi',
    pharmacyName: 'Dorixona nomi',
    price: 35000,
    oldPrice: 45000,
    quantity: 1,
    imageUrl: 'assets/images/cart_bento_max.jpg',
    isSelected: true,
    isFavorite: false,
  ),
  CartItem(
    medicineId: 102,
    pharmacyId: 1,
    name: 'Mahsulot nomi',
    pharmacyName: 'Dorixona nomi',
    price: 35000,
    oldPrice: 45000,
    quantity: 1,
    imageUrl: 'assets/images/cart_agro_max.jpg',
    isSelected: true,
    isFavorite: false,
  ),
];

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier({List<CartItem>? initialItems})
      : super(CartState(items: initialItems ?? const []));

  bool _demoSeeded = false;

  void seedDemoIfEmpty() {
    if (!_demoSeeded && state.items.isEmpty) {
      _demoSeeded = true;
      state = state.copyWith(items: figmaDemoCartItems);
    }
  }

  void addItem({
    required int medicineId,
    required int pharmacyId,
    required String name,
    required int price,
    int? oldPrice,
    String? imageUrl,
    String pharmacyName = 'Dorixona nomi',
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
        pharmacyName: pharmacyName,
        name: name,
        price: price,
        oldPrice: oldPrice,
        quantity: 1,
        imageUrl: imageUrl,
        stockUnit: stockUnit,
        isSelected: true,
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

  void toggleSelect(int medicineId) {
    final updatedList = state.items.map((it) {
      if (it.medicineId == medicineId) {
        return it.copyWith(isSelected: !it.isSelected);
      }
      return it;
    }).toList();
    state = state.copyWith(items: updatedList);
  }

  void toggleSelectAll(bool selectAll) {
    final updatedList = state.items.map((it) {
      return it.copyWith(isSelected: selectAll);
    }).toList();
    state = state.copyWith(items: updatedList);
  }

  void toggleFavorite(int medicineId) {
    final updatedList = state.items.map((it) {
      if (it.medicineId == medicineId) {
        return it.copyWith(isFavorite: !it.isFavorite);
      }
      return it;
    }).toList();
    state = state.copyWith(items: updatedList);
  }

  void deleteSelected() {
    final remaining = state.items.where((it) => !it.isSelected).toList();
    state = state.copyWith(items: remaining);
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
