import { ExternalsType, SDKConfigurationType } from '@kameleoon/javascript-sdk';
import { ErrorCode } from '@openfeature/server-sdk';

/**
 * @param {string} siteCode - client's siteCode defined on Kameleoon platform
 * @param {Partial<SDKConfigurationType> | undefined} configuration - client's configuration
 * @param {ExternalsType | undefined} externals - external dependencies
 * @param {string} visitorCode - client's visitorCode defined on Kameleoon platform
 * */
export type KameleoonProviderParams = {
  siteCode: string;
  configuration?: Partial<SDKConfigurationType>;
  externals?: ExternalsType;
  visitorCode: string;
};

export type ResolutionDetailsParams<T> = {
  value: T;
  variant?: string;
  errorCode?: ErrorCode;
  errorMessage?: string;
};
