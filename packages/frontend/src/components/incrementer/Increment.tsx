import { useEffect, useState } from 'react'
import {
  Button,
  Center,
  Card,
  TextInput,
  Input,
  Text,
  useMantineTheme,
  Divider,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { ContractIds } from '@deployments/deployments'
import {
  contractQuery,
  contractTx,
  unwrapResultOrError,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import toast from 'react-hot-toast'

export const Increment = () => {
  const { api, activeAccount, isConnected, activeSigner } = useInkathon()
  const { contract, address: contractAddress } = useRegisteredContract(ContractIds.Incrementer)
  const [greeterMessage, setGreeterMessage] = useState<string>()
  const [fetchIsLoading, setFetchIsLoading] = useState<boolean>()
  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>()
  const form = useForm<{ incBy: number }>()
  const theme = useMantineTheme()

  const fetchGet = async () => {
    if (!contract || !api) return

    setFetchIsLoading(true)
    try {
      const result = await contractQuery(api, '', contract, 'get')
      const message = unwrapResultOrError<string>(result)
      setGreeterMessage(message)
    } catch (e) {
      toast.error('Error while fetching increment result. Try again…')
      setGreeterMessage(undefined)
    } finally {
      setFetchIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGet()
  }, [contract])

  const inc = async () => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }
    setUpdateIsLoading(true)
    toast.loading('Incrementing…', { id: `update` })
    try {
      const incBy = form.values.incBy
      await contractTx(api, activeAccount.address, contract, 'inc', {}, [incBy])
      toast.success(`Successfully incremented`)
      form.reset()
    } catch (e: any) {
      console.log(e)
      return form.setFieldError('incBy', 'Invalid character, please use a number')
      const isInvalidChar = e?.includes('Invalid character')
      if (isInvalidChar) {
        form.setFieldError('incBy', 'Invalid character, please use a number')
      }
      toast.error('Error while incrementing. Try again.')
    } finally {
      setUpdateIsLoading(false)
      toast.dismiss(`update`)
      fetchGet()
    }
  }

  if (!contract) return null

  return (
    <Center>
      <div style={{ width: '20rem' }}>
        <Card shadow="sm" padding={theme.spacing.md}>
          <Text size="lg">Incrementer Smart Contract</Text>
          <Divider size="sm" my={20} />
          <Text size="md">Result</Text>
          <Input placeholder={fetchIsLoading ? 'Loading…' : greeterMessage} disabled={true} />
          {!!isConnected && (
            <form>
              <TextInput
                label="Increment"
                disabled={updateIsLoading}
                {...form.getInputProps('incBy')}
              />
              <Divider size="sm" my={20} />
              <Button
                variant="outline"
                disabled={updateIsLoading}
                onClick={inc}
                loading={updateIsLoading}
              >
                Increment
              </Button>
            </form>
          )}
        </Card>
      </div>
    </Center>
  )
}
