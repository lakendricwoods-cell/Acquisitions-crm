type SearchBarProps = {
  placeholder: string
}

export default function SearchBar({
  placeholder,
}: SearchBarProps) {
  return (
    <div className="crm-search-wrap">
      <span className="crm-search-icon">⌕</span>
      <input className="crm-search" placeholder={placeholder} />
    </div>
  )
}