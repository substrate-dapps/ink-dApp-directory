import { env } from '@config/environment'
import { SubstrateDeployment } from '@scio-labs/use-inkathon'

export enum ContractIds {
  DNS = 'dns',
  Incrementer = 'incrementer',
  Transfer = 'transfer',
}

export const getDeployments = async (): Promise<SubstrateDeployment[]> => {
  const networks = env.supportedChains
  const deployments = networks
    ?.map(async (network) => [
      {
        contractId: ContractIds.DNS,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/dns/metadata.json`),
        address: (await import(`@inkathon/contracts/deployments/dns/${network}.ts`)).address,
      },
      {
        contractId: ContractIds.Incrementer,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/incrementer/metadata.json`),
        address: (await import(`@inkathon/contracts/deployments/incrementer/${network}.ts`))
          .address,
      },
      {
        contractId: ContractIds.Transfer,
        networkId: network,
        abi: await import(`@inkathon/contracts/deployments/transfer/metadata.json`),
        address: (await import(`@inkathon/contracts/deployments/transfer/${network}.ts`)).address,
      },
    ])
    .reduce(async (acc, curr) => [...(await acc), ...(await curr)], [] as any)

  return deployments
}
