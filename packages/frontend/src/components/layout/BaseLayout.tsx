import { FC, PropsWithChildren } from 'react'
import { AppShell, Navbar, Header, NavLink, Box } from '@mantine/core'
import { IconHome2, IconPlus, IconWorldWww } from '@tabler/icons-react'
import { useRouter } from 'next/router'

import { ConnectButton } from '@components/web3/ConnectButton'
import { ChainInfo } from '@components/web3/ChainInfo'

const routes = [
  {
    label: 'Home',
    icon: <IconHome2 size="1rem" stroke={1.5} />,
    path: '/',
  },
  {
    label: 'DNS',
    icon: <IconWorldWww size="1rem" stroke={1.5} />,
    path: '/dns',
  },
  {
    label: 'Incrementer',
    icon: <IconPlus size="1rem" stroke={1.5} />,
    path: '/incrementer',
  },
]

export const BaseLayout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter()

  return (
    <AppShell
      padding="md"
      navbar={
        <Navbar width={{ base: 300 }} height="100vh" p="xs">
          {routes.map((route) => (
            <NavLink
              key={route.path}
              label={route.label}
              icon={route.icon}
              onClick={() => router.push(route.path)}
            />
          ))}
          <Box pt="64vh">
            <ChainInfo />
          </Box>
        </Navbar>
      }
      header={
        <Header height={80} p="xs">
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
