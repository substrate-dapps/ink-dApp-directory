import { FC, PropsWithChildren } from 'react'
import { AppShell, Navbar, Header, NavLink } from '@mantine/core'
import { IconHome2, IconPlus } from '@tabler/icons-react'
import { useRouter } from 'next/router'

import { ConnectButton } from '@components/web3/ConnectButton'

export const BaseLayout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter()

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar width={{ base: 300 }} height={500} p="xs">
          <NavLink
            label="Home"
            icon={<IconHome2 size="1rem" stroke={1.5} />}
            onClick={() => router.push('/')}
          />
          <NavLink
            label="Incrementer"
            icon={<IconPlus size="1rem" stroke={1.5} />}
            onClick={() => router.push('/incrementer')}
          />
        </Navbar>
      }
      header={
        <Header height={60} p="xs">
          <ConnectButton />
        </Header>
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      })}
    >
      {children}
    </AppShell>
  )
}
