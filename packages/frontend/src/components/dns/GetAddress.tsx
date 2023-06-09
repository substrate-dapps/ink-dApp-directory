import { useState } from 'react'
import { Button, Center, Card, TextInput, Text, useMantineTheme, Divider } from '@mantine/core'
import { useForm } from '@mantine/form'
import { ContractIds } from '@deployments/deployments'
import { contractTx, useInkathon, useRegisteredContract } from '@scio-labs/use-inkathon'
import toast from 'react-hot-toast'
import { blake2AsHex } from '@polkadot/util-crypto'

export const GetAddress = () => {
  const { api, activeAccount, isConnected, activeSigner } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.DNS)
  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>()
  const form = useForm<{ name: string }>({
    initialValues: {
      name: '',
    },
  })
  const theme = useMantineTheme()

  const onSubmit = async () => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }
    setUpdateIsLoading(true)

    toast.loading('Executing contractTx', { id: `update` })

    try {
      const name = form.values.name
      const hash = blake2AsHex(name)
      const result = await contractTx(api, activeAccount.address, contract, 'getAddress', {}, [
        hash,
      ])

      console.log('result', result)

      toast.success(`Successfully registered ${name}!`)
    } catch (e: any) {
      if (e?.errorMessage?.includes('NameAlreadyExists')) {
        form.setFieldError('name', 'Name already exists')
        return
      }
      toast.error('Error while registering name. Try again…')
    } finally {
      setUpdateIsLoading(false)
      toast.dismiss(`update`)
    }
  }

  if (!contract) return null

  return (
    <Card shadow="sm" padding={theme.spacing.md}>
      <Text size="lg">Get address</Text>
      {!!isConnected && (
        <form>
          <TextInput label="Name" disabled={updateIsLoading} {...form.getInputProps('name')} />
          <Divider size="sm" my={20} />
          <Button
            variant="outline"
            disabled={updateIsLoading}
            onClick={onSubmit}
            loading={updateIsLoading}
          >
            Get address
          </Button>
        </form>
      )}
    </Card>
  )
}
