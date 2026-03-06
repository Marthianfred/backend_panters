export const STRIPE_VALIDATOR_TOKEN = Symbol('STRIPE_VALIDATOR_TOKEN');
export const BINANCE_VALIDATOR_TOKEN = Symbol('BINANCE_VALIDATOR_TOKEN');

export interface ISignatureValidator {
  validateSignature(payload: any, signature: string): boolean;
}
