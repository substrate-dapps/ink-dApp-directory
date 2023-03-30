import { Center, SimpleGrid, Text } from '@mantine/core'
import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { GetAddress, GetOwner, Register, Transfer } from '@components/dns'

const DNS: NextPage = () => {
  const { error } = useInkathon()

  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <Center mb={20}>
        <Text size="lg">DNS Smart Contract</Text>
      </Center>
      <SimpleGrid cols={3}>
        <Register />
        <Transfer />
        <GetAddress />
        <GetOwner />
      </SimpleGrid>
    </>
  )
}

export default DNS
