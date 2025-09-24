import { ChangeEvent } from 'react'

export type SearchBoxProps = {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  className?: string
}

const SearchBox = ({ value, onChange, label, placeholder, className }: SearchBoxProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <div className={className}>
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  )
}

export default SearchBox
