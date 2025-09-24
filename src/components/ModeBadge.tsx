export type ModeBadgeProps = {
  mode: 'edit' | 'readonly'
}

const ModeBadge = ({ mode }: ModeBadgeProps) => {
  const label = mode === 'edit' ? '編集モード' : '閲覧モード'

  return (
    <span aria-label={`現在のモード: ${label}`} data-testid="mode-badge">
      {label}
    </span>
  )
}

export default ModeBadge
