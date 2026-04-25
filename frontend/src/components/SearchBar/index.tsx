import { SearchBar as MobileSearchBar } from 'antd-mobile';

interface Props {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
}

export function SearchBar({ value, placeholder, onChange, onSearch }: Props) {
  return (
    <MobileSearchBar
      value={value}
      placeholder={placeholder ?? '请输入关键词'}
      onChange={onChange}
      onSearch={onSearch}
      showCancelButton
    />
  );
}
