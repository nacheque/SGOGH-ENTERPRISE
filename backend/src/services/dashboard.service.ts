import { DashboardRepository } from '../repositories/dashboard.repository';
import { DashboardKpisDTO, CurvaRecaudacionPuntoDTO, AgingMoraResponseDTO } from '../types/dashboard.types';

export class DashboardService {
  private dashboardRepo: DashboardRepository;

  constructor() {
    this.dashboardRepo = new DashboardRepository();
  }

  private parseIdObra(idObra?: any): number | null {
    if (idObra === undefined || idObra === null || idObra === '') return null;
    const parsed = Number(idObra);
    return isNaN(parsed) ? null : parsed;
  }

  async getKpis(idObra?: any): Promise<DashboardKpisDTO> {
    const obraId = this.parseIdObra(idObra);
    return await this.dashboardRepo.obtenerKpis(obraId);
  }

  async getCurvaRecaudacion(idObra?: any): Promise<CurvaRecaudacionPuntoDTO[]> {
    const obraId = this.parseIdObra(idObra);
    return await this.dashboardRepo.obtenerCurvaRecaudacion(obraId);
  }

  async getAgingMora(idObra?: any): Promise<AgingMoraResponseDTO> {
    const obraId = this.parseIdObra(idObra);
    return await this.dashboardRepo.obtenerAgingMora(obraId);
  }
}   