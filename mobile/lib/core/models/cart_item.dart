import 'medicine.dart';

class CartItem {
  final Medicine medicine;
  int qty;

  CartItem({required this.medicine, this.qty = 1});

  int get quantity => qty;
  set quantity(int v) => qty = v;

  double get subtotal => (medicine.price ?? 0) * qty;
  double get totalPrice => subtotal;

  Map<String, dynamic> toJson() => {
        'medicineId': medicine.id,
        'medicineName': medicine.name,
        'qty': qty,
        'price': medicine.price,
        'pharmacyId': medicine.pharmacyId,
        'pharmacyName': medicine.pharmacyName,
        'pharmacyPhone': medicine.pharmacyPhone,
      };
}
