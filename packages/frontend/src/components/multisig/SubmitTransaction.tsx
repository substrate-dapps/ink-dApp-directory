import { useState } from 'react'
import { Button, Center, Card, TextInput, Text, useMantineTheme, Divider } from '@mantine/core'
import { useForm } from '@mantine/form'
import { ContractIds } from '@deployments/deployments'
import {
  contractTx,
  unwrapResultOrError,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import toast from 'react-hot-toast'
import { blake2AsHex } from '@polkadot/util-crypto'

export const SubmitTransaction = () => {
  const { api, activeAccount, isConnected, activeSigner } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.DNS)
  const [updateIsLoading, setUpdateIsLoading] = useState<boolean>()
  const form = useForm<{ name: string }>()
  const theme = useMantineTheme()

  const submitTransaction = async () => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }
    setUpdateIsLoading(true)
    toast.loading('Submitting transaction…', { id: `submitTransaction` })
    try {
      const name = form.values.name
      const hash = blake2AsHex(name)
      await contractTx(api, activeAccount.address, contract, 'submitTransaction', {}, [hash])
      toast.success(`Transaction submitted successfully for ${name}!`)
      form.reset()
    } catch (e: any) {
      toast.error('Error while submitting transaction. Try again…')
    } finally {
      setUpdateIsLoading(false)
      toast.dismiss(`submitTransaction`)
    }
  }

  if (!contract) return null

  return (
    <Card shadow="sm" padding={theme.spacing.md}>
      <Text size="lg">Submit Transaction</Text>
      <Divider size="sm" my={20} />
      {!!isConnected && (
        <form>
          <TextInput label="Name" disabled={updateIsLoading} {...form.getInputProps('name')} />
          <Divider size="sm" my={20} />
          <Button
            variant="outline"
            disabled={updateIsLoading}
            onClick={submitTransaction}
            loading={updateIsLoading}
          >
            Submit Transaction
          </Button>
        </form>
      )}
    </Card>
  )
}
