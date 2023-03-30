import { useInkathon } from '@scio-labs/use-inkathon'
import type { NextPage } from 'next'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { GetAddress, Register, Transfer } from '@components/dns'

const DNS: NextPage = () => {
  const { error } = useInkathon()

  useEffect(() => {
    if (!error) return
    toast.error(error.message)
  }, [error])

  return (
    <>
      <Register />
      <Transfer />
      <GetAddress />
    </>
  )
}

export default DNS
