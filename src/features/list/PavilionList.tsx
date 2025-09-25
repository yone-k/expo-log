import { useMemo, useState, ChangeEvent } from 'react'
import { useVisitedState } from '../../hooks/useVisitedState'
import SearchBox from '../../components/SearchBox'

const SEARCH_LABEL = 'パビリオンを検索'

const normalize = (value: string) => value.trim().toLowerCase()

function PavilionList() {
  const {
    pavilions,
    visitedState,
    toggleVisited,
    isEditMode,
  } = useVisitedState()

  const [query, setQuery] = useState('')

  const filteredPavilions = useMemo(() => {
    const normalizedQuery = normalize(query)

    if (normalizedQuery === '') {
      return pavilions
    }

    return pavilions.filter(pavilion =>
      normalize(pavilion.name).includes(normalizedQuery) ||
      normalize(pavilion.id).includes(normalizedQuery),
    )
  }, [pavilions, query])

  const handleSearchChange = (value: string) => {
    setQuery(value)
  }

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const pavilionId = event.target.value
    toggleVisited(pavilionId)
  }

  return (
    <div className="pavilion-list" role="group" aria-label="パビリオン一覧">
      <SearchBox
        value={query}
        onChange={handleSearchChange}
        label={SEARCH_LABEL}
        placeholder="キーワードで絞り込み"
        className="pavilion-search"
      />

      <ul aria-live="polite" className="pavilion-list-items">
        {filteredPavilions.map(pavilion => {
          const checked = Boolean(visitedState[pavilion.id])

          return (
            <li key={pavilion.id}>
              <label className="pavilion-list-item">
                <input
                  type="checkbox"
                  value={pavilion.id}
                  checked={checked}
                  onChange={handleCheckboxChange}
                  disabled={!isEditMode}
                />
                <span>{pavilion.name}</span>
              </label>
            </li>
          )
        })}

        {filteredPavilions.length === 0 && (
          <li className="pavilion-list-empty">該当するパビリオンがありません</li>
        )}
      </ul>
    </div>
  )
}

export default PavilionList
