import { useState } from 'react'
import { Button, Card, Text, TextInput, useMantineTheme, Divider } from '@mantine/core'
import { useForm } from '@mantine/form'
import { ContractIds } from '@deployments/deployments'
import { contractTx, useInkathon, useRegisteredContract } from '@scio-labs/use-inkathon'
import toast from 'react-hot-toast'

export const WasItTen = () => {
  const { api, activeAccount, isConnected, activeSigner } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.Transfer)
  const [sendValueIsLoading, setSendValueIsLoading] = useState<boolean>()
  const form = useForm<{ value: number }>({
    initialValues: {
      value: 10,
    },
  })
  const theme = useMantineTheme()

  const onSubmit = async () => {
    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }
    setSendValueIsLoading(true)

    toast.loading('Executing contractTx', { id: `sendValue` })

    try {
      const value = form.values.value
      const result = await contractTx(
        api,
        activeAccount.address,
        contract,
        'wasItTen',
        { value },
        [],
      )

      console.log('result', result)

      toast.success(`Successfully sent ${value} tokens!`)
    } catch (e: any) {
      console.log('e', e)

      toast.error('Error while sending tokens. Try again…')
    } finally {
      setSendValueIsLoading(false)
      toast.dismiss(`sendValue`)
    }
  }

  if (!contract) return null

  return (
    <Card shadow="sm" padding={theme.spacing.md}>
      <Text size="lg">Send Tokens</Text>
      {!!isConnected && (
        <form>
          <TextInput
            type="number"
            min={0}
            label="Value"
            disabled={sendValueIsLoading}
            {...form.getInputProps('value')}
          />
          <Divider size="sm" my={20} />
          <Button
            variant="outline"
            disabled={sendValueIsLoading}
            onClick={onSubmit}
            loading={sendValueIsLoading}
          >
            Send Tokens
          </Button>
        </form>
      )}
    </Card>
  )
}
