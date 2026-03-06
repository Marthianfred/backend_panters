import { Injectable } from '@nestjs/common';
import { IP2PTransactionService } from '../interfaces/p2p-transaction.service.interface';

@Injectable()
export class MockP2PTransactionService implements IP2PTransactionService {
  public async executeContentPurchase(
    subscriberId: string,
    creatorId: string,
    amountInCoins: number,
  ): Promise<boolean> {
    // Aquí iría una transacción ACID en Postgres.
    // Ej: DB.transaction()
    console.log(`[ACID] Iniciando transacción de compra...`);

    // 1. Verificar fondos del subscriber (simulado)
    if (subscriberId === 'bankrupt_user') {
      return false; // Sin fondos
    }

    // 2. Débito al subscriber
    console.log(`[ACID] Debitando ${amountInCoins} PT Coins a ${subscriberId}`);

    // 3. Regla de Negocio (Split 70/30)
    const platformFee = amountInCoins * 0.3;
    const creatorNetEarnings = amountInCoins * 0.7;

    // 4. Crédito a la Panter
    console.log(
      `[ACID] Acreditando ${creatorNetEarnings} PT Coins a Creadora ${creatorId}`,
    );

    // 5. Crédito a la cuenta recaudadora maestra
    console.log(
      `[ACID] Reteniendo comisión ${platformFee} PT Coins para la Plataforma`,
    );

    console.log(`[ACID] Transacción finalizada y commiteada.`);

    return true; // Éxito
  }
}
