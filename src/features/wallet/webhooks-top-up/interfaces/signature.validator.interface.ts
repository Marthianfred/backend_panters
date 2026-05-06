export const STRIPE_VALIDATOR_TOKEN = Symbol('STRIPE_VALIDATOR_TOKEN');
export const BINANCE_VALIDATOR_TOKEN = Symbol('BINANCE_VALIDATOR_TOKEN');

export interface ISignatureValidator {
  validateSignature(
    payload: Buffer | string | Record<string, unknown>,
    signature: string,
  ): boolean;
}
