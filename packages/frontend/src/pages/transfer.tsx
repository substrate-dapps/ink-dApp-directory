import { Center, SimpleGrid, Text } from '@mantine/core'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { GiveMe, WasItTen, Register } from '@components/transfer'

const Transfer: NextPage = () => {
  const { error } = useInkathon()

  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <Center mb={20}>
        <Text size="lg">Transfer Smart Contract</Text>
      </Center>
      <SimpleGrid cols={3}>
        <GiveMe />
        <WasItTen />
      </SimpleGrid>
    </>
  )
}

export default Transfer
