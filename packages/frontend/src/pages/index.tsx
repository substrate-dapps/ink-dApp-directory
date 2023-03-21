import { AppShell, Navbar, Header } from '@mantine/core'
import { Badge, Box, NavLink } from '@mantine/core'
import {
  IconHome2,
  IconGauge,
  IconChevronRight,
  IconActivity,
  IconCircleOff,
  IconBuildingSkyscraper,
} from '@tabler/icons-react'
import { useRouter } from 'next/router'

import { HomePageTitle } from '@components/home/HomePageTitle'
import { ChainInfo } from '@components/web3/ChainInfo'
import { ConnectButton } from '@components/web3/ConnectButton'
import { GreeterContractInteractions } from '@components/web3/GreeterContractInteractions'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import 'twin.macro'

const HomePage: NextPage = () => {
  const router = useRouter()
  const { error } = useInkathon()
  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <HomePageTitle />
      <ChainInfo />
    </>
  )
}

export default HomePage
