import { SearchBar as MobileSearchBar } from 'antd-mobile';
import type { ComponentProps } from 'react';

type MobileSearchBarProps = ComponentProps<typeof MobileSearchBar>;

interface Props {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
}

export function SearchBar({ value, placeholder, onChange, onSearch, ...rest }: Props & Omit<MobileSearchBarProps, 'value' | 'onChange' | 'onSearch'>) {
  return (
    <MobileSearchBar
      value={value}
      placeholder={placeholder ?? '请输入关键词'}
      onChange={onChange}
      onSearch={onSearch}
      {...rest}
      showCancelButton
    />
  );
}
