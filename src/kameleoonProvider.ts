import { KameleoonClient, SDKParameters } from '@kameleoon/javascript-sdk';
import { KameleoonResolver } from './kameleoonResolver';
import {
  EvaluationContext,
  JsonValue,
  Logger,
  ProviderFatalError,
  ProviderMetadata,
  ResolutionDetails,
} from '@openfeature/core';
import {
  Hook,
  OpenFeatureEventEmitter,
  Provider,
  ProviderEvents,
} from '@openfeature/web-sdk';
import { DataConverter, Resolver } from '@kameleoon/openfeature-core';
import { KameleoonProviderParams } from 'src/types';

/**
 * The `KameleoonProvider` is an OpenFeature `Provider` implementation for the Kameleoon SDK.
 */
export class KameleoonProvider implements Provider {
  public readonly runsOn = 'client';
  readonly metadata: ProviderMetadata;
  readonly hooks: Hook[] = [];
  public readonly events = new OpenFeatureEventEmitter();

  private visitorCode?: string;
  private resolver: Resolver;
  private client?: KameleoonClient;

  constructor({
    siteCode,
    configuration,
    visitorCode,
    externals,
  }: KameleoonProviderParams) {
    this.metadata = { name: 'Kameleoon Provider' };
    try {
      this.client = KameleoonProvider.createClient({
        siteCode,
        configuration,
        externals,
      });
      this.visitorCode = this.client.getVisitorCode(visitorCode);
      this.resolver = KameleoonProvider.createResolver(
        this.client,
        this.visitorCode,
      );
    } catch (error) {
      this.events.emit(ProviderEvents.Error);
      if (error instanceof Error) {
        throw new ProviderFatalError(error.message);
      }
      throw new ProviderFatalError(
        'Kameleoon client is not created with unknown error',
      );
    }
  }

  private static createClient({
    siteCode,
    configuration,
    externals,
  }: SDKParameters): KameleoonClient {
    return new KameleoonClient({
      siteCode,
      configuration,
      externals,
    });
  }

  private static createResolver(
    client: KameleoonClient,
    visitorCode: string,
  ): Resolver {
    return new KameleoonResolver(client, visitorCode);
  }

  onContextChange(
    oldContext: EvaluationContext,
    newContext: EvaluationContext,
  ): Promise<void> | void {
    if (!this.client) {
      throw new ProviderFatalError('Kameleoon client is not created');
    }
    this.client.addData(
      this.visitorCode!,
      ...DataConverter.toKameleoon(newContext),
    );
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<boolean> {
    return this.resolver.resolve({ flagKey, defaultValue, context });
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<string> {
    return this.resolver.resolve({ flagKey, defaultValue, context });
  }
  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<number> {
    return this.resolver.resolve({ flagKey, defaultValue, context });
  }
  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<T> {
    return this.resolver.resolve({
      flagKey,
      defaultValue,
      context,
      isAnyType: true,
    });
  }

  async initialize(context?: EvaluationContext | undefined): Promise<void> {
    if (!this.client) {
      throw new ProviderFatalError('Kameleoon client is not created');
    }
    try {
      const isReady = await this.client.initialize();
      if (isReady) {
        const visitorCode = context?.targetingKey;
        if (visitorCode) {
          this.client!.addData(
            visitorCode,
            ...DataConverter.toKameleoon(context),
          );
        }
        this.events.emit(ProviderEvents.Ready);
      } else {
        this.events.emit(ProviderEvents.Error);
      }
    } catch (error) {
      this.events.emit(ProviderEvents.Error);
      if (error instanceof Error) {
        throw new ProviderFatalError(
          `Kameleoon client failed to initialize: ${error.message}`,
        );
      }
      throw new ProviderFatalError(`Kameleoon client failed to initialize`);
    }
  }
}
