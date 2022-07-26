/**
 * @license
 * SKALE Metaport
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @file tokens.ts
 * @copyright SKALE Labs 2022-Present
 */

import { SChain, MainnetChain } from '@skalenetwork/ima-js';

import { ZERO_ADDRESS, ETH_TOKEN_NAME, MAINNET_CHAIN_NAME, ETH_ERC20_ADDRESS } from './constants';
import { initERC20, initERC20Wrapper } from './core';

export class TokenData {
    originAddress: string
    cloneAddress: string

    name: string
    clone: boolean
    type: string
    balance: number

    unwrappedSymbol: string
    unwrappedAddress: string
    unwrappedBalance: number

    constructor(
        cloneAddress: string,
        originAddress: string,
        name: string,
        clone: boolean,
        unwrappedSymbol: string,
        unwrappedAddress: string
    ) {
        this.cloneAddress = cloneAddress;
        this.originAddress = originAddress;

        this.unwrappedAddress = unwrappedAddress;
        this.unwrappedSymbol = unwrappedSymbol;

        this.name = name;
        this.clone = clone;
        this.type = (name === ETH_TOKEN_NAME) ? 'eth' : 'erc20'
    }
}


export async function getAvailableTokens(
    mainnet: MainnetChain,
    sChain1: SChain,
    sChain2: SChain,
    chainName1: string,
    chainName2: string,
    tokens: Object
) {
    let availableTokens = {'erc20': {}};
    await getERC20Tokens(
        sChain1,
        sChain2,
        chainName1,
        chainName2,
        tokens,
        availableTokens
    );
    await getETHToken(
        mainnet,
        sChain1,
        sChain2,
        chainName1,
        chainName2,
        tokens,
        availableTokens
    );
    return availableTokens;
}


async function getETHToken(
    mainnet: MainnetChain,
    sChain1: SChain,
    sChain2: SChain,
    chainName1: string,
    chainName2: string,
    tokens: Object,
    availableTokens: Object
) {
    if (tokens[MAINNET_CHAIN_NAME] && tokens[MAINNET_CHAIN_NAME][ETH_TOKEN_NAME]) {
        if (chainName1 === MAINNET_CHAIN_NAME) {
            availableTokens[ETH_TOKEN_NAME] = new TokenData(
                ETH_ERC20_ADDRESS,
                null,
                ETH_TOKEN_NAME,
                false,
                null,
                null
            );
        }
        if (chainName2 === MAINNET_CHAIN_NAME) {
            availableTokens[ETH_TOKEN_NAME] = new TokenData(
                ETH_ERC20_ADDRESS,
                null,
                ETH_TOKEN_NAME,
                true,
                null,
                null
            );
        }

        console.log(availableTokens[ETH_TOKEN_NAME]);
        console.log('eth added!');
    }
}


async function getERC20Tokens(
    sChain1: SChain,
    sChain2: SChain,
    chainName1: string,
    chainName2: string,
    tokens: Object,
    availableTokens: Object
) {

    console.log(tokens);
    console.log(tokens[chainName1]);
    console.log(tokens[chainName2]);
    console.log('----------------------------------------------------------------');

    if (tokens[chainName1] && tokens[chainName1]['erc20']) {
        for (const tokenSymbol in tokens[chainName1]['erc20']) {
            await addTokenData(
                sChain1,
                sChain2,
                chainName1,
                tokens[chainName1]['erc20'][tokenSymbol],
                tokenSymbol,
                availableTokens,
                false
            );

            console.log(availableTokens);
        }
    }
    if (tokens[chainName2] && tokens[chainName2]['erc20']) {
        for (const tokenSymbol in tokens[chainName2]['erc20']) {         
            await addTokenData(
                sChain1,
                sChain2,
                chainName2,
                tokens[chainName2]['erc20'][tokenSymbol],
                tokenSymbol,
                availableTokens,
                true
            );
        }
    }
}


async function addTokenData(
    sChain1: SChain,
    sChain2: SChain,
    sChainName: string,
    token: Object,
    tokenSymbol: string,
    availableTokens: Object,
    isClone: boolean
) {
    let cloneAddress;
    if (sChain1 && isClone) {
        cloneAddress = await getCloneAddress(sChain1, token['address'], sChainName);
    }

    if (sChain2 && !isClone) {
        cloneAddress = await getCloneAddress(sChain2, token['address'], sChainName);;
    }

    // let cloneAddress = isClone ? await getCloneAddress(sChain1, token['address'], sChainName) : await getCloneAddress(sChain2, token['address'], sChainName);
    if (!cloneAddress) return;
    let unwrappedSymbol;
    let unwrappedAddress;
    if (token['wraps']) {
        unwrappedSymbol = token['wraps']['symbol'];
        unwrappedAddress = token['wraps']['address'];
    }

    console.log('adding tokenData!');
    console.log(availableTokens);
    console.log(tokenSymbol);

    availableTokens['erc20'][tokenSymbol] = new TokenData(
        cloneAddress,
        token['address'],
        token['name'],
        isClone,
        unwrappedSymbol,
        unwrappedAddress
    );

    console.log('added tokenData!');
    console.log(availableTokens);

    addERC20TokenContracts(
        sChain1,
        sChain2,
        tokenSymbol,
        availableTokens['erc20'][tokenSymbol]
    );
}


async function getCloneAddress(
    sChain: SChain,
    originTokenAddress: string,
    originChainName: string
) {
  let tokenCloneAddress = await sChain.erc20.getTokenCloneAddress(
    originTokenAddress,
    originChainName
  );
  if (tokenCloneAddress === ZERO_ADDRESS) return;
  return tokenCloneAddress;
}


function addERC20TokenContracts(
    sChain1: SChain,
    sChain2: SChain,
    tokenSymbol: string,
    tokenData: TokenData
) {

    
    console.log('tokenData tokenData tokenData');
    console.log(tokenSymbol);
    console.log(tokenData);
    console.log('tokenData tokenData tokenData');

    let chain1Address = tokenData.clone ?  tokenData.cloneAddress : tokenData.originAddress;
    let chain2Address = tokenData.clone ?  tokenData.originAddress : tokenData.cloneAddress;
    
    if (sChain1) { addERC20Token(sChain1, chain1Address, tokenSymbol, tokenData); };
    if (sChain2) { addERC20Token(sChain2, chain2Address, tokenSymbol, tokenData); };

    // if (tokenData.unwrappedSymbol && !tokenData.clone) {
    //     sChain1.erc20.addToken(
    //         tokenData.unwrappedSymbol,
    //         initERC20Wrapper(tokenData.unwrappedAddress, sChain1.web3)
    //     );
    // }
}


function addERC20Token(
    sChain: SChain,
    address: string,
    tokenSymbol: string,
    tokenData: TokenData
) {
    if (!sChain.erc20.tokens[tokenSymbol]) {
        // if (tokenData.unwrappedSymbol && !tokenData.clone) {
        if (tokenData.unwrappedSymbol) {
            sChain.erc20.addToken(
                tokenSymbol,
                initERC20Wrapper(address, sChain.web3)
            );
            sChain.erc20.addToken(
                tokenData.unwrappedSymbol,
                initERC20(tokenData.unwrappedAddress, sChain.web3)
            );
        } else {
            sChain.erc20.addToken(tokenSymbol, initERC20(address, sChain.web3));
        }
    }
}