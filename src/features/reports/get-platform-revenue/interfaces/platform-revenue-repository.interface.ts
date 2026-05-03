export interface IPlatformRevenueRepository {
  /**
   * Obtiene las métricas agregadas de ingresos en un rango de fechas.
   */
  getRevenueMetrics(startDate?: Date, endDate?: Date): Promise<{
    totalGrossPtc: number;
    totalPlatformPtc: number;
    totalCreatorPtc: number;
  }>;
}
