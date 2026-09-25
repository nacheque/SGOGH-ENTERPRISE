import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import type { ChequeCarteraDTO } from '../../types';
import {
  Search,
  Building2,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  Loader2,
  RotateCcw,
} from 'lucide-react';

interface Props {
  selectedObraId: number | null;
}

export const CarteraChequesTable: React.FC<Props> = ({ selectedObraId }) => {
  const [cheques, setCheques] = useState<ChequeCarteraDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'EN_CARTERA' | 'DISPONIBLE' | 'VENCIDO'>('TODOS');

  const fetchCheques = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {};
      if (selectedObraId) params.id_obra = selectedObraId;
      if (filtroEstado !== 'TODOS') params.estado_custodia = filtroEstado;

      const res = await api.get('/pagos/cartera-cheques', { params });
      const data: ChequeCarteraDTO[] = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setCheques(data);
    } catch {
      setCheques([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheques();
  }, [selectedObraId, filtroEstado]);

  // Escuchar evento global si se registra un cobro nuevo
  useEffect(() => {
    const handleActualizacion = () => {
      fetchCheques();
    };
    window.addEventListener('padron:actualizado', handleActualizacion);
    return () => {
      window.removeEventListener('padron:actualizado', handleActualizacion);
    };
  }, [selectedObraId, filtroEstado]);

  // KPIs calculados
  const kpis = useMemo(() => {
    let totalCarteraMonto = 0;
    let totalCarteraCant = 0;
    let disponiblesMonto = 0;
    let disponiblesCant = 0;
    let vencidosMonto = 0;
    let vencidosCant = 0;

    cheques.forEach((c: ChequeCarteraDTO) => {
      const monto = Number(c.monto || 0);
      if (c.estado_custodia === 'EN_CARTERA') {
        totalCarteraMonto += monto;
        totalCarteraCant += 1;
      } else if (c.estado_custodia === 'DISPONIBLE') {
        disponiblesMonto += monto;
        disponiblesCant += 1;
      } else if (c.estado_custodia === 'VENCIDO') {
        vencidosMonto += monto;
        vencidosCant += 1;
      }
    });

    return {
      totalCarteraMonto,
      totalCarteraCant,
      disponiblesMonto,
      disponiblesCant,
      vencidosMonto,
      vencidosCant,
    };
  }, [cheques]);

  // Filtrado reactivo en memoria para el buscador
  const filteredCheques = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return cheques;

    return cheques.filter((c: ChequeCarteraDTO) =>
      Boolean(
        c.numero_cheque?.toLowerCase().includes(term) ||
        c.titular_nombre?.toLowerCase().includes(term) ||
        c.banco_emisor?.toLowerCase().includes(term) ||
        c.cuit_librador?.includes(term) ||
        c.clave_cliente?.toLowerCase().includes(term)
      )
    );
  }, [cheques, searchTerm]);

  const formatearFecha = (f?: string) => {
    if (!f) return '-';
    const [yyyy, mm, dd] = f.split('T')[0].split('-');
    return `${dd}/${mm}/${yyyy}`;
  };

  const renderBadgeCustodia = (c: ChequeCarteraDTO) => {
    switch (c.estado_custodia) {
      case 'EN_CARTERA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-500" />
            En Cartera ({c.dias_para_cobro}d)
          </span>
        );
      case 'DISPONIBLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Listo p/ Depósito
          </span>
        );
      case 'VENCIDO':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertOctagon className="w-3 h-3 text-rose-500" />
            Vencido ({Math.abs(c.dias_para_cobro)}d)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* 3 Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>En Cartera Diferida</span>
            <Wallet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-2">
            ${kpis.totalCarteraMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {kpis.totalCarteraCant} valores en custodia
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Listos para Depósito</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-2">
            ${kpis.disponiblesMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {kpis.disponiblesCant} valores disponibles hoy
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase">
            <span>Valores Vencidos</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-2">
            ${kpis.vencidosMonto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {kpis.vencidosCant} con fecha excedida (&gt;30 días)
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-200 rounded-2xl shadow-xs">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por N° de cheque, titular, CUIT o banco..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Control de Estados */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {(
              [
                { key: 'TODOS', label: 'Todos' },
                { key: 'EN_CARTERA', label: 'En Cartera' },
                { key: 'DISPONIBLE', label: 'Disponibles' },
                { key: 'VENCIDO', label: 'Vencidos' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFiltroEstado(t.key)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filtroEstado === t.key
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchCheques}
            title="Refrescar cartera"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabla de Custodia */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">N° Cheque / Tipo</th>
                <th className="py-3 px-4">Banco Emisor</th>
                <th className="py-3 px-4">Titular / Clave Lote</th>
                <th className="py-3 px-4">CUIT Librador</th>
                <th className="py-3 px-4">F. Emisión</th>
                <th className="py-3 px-4">F. Cobro / Vence</th>
                <th className="py-3 px-4 text-right">Importe</th>
                <th className="py-3 px-4 text-center">Estado Custodia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                      <span>Cargando cartera de valores...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCheques.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No se encontraron cheques ni ECHEQs para el criterio seleccionado.
                  </td>
                </tr>
              ) : (
                filteredCheques.map((c: ChequeCarteraDTO) => (
                  <tr key={c.id_pago} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-800">{c.numero_cheque}</div>
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          c.medio_pago === 'ECHEQ'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {c.medio_pago}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-center gap-1 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {c.banco_emisor}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{c.titular_nombre || '-'}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Clave: {c.clave_cliente || '-'} (Cuota #{c.nro_cuota})
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {c.cuit_librador || '-'}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatearFecha(c.fecha_emision)}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-800">{formatearFecha(c.fecha_cobro)}</div>
                      <span className="text-[10px] text-slate-400 font-sans block">
                        {c.dias_para_cobro > 0
                          ? `Faltan ${c.dias_para_cobro} días`
                          : c.dias_para_cobro === 0
                          ? 'Vence hoy'
                          : `Venció hace ${Math.abs(c.dias_para_cobro)} días`}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 text-right">
                      ${Number(c.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {renderBadgeCustodia(c)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};