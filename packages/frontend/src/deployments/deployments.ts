import { env } from '@config/environment'
import { SubstrateDeployment } from '@scio-labs/use-inkathon'

export enum ContractIds {
  Incrementer = 'incrementer',
}

export const getDeployments = async (): Promise<SubstrateDeployment[]> => {
  const networks = env.supportedChains
  const deployments = networks
    ?.map(async (network) => [
      {
        contractId: ContractIds.Incrementer,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/incrementer/metadata.json`),
        address: (await import(`@inkathon/contracts/deployments/incrementer/${network}.ts`))
          .address,
      },
    ])
    .reduce(async (acc, curr) => [...(await acc), ...(await curr)], [] as any)
  return deployments
}
