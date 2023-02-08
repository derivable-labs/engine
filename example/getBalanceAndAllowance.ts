import {Engine} from "../src/engine";
import {ethers} from "ethers";

const test = async () => {
  const engine = new Engine({
    chainId: 31337,
    scanApi: '',
    rpcUrl: 'http://localhost:8545/',
    account: '0x1445C43bFD26062eBA387ec9dB928FD6f903CAbC',
    provider: new ethers.providers.JsonRpcProvider("http://localhost:8545"),
    providerToGetLog: new ethers.providers.JsonRpcProvider('http://localhost:8545/'),
  })
  await engine.RESOURCE.fetchResourceData('0x1445C43bFD26062eBA387ec9dB928FD6f903CAbC')
  const tokens = engine.RESOURCE.tokens
  const tokenArr = tokens.map((t) => t.address)
  console.log(tokens)

  const res = await engine.BNA.getBalanceAndAllowance({
    tokens: tokenArr
  })
  console.log(res)
}

test()
