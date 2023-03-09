import { expect } from 'chai'
import { parseEther } from 'ethers/lib/utils'
import { deployments, ethers } from 'hardhat'
import { CheckBalance__factory } from '../typechain/factories/contracts/tests/CheckBalance__factory'

describe('CheckBalance Contract', () => {
  it('emit with checked balance', async () => {
    await deployments.fixture()
    const signer = await ethers.provider.getSigner()
    const checkBalance = await new CheckBalance__factory(signer).deploy()

    const requiredEthers = parseEther('1')

    await expect(checkBalance.checkEthers(requiredEthers))
      .to.emit(checkBalance, 'CheckedBalance')
      .withArgs(await signer.getAddress(), requiredEthers)
  })
})
