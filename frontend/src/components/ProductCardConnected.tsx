"use client";

import { useProductActions } from "@/hooks/useProductActions";
import { ProductCardUI, type ProductCardProps } from "@/components/ProductCard";

const EMPTY_MEDICINE = { id: 0, name: "" };

export default function ProductCardConnected(props: ProductCardProps) {
  const item = props.product ?? props.medicine;
  const targetItem = item ?? EMPTY_MEDICINE;

  const {
    liked,
    qty,
    ratingStats,
    addToCart,
    changeQty,
    toggleFavorite,
  } = useProductActions(targetItem, props.pharmacy);

  if (!item) return null;

  return (
    <ProductCardUI
      {...props}
      product={item}
      qty={props.qty !== undefined ? props.qty : qty}
      isFavorite={props.isFavorite !== undefined ? props.isFavorite : liked}
      ratingAvg={props.ratingAvg !== undefined ? props.ratingAvg : ratingStats.avg}
      ratingCount={props.ratingCount !== undefined ? props.ratingCount : ratingStats.count}
      onAdd={props.onAdd ?? addToCart}
      onChangeQty={props.onChangeQty ?? changeQty}
      onToggleFavorite={props.onToggleFavorite ?? toggleFavorite}
    />
  );
}

