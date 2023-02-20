import React from 'react';

import Collapse from '@mui/material/Collapse';

import { OperationType } from '../../core/dataclasses/OperationType';

import styles from "../WidgetUI/WidgetUI.scss";
import { clsNames } from '../../core/helper';

import CurrentChain from '../CurrentChain';
import ErrorMessage from '../ErrorMessage';
import UnwrapUI from '../UnwrapUI';
import TransferUI from '../TransferUI';
import WrappedTokensWarning from '../WrappedTokensWarning';
import StepperV2 from '../StepperV2';
import TransferSummary from '../TransferSummary';
import Route from '../Route';
import Typography from '@mui/material/Typography';
import { getIconSrc, getTokenName } from "../TokenList/helper";

import MoveDownIcon from '@mui/icons-material/MoveDown';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

import TokenData from '../../core/dataclasses/TokenData';
import EthTokenData from '../../core/dataclasses/EthTokenData';
import { TokenType } from '../../core/dataclasses/TokenType';
import * as interfaces from '../../core/interfaces/index';
import { isTransferRequestSteps, isTransferRequestSummary } from '../../core/views';

import { getChainName, getChainIcon } from '../ChainsList/helper';
import SkeletonLoader from '../SkeletonLoader';



function getTokenDataFromConfig(configTokens: interfaces.TokensMap, transferRequest: interfaces.TransferParams): TokenData {
  // TODO: refactor!

  if (transferRequest.tokenType === TokenType.eth) {
    return new EthTokenData(false);
  }

  let configToken;
  let isClone = false;

  const fromChainName = transferRequest.chains[0];
  const toChainName = transferRequest.route ? transferRequest.route.hub : transferRequest.chains[1];

  if (configTokens[fromChainName] &&
    configTokens[fromChainName][transferRequest.tokenType] &&
    configTokens[fromChainName][transferRequest.tokenType][transferRequest.tokenKeyname]) {
    configToken = configTokens[fromChainName][transferRequest.tokenType][transferRequest.tokenKeyname];
  }
  if (configTokens[toChainName] &&
    configTokens[toChainName][transferRequest.tokenType] &&
    configTokens[toChainName][transferRequest.tokenType][transferRequest.tokenKeyname]) {
    configToken = configTokens[toChainName][transferRequest.tokenType][transferRequest.tokenKeyname];
    isClone = true;
  }
  if (!configToken) return;

  let unwrappedSymbol;
  let unwrappedAddress;
  let unwrappedIconUrl;
  if (configToken.wraps) {
    unwrappedSymbol = configToken.wraps.symbol;
    unwrappedAddress = configToken.wraps.address;
    unwrappedIconUrl = configToken.wraps.iconUrl;
  }

  return new TokenData(
    null,
    configToken.address,
    configToken.name,
    configToken.symbol,
    configToken.cloneSymbol,
    isClone,
    configToken.iconUrl,
    configToken.decimals,
    transferRequest.tokenType,
    unwrappedSymbol,
    unwrappedAddress,
    unwrappedIconUrl
  );
}


export default function TransferRequest(props) {
  if (!props.transferRequest) {
    return (<SkeletonLoader header={true} />)
  }

  const trReq: interfaces.TransferParams = props.transferRequest;
  const token = getTokenDataFromConfig(props.config.tokens, trReq);

  const fromChainName = getChainName(props.config.chainsMetadata, trReq.chains[0], trReq.fromApp);
  const toChainName = getChainName(props.config.chainsMetadata, trReq.chains[1], trReq.toApp);

  let explanationText = 'Transfer assets from ' + fromChainName + ' to ' + toChainName + '.';
  if (trReq.route) {
    const hubChainName = getChainName(props.config.chainsMetadata, trReq.route.hub);
    if (token.clone) {
      explanationText += ' Tokens will be unwrapped on ' + hubChainName + '.';
    } else {
      explanationText += ' Tokens will be wrapped on ' + hubChainName + '.';
    }
  };

  return (
    <div>
      <div className={clsNames(styles.mp__flex, styles.mp__flexCenteredVert, styles.mp_flexRow)}>
        <h2 className={clsNames(styles.mp__noMarg)}>Transfer</h2>
        <img
          className={clsNames(styles.mp__amountIcon, styles.mp__margLeft10, styles.mp__margRi5)}
          src={getIconSrc(token)}
        />
        <h2 className={clsNames(styles.mp__noMarg, styles.mp__amount)}>{trReq.lockValue ? trReq.amount + ' ' + token.symbol : token.symbol}</h2>
      </div>
      <Route
        config={props.config}
        transferRequest={props.transferRequest}
        theme={props.theme}
        explanationText={explanationText}
        size={isTransferRequestSteps(props.view) ? 'small' : 'medium'}
      />
      <Collapse in={props.errorMessage}>
        <ErrorMessage errorMessage={props.errorMessage} />
      </Collapse>
      <Collapse in={!props.errorMessage}>
        {isTransferRequestSteps(props.view) ?
          <StepperV2 {...props} token={token} /> :
          <TransferSummary {...props} explanationText={explanationText} />
        }
      </Collapse>
    </div>
  )
}