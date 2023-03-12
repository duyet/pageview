import Image from 'next/image'
import Link from 'next/link'

import styles from './Header.module.css'
import logo from '../public/logo.png'

export const Header = () => {
  return (
    <div className={styles.description}>
      <Link href="/">
        <p>
          <code className={styles.code}>pageview</code>
        </p>
      </Link>
      <div>
        <a href="https://duyet.net" target="_blank" rel="noopener noreferrer">
          <Image
            src={logo}
            alt="Logo"
            className={styles.vercelLogo}
            width={50}
            height={50}
            priority
          />
        </a>
      </div>
    </div>
  )
}
