import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getKpis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getKpis(req.query.id_obra);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };

  getCurvaRecaudacion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getCurvaRecaudacion(req.query.id_obra);
      res.status(200).json({ status: 'success', total_periodos: data.length, data });
    } catch (error) {
      next(error);
    }
  };

  getAgingMora = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.dashboardService.getAgingMora(req.query.id_obra);
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();