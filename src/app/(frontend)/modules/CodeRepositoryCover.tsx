import styles from './cabinet.module.css'

const coverTones = ['slate', 'moss', 'aubergine', 'copper'] as const

export function CodeRepositoryCover({ name, repository }: { name: string; repository: string }) {
  let hash = 0
  for (const character of repository) hash = (hash * 31 + character.charCodeAt(0)) | 0
  const tone = coverTones[Math.abs(hash % coverTones.length)]

  return (
    <div className={`${styles.codeCover} ${styles[`codeCover_${tone}`]}`} role="img" aria-label={`Repository cover for ${name}`}>
      <span className={styles.codeCoverMark} aria-hidden="true">{'</>'}</span>
      <span className={styles.codeCoverText}>
        <span className={styles.codeCoverEyebrow}>Guild code / repository</span>
        <strong>{name}</strong>
        <small>{repository}</small>
      </span>
    </div>
  )
}
