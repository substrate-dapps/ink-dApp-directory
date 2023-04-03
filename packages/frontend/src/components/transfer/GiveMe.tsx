import { useState } from 'react'
import { Button, Card, TextInput, Text, useMantineTheme, Divider } from '@mantine/core'
import { useForm } from '@mantine/form'
import { ContractIds } from '@deployments/deployments'
import {
  contractTx,
  useInkathon,
  useRegisteredContract,
  unwrapResultOrError,
} from '@scio-labs/use-inkathon'
import toast from 'react-hot-toast'

export const GiveMe = () => {
  const { api, activeAccount, isConnected, activeSigner } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.Transfer)
  const [giveMeIsLoading, setGiveMeIsLoading] = useState<boolean>()
  const form = useForm<{ value: string }>({
    initialValues: {
      value: '',
    },
  })
  const theme = useMantineTheme()

  const onSubmit = async () => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }
    setGiveMeIsLoading(true)

    toast.loading('Executing contractTx', { id: `giveMe` })

    try {
      const value = form.values.value
      const result = await contractTx(api, activeAccount.address, contract, 'giveMe', {}, [value])
      const message = unwrapResultOrError<string>(result as any)
      console.log('result', result)
      console.log('message', message)

      toast.success(`Successfully transferred ${value}!`)
    } catch (e: any) {
      console.log('e', e)

      toast.error('Error while transferring tokens. Try again…')
    } finally {
      setGiveMeIsLoading(false)
      toast.dismiss(`giveMe`)
    }
  }

  if (!contract) return null

  return (
    <Card shadow="sm" padding={theme.spacing.md}>
      <Text size="lg">Give Me Tokens</Text>
      {!!isConnected && (
        <form>
          <TextInput label="Amount" disabled={giveMeIsLoading} {...form.getInputProps('value')} />
          <Divider size="sm" my={20} />
          <Button
            variant="outline"
            disabled={giveMeIsLoading}
            onClick={onSubmit}
            loading={giveMeIsLoading}
          >
            Give Me Tokens
          </Button>
        </form>
      )}
    </Card>
  )
}
