import {
  Conversion,
  CustomData,
  JSONType,
  KameleoonClient,
} from '@kameleoon/javascript-sdk';
import { KameleoonProvider } from 'src/kameleoonProvider';
import { KameleoonResolver } from 'src/kameleoonResolver';
import {
  ResolutionDetails,
  Metadata,
  Logger,
  EvaluationContext,
} from '@openfeature/web-sdk';
import { JsonValue } from '@openfeature/core';
import { DataType } from '@kameleoon/openfeature-core';

describe('KameleoonProvider', () => {
  const SITE_CODE = 'siteCode';
  const FLAG_KEY = 'flagKey';

  let clientMock: jest.Mocked<KameleoonClient>;
  let resolverMock: jest.Mocked<KameleoonResolver>;
  let provider: KameleoonProvider;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    clientMock = {
      waitInit: jest.fn(),
      addData: jest.fn(),
      getFeatureVariationKey: jest.fn(),
      getFeatureVariationVariables: jest.fn(),
      getVisitorCode: jest.fn().mockReturnValue('visitorCode'),
    } as unknown as jest.Mocked<KameleoonClient>;

    resolverMock = {
      resolve: jest.fn(),
      visitorCode: 'visitorCode',
    } as unknown as jest.Mocked<KameleoonResolver>;

    provider = new KameleoonProvider({
      siteCode: SITE_CODE,
      visitorCode: 'visitorCode',
    });

    provider['resolver'] = resolverMock;
    provider['client'] = clientMock;
    loggerMock = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
  });

  // @TODO: Uncomment this test after fixing the issue #32585
  // test('initWithInvalidSiteCodeThrowsFeatureProviderException', () => {
  //   expect(
  //     () =>
  //       new KameleoonProvider({
  //         siteCode: '',
  //         visitorCode: 'visitorCode',
  //       }),
  //   ).toThrow(new ProviderFatalError('Site code can not be empty'));
  // });

  test('getMetadataReturnsCorrectMetadata', () => {
    const metadata: Metadata = provider.metadata;
    expect(metadata.name).toBe('Kameleoon Provider');
  });

  const setupResolverMock = (expectedValue: any): void => {
    resolverMock.resolve.mockReturnValue({
      value: expectedValue,
    });
  };

  const assertResult = <T>(result: ResolutionDetails<T>, expectedValue: T) => {
    expect(result).toBeDefined();
    if (result) {
      expect(result.value).toBe(expectedValue);
      expect(result.errorCode).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    }
  };

  test('resolveBooleanValueReturnsCorrectValue', async () => {
    const defaultValue = false;
    const expectedValue = true;
    setupResolverMock(expectedValue);

    const result = provider.resolveBooleanEvaluation(
      FLAG_KEY,
      defaultValue,
      {},
      loggerMock,
    );
    assertResult(result, expectedValue);
  });

  test('resolveDoubleValueReturnsCorrectValue', async () => {
    const defaultValue = 0.5;
    const expectedValue = 2.5;
    setupResolverMock(expectedValue);

    const result = provider.resolveNumberEvaluation(
      FLAG_KEY,
      defaultValue,
      {},
      loggerMock,
    );
    assertResult(result, expectedValue);
  });

  test('resolveIntegerValueReturnsCorrectValue', async () => {
    const defaultValue = 1;
    const expectedValue = 2;
    setupResolverMock(expectedValue);

    const result = provider.resolveNumberEvaluation(
      FLAG_KEY,
      defaultValue,
      {},
      loggerMock,
    );
    assertResult(result, expectedValue);
  });

  test('resolveStringValueReturnsCorrectValue', async () => {
    const defaultValue = '1';
    const expectedValue = '2';
    setupResolverMock(expectedValue);

    const result = provider.resolveStringEvaluation(
      FLAG_KEY,
      defaultValue,
      {},
      loggerMock,
    );
    assertResult(result, expectedValue);
  });

  test.each([[{ 1: '1' }, { 1: '1' }]])(
    `resolveObjectValueReturnsCorrectValue`,
    async (defaultValue, expectedValue) => {
      const defaultValueOpenfeature: JsonValue = defaultValue;
      const expectedValueOpenfeature: JsonValue = expectedValue;
      const kameleonValue: JSONType = expectedValue;

      setupResolverMock(kameleonValue);

      const result = provider.resolveObjectEvaluation(
        FLAG_KEY,
        defaultValueOpenfeature,
        {},
        loggerMock,
      );

      expect(result.value).toEqual(expectedValueOpenfeature);
      expect(result.errorCode).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    },
  );

  test('check called addData method', () => {
    const provider = new KameleoonProvider({
      siteCode: SITE_CODE,
      visitorCode: 'visitorCode',
    });

    const resolver = provider['resolver'] as KameleoonResolver;
    resolver['client'] = clientMock;
    provider['client'] = clientMock;
    const dataDictionary = {
      [DataType.CUSTOM_DATA]: DataType.makeCustomData(1),
      [DataType.CONVERSION]: DataType.makeConversion({ goalId: 1 }),
    };

    let evalContext: EvaluationContext = {
      ...dataDictionary,
    };

    const expectedData = [
      new CustomData(1),
      {
        ...new Conversion({ goalId: 1 }),
        id: expect.any(Number),
      },
    ];

    provider.onContextChange({}, evalContext);

    expect(clientMock.addData).toHaveBeenCalledTimes(1);
    expect(clientMock.addData).toHaveBeenCalledWith(
      'visitorCode',
      ...expectedData,
    );

    provider.resolveNumberEvaluation(FLAG_KEY, 1, evalContext, loggerMock);
    expect(clientMock.addData).toHaveBeenCalledTimes(1);
  });
});
