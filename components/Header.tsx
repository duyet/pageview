import Image from 'next/image'
import Link from 'next/link'
import { Flex, Title } from '@tremor/react'

import logo from '../public/logo.png'

export const Header = () => {
  return (
    <Flex justifyContent="between" alignItems="center" className={'mb-10'}>
      <Flex justifyContent="start">
        <Link href={'/'}>
          <Title className={'text-pre'}>pageview</Title>
        </Link>
      </Flex>

      <div>
        <a href="https://duyet.net" target="_blank" rel="noopener noreferrer">
          <Image src={logo} alt="Logo" width={50} height={50} priority />
        </a>
      </div>
    </Flex>
  )
}
