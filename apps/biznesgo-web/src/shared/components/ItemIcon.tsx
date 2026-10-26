import React from 'react';
import {
  Pill,
  Wheat,
  Sprout,
  Leaf,
  Tractor,
  Droplet,
  User,
  Store,
  Package,
} from 'lucide-react';

export type IconType =
  | 'pill'
  | 'wheat'
  | 'sprout'
  | 'leaf'
  | 'tractor'
  | 'droplet'
  | 'user'
  | 'store'
  | 'package'
  | 'pharmacy'
  | 'feed'
  | 'seeds'
  | 'greenhouse'
  | 'machinery';

interface ItemIconProps {
  type?: string;
  className?: string;
  variant?: 'plain' | 'contained' | 'badge';
  containerClassName?: string;
}

// BiznesGO brend ranglar identikasi (Logo: #35ca56 va #383838 ga moslashtirilgan)
const SECTOR_COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  pill: { bg: 'bg-[#eafaf0]', text: 'text-[#249b3e]', ring: 'ring-[#35ca56]/20' },
  pharmacy: { bg: 'bg-[#eafaf0]', text: 'text-[#249b3e]', ring: 'ring-[#35ca56]/20' },
  wheat: { bg: 'bg-[#fef8e7]', text: 'text-[#d97706]', ring: 'ring-[#f59e0b]/20' },
  feed: { bg: 'bg-[#fef8e7]', text: 'text-[#d97706]', ring: 'ring-[#f59e0b]/20' },
  sprout: { bg: 'bg-[#ecfdf5]', text: 'text-[#16a34a]', ring: 'ring-[#22c55e]/20' },
  seeds: { bg: 'bg-[#ecfdf5]', text: 'text-[#16a34a]', ring: 'ring-[#22c55e]/20' },
  leaf: { bg: 'bg-[#e6f7ef]', text: 'text-[#059669]', ring: 'ring-[#10b981]/20' },
  greenhouse: { bg: 'bg-[#e6f7ef]', text: 'text-[#059669]', ring: 'ring-[#10b981]/20' },
  tractor: { bg: 'bg-[#f1f5f9]', text: 'text-[#475569]', ring: 'ring-[#64748b]/20' },
  machinery: { bg: 'bg-[#f1f5f9]', text: 'text-[#475569]', ring: 'ring-[#64748b]/20' },
  droplet: { bg: 'bg-[#eff6ff]', text: 'text-[#2563eb]', ring: 'ring-[#3b82f6]/20' },
  store: { bg: 'bg-[#eafaf0]', text: 'text-[#35ca56]', ring: 'ring-[#35ca56]/20' },
  user: { bg: 'bg-[#f4f4f5]', text: 'text-[#52525b]', ring: 'ring-neutral-200' },
  default: { bg: 'bg-[#f7f7f5]', text: 'text-[#71717a]', ring: 'ring-neutral-200' },
};

export const ItemIcon: React.FC<ItemIconProps> = ({
  type,
  className = 'h-4 w-4',
  variant = 'plain',
  containerClassName = '',
}) => {
  const normalizedKey = (type || 'default').toLowerCase();
  const theme = SECTOR_COLOR_MAP[normalizedKey] || SECTOR_COLOR_MAP.default;

  const renderIcon = () => {
    const iconProps = { className, strokeWidth: 2 };
    switch (normalizedKey) {
      case 'pill':
      case 'pharmacy':
        return <Pill {...iconProps} />;
      case 'wheat':
      case 'feed':
        return <Wheat {...iconProps} />;
      case 'sprout':
      case 'seeds':
        return <Sprout {...iconProps} />;
      case 'leaf':
      case 'greenhouse':
        return <Leaf {...iconProps} />;
      case 'tractor':
      case 'machinery':
        return <Tractor {...iconProps} />;
      case 'droplet':
        return <Droplet {...iconProps} />;
      case 'user':
        return <User {...iconProps} />;
      case 'store':
        return <Store {...iconProps} />;
      default:
        return <Package {...iconProps} />;
    }
  };

  if (variant === 'contained') {
    return (
      <div
        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${theme.bg} ${theme.text} ${containerClassName}`}
      >
        {renderIcon()}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ring-1 ${theme.bg} ${theme.text} ${theme.ring} ${containerClassName}`}
      >
        {renderIcon()}
      </div>
    );
  }

  return renderIcon();
};
