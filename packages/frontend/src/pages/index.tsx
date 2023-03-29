import { HomePageTitle } from '@components/home/HomePageTitle'
import { ChainInfo } from '@components/web3/ChainInfo'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import 'twin.macro'

const HomePage: NextPage = () => {
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
