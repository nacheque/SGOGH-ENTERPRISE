import { pool } from '../config/database';
import {
  DashboardKpisDTO,
  CurvaRecaudacionPuntoDTO,
  AgingMoraResponseDTO,
  AgingFilaDTO,
} from '../types/dashboard.types';

export class DashboardRepository {
  /**
   * KPI 1: Tarjetas consolidadas
   */
  async obtenerKpis(idObra: number | null): Promise<DashboardKpisDTO> {
    const query = `
      WITH kpi_cuotas AS (
        SELECT 
          COALESCE(SUM(c.monto_actualizado), 0)::float AS total_exigible_obra,
          COALESCE(SUM(c.monto_base), 0)::float AS total_base_obra,
          COALESCE(SUM(CASE WHEN c.estado IN ('PENDIENTE', 'PAGO_PARCIAL') THEN c.saldo_remanente ELSE 0 END), 0)::float AS saldo_pendiente,
          COALESCE(SUM(CASE WHEN c.fecha_vencimiento < CURRENT_DATE AND c.saldo_remanente > 0 THEN c.saldo_remanente ELSE 0 END), 0)::float AS monto_mora,
          COALESCE(SUM(CASE WHEN TO_CHAR(c.fecha_vencimiento, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM') THEN c.monto_actualizado ELSE 0 END), 0)::float AS exigible_mes_actual,
          COALESCE(SUM(CASE WHEN TO_CHAR(c.fecha_vencimiento, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM') THEN (c.monto_actualizado - c.saldo_remanente) ELSE 0 END), 0)::float AS cobrado_mes_actual
        FROM cuotas c
        JOIN contratos con ON con.id_contrato = c.id_contrato
        JOIN inmuebles i ON i.id_inmueble = con.id_inmueble
        WHERE ($1::int IS NULL OR i.id_obra = $1)
      ),
      kpi_pagos AS (
        SELECT 
          COALESCE(SUM(p.monto), 0)::float AS recaudacion_efectiva
        FROM pagos p
        JOIN cuotas c ON c.id_cuota = p.id_cuota
        JOIN contratos con ON con.id_contrato = c.id_contrato
        JOIN inmuebles i ON i.id_inmueble = con.id_inmueble
        WHERE ($1::int IS NULL OR i.id_obra = $1)
      )
      SELECT 
        -- total_obra = recaudado histórico + saldo pendiente total
        (kp.recaudacion_efectiva + kc.saldo_pendiente)::float AS total_obra,
        kp.recaudacion_efectiva,
        kc.saldo_pendiente,
        kc.monto_mora,
        CASE 
          WHEN kc.total_base_obra > 0 THEN ROUND(((kc.total_exigible_obra / kc.total_base_obra) * 100)::numeric, 2)::float
          ELSE 100.0
        END AS cobertura_icc,
        CASE 
          WHEN kc.exigible_mes_actual > 0 THEN ROUND(((kc.cobrado_mes_actual / kc.exigible_mes_actual) * 100)::numeric, 2)::float
          ELSE 0.0
        END AS efectividad_mes
      FROM kpi_cuotas kc, kpi_pagos kp;
    `;

    const { rows } = await pool.query(query, [idObra]);
    const r = rows[0] || {
      total_obra: 0,
      recaudacion_efectiva: 0,
      saldo_pendiente: 0,
      monto_mora: 0,
      cobertura_icc: 100.0,
      efectividad_mes: 0,
    };

    const totalObra = Number(r.total_obra) || 0;
    const recaudacion = Number(r.recaudacion_efectiva) || 0;
    const saldoPendiente = Number(r.saldo_pendiente) || 0;
    const montoMora = Number(r.monto_mora) || 0;

    const porcentajeRecaudado = totalObra > 0 ? Number(((recaudacion / totalObra) * 100).toFixed(2)) : 0;
    const porcentajePendiente = totalObra > 0 ? Number(((saldoPendiente / totalObra) * 100).toFixed(2)) : 0;

    const baseMorosidad = recaudacion + montoMora;
    const tasaMorosidad = baseMorosidad > 0 ? Number(((montoMora / baseMorosidad) * 100).toFixed(2)) : 0;

    return {
      total_obra: totalObra,
      recaudacion_efectiva: recaudacion,
      porcentaje_recaudado: porcentajeRecaudado,
      saldo_pendiente: saldoPendiente,
      porcentaje_pendiente: porcentajePendiente,
      monto_mora: montoMora,
      tasa_morosidad: tasaMorosidad,
      cobertura_icc: Number(r.cobertura_icc) || 100.0,
      efectividad_mes: Number(r.efectividad_mes) || 0,
    };
  }

  /**
   * KPI 2: Serie temporal proyectado vs real acumulado
   */
  async obtenerCurvaRecaudacion(idObra: number | null): Promise<CurvaRecaudacionPuntoDTO[]> {
    const query = `
      WITH meses AS (
        SELECT DISTINCT TO_CHAR(c.fecha_vencimiento, 'YYYY-MM') AS periodo
        FROM cuotas c
        JOIN contratos con ON con.id_contrato = c.id_contrato
        JOIN inmuebles i ON i.id_inmueble = con.id_inmueble
        WHERE ($1::int IS NULL OR i.id_obra = $1)
        UNION
        SELECT DISTINCT TO_CHAR(p.fecha_pago, 'YYYY-MM') AS periodo
        FROM pagos p
        JOIN cuotas c ON c.id_cuota = p.id_cuota
        JOIN contratos con ON con.id_contrato = c.id_contrato
        JOIN inmuebles i ON i.id_inmueble = con.id_inmueble
        WHERE ($1::int IS NULL OR i.id_obra = $1)
      ),
      proyectado AS (
        SELECT 
          TO_CHAR(c.fecha_vencimiento, 'YYYY-MM') AS periodo,
          SUM(c.monto_actualizado)::float AS monto_mes
        FROM cuotas c
        JOIN contratos con ON con.id_contrato = c.id_contrato
        JOIN inmuebles i ON i.id_inmueble = con.id_inmueble
        WHERE ($1::int IS NULL OR i.id_obra = $1)
        GROUP BY 1
      ),
      real_cobrado AS (
        SELECT 
          TO_CHAR(p.fecha_pago, 'YYYY-MM') AS periodo,
          SUM(p.monto)::float AS monto_mes
        FROM pagos p
        JOIN cuotas c ON c.id_cuota = p.id_cuota
        JOIN contratos con ON con.id_contrato = c.id_contrato
        JOIN inmuebles i ON i.id_inmueble = con.id_inmueble
        WHERE ($1::int IS NULL OR i.id_obra = $1)
        GROUP BY 1
      )
      SELECT 
        m.periodo,
        COALESCE(pr.monto_mes, 0)::float AS proyectado_mes,
        SUM(COALESCE(pr.monto_mes, 0)) OVER (ORDER BY m.periodo ASC)::float AS proyectado_acumulado,
        COALESCE(rc.monto_mes, 0)::float AS real_mes,
        SUM(COALESCE(rc.monto_mes, 0)) OVER (ORDER BY m.periodo ASC)::float AS real_acumulado
      FROM meses m
      LEFT JOIN proyectado pr ON pr.periodo = m.periodo
      LEFT JOIN real_cobrado rc ON rc.periodo = m.periodo
      WHERE m.periodo IS NOT NULL
      ORDER BY m.periodo ASC;
    `;

    const { rows } = await pool.query(query, [idObra]);
    return rows.map((r: any) => ({
      periodo: r.periodo,
      proyectado_mes: Number(r.proyectado_mes),
      proyectado_acumulado: Number(r.proyectado_acumulado),
      real_mes: Number(r.real_mes),
      real_acumulado: Number(r.real_acumulado),
    }));
  }

  /**
   * KPI 3: Matriz de morosidad (Aging Report)
   */
  async obtenerAgingMora(idObra: number | null): Promise<AgingMoraResponseDTO> {
    const query = `
      WITH cuotas_clasificadas AS (
        SELECT 
          con.id_contrato,
          i.id_inmueble,
          -- Etiqueta del plan basada en el mayor número de cuotas contratadas
          CONCAT('Plan ', GREATEST(COALESCE(con.plan_cuotas_obra, 0), COALESCE(con.plan_cuotas_gabinete, 0)), ' Cuotas') AS tipo_plan,
          c.saldo_remanente::float AS saldo,
          CASE 
            WHEN c.fecha_vencimiento >= CURRENT_DATE THEN 'AL_DIA'
            WHEN (CURRENT_DATE - c.fecha_vencimiento) BETWEEN 1 AND 30 THEN 'MORA_1_30'
            WHEN (CURRENT_DATE - c.fecha_vencimiento) BETWEEN 31 AND 60 THEN 'MORA_31_60'
            WHEN (CURRENT_DATE - c.fecha_vencimiento) BETWEEN 61 AND 90 THEN 'MORA_61_90'
            ELSE 'MORA_MAS_90'
          END AS bucket
        FROM cuotas c
        JOIN contratos con ON con.id_contrato = c.id_contrato
        JOIN inmuebles i ON i.id_inmueble = con.id_inmueble
        WHERE ($1::int IS NULL OR i.id_obra = $1)
          AND c.saldo_remanente > 0
          AND c.estado IN ('PENDIENTE', 'PAGO_PARCIAL')
      )
      SELECT 
        tipo_plan,
        COUNT(DISTINCT id_inmueble)::int AS total_clientes,
        COALESCE(SUM(CASE WHEN bucket = 'AL_DIA' THEN saldo ELSE 0 END), 0)::float AS monto_al_dia,
        COALESCE(SUM(CASE WHEN bucket = 'MORA_1_30' THEN saldo ELSE 0 END), 0)::float AS monto_1_30,
        COALESCE(SUM(CASE WHEN bucket = 'MORA_31_60' THEN saldo ELSE 0 END), 0)::float AS monto_31_60,
        COALESCE(SUM(CASE WHEN bucket = 'MORA_61_90' THEN saldo ELSE 0 END), 0)::float AS monto_61_90,
        COALESCE(SUM(CASE WHEN bucket = 'MORA_MAS_90' THEN saldo ELSE 0 END), 0)::float AS monto_mas_90
      FROM cuotas_clasificadas
      GROUP BY tipo_plan
      ORDER BY tipo_plan ASC;
    `;

    const { rows } = await pool.query(query, [idObra]);

    let totalAlDia = 0;
    let total1_30 = 0;
    let total31_60 = 0;
    let total61_90 = 0;
    let totalMas90 = 0;

    const detallePorPlan: AgingFilaDTO[] = rows.map((r: any) => {
      const alDia = Number(r.monto_al_dia);
      const m1_30 = Number(r.monto_1_30);
      const m31_60 = Number(r.monto_31_60);
      const m61_90 = Number(r.monto_61_90);
      const mMas90 = Number(r.monto_mas_90);

      totalAlDia += alDia;
      total1_30 += m1_30;
      total31_60 += m31_60;
      total61_90 += m61_90;
      totalMas90 += mMas90;

      const totalDeudaPlan = alDia + m1_30 + m31_60 + m61_90 + mMas90;
      const totalMoraPlan = m1_30 + m31_60 + m61_90 + mMas90;
      const porcentajeMorosidad = totalDeudaPlan > 0 ? Number(((totalMoraPlan / totalDeudaPlan) * 100).toFixed(2)) : 0;

      return {
        tipo_plan: r.tipo_plan,
        total_clientes: Number(r.total_clientes),
        monto_al_dia: alDia,
        monto_1_30: m1_30,
        monto_31_60: m31_60,
        monto_61_90: m61_90,
        monto_mas_90: mMas90,
        porcentaje_morosidad: porcentajeMorosidad,
      };
    });

    return {
      totales_generales: {
        monto_al_dia: Number(totalAlDia.toFixed(2)),
        monto_1_30: Number(total1_30.toFixed(2)),
        monto_31_60: Number(total31_60.toFixed(2)),
        monto_61_90: Number(total61_90.toFixed(2)),
        monto_mas_90: Number(totalMas90.toFixed(2)),
      },
      detalle_por_plan: detallePorPlan,
    };
  }
}