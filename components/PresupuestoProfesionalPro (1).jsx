/**
 * PRESUPUESTO PROFESIONAL - SISTEMA COMPLETO
 * ✅ Con sincronización de datos Supabase
 * ✅ Cálculos actualizados
 * ✅ APU + Mediciones completos
 * ✅ Diseño minimalista profesional
 */

'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, Search, Trash2, FolderOpen, ChevronRight, ChevronDown, X, Check,
  AlertCircle, ArrowLeft, RefreshCw, Edit2
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const formatCurrency = (v) => v === null || isNaN(v) ? '—' : `RD$ ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (v, d = 2) => v === null || isNaN(v) ? '—' : Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const formatDate = (d) => !d ? '—' : new Date(d).toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' });

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
  return (
    <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000, background: bgColor, color: 'white', padding: '10px 16px', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
      {type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0' }}><X size={14} /></button>
    </div>
  );
};

export default function PresupuestoProfesionalPro({ userId, userEmail, onClose }) {
  const [vista, setVista] = useState('proyectos');
  const [proyectos, setProyectos] = useState([]);
  const [proyectoActivo, setProyectoActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModalNuevo, setShowModalNuevo] = useState(false);
  const [nuevoProyecto, setNuevoProyecto] = useState({
    nombre: '', cliente: '', ubicacion: '', descripcion: '',
    moneda: 'DOP', porcentaje_indirectos: 15, porcentaje_utilidad: 10, porcentaje_itbis: 18
  });

  useEffect(() => {
    if (userId && vista === 'proyectos') cargarProyectos();
  }, [userId, vista]);

  const cargarProyectos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('presupuesto_proyectos').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
      if (error) throw error;
      setProyectos(data || []);
    } catch (error) {
      console.error('Error:', error);
      setToast({ message: 'Error al cargar proyectos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const crearProyecto = async () => {
    if (!nuevoProyecto.nombre.trim()) {
      setToast({ message: 'Nombre requerido', type: 'error' });
      return;
    }
    try {
      const { data: proyecto, error: errorProyecto } = await supabase.from('presupuesto_proyectos')
        .insert([{ user_id: userId, costo_total: 0, ...nuevoProyecto }]).select().single();
      if (errorProyecto) throw errorProyecto;

      const capitulosBase = [
        { codigo: '1.00', descripcion: 'PRELIMINARES', orden: 1, nivel: 0 },
        { codigo: '2.00', descripcion: 'CIMENTACIONES', orden: 2, nivel: 0 },
        { codigo: '3.00', descripcion: 'ESTRUCTURA', orden: 3, nivel: 0 },
        { codigo: '4.00', descripcion: 'ALBAÑILERÍA', orden: 4, nivel: 0 },
        { codigo: '5.00', descripcion: 'ACABADOS', orden: 5, nivel: 0 },
        { codigo: '6.00', descripcion: 'INSTALACIONES', orden: 6, nivel: 0 },
      ];
      await supabase.from('presupuesto_capitulos').insert(capitulosBase.map(c => ({ proyecto_id: proyecto.id, ...c })));

      setToast({ message: 'Proyecto creado', type: 'success' });
      setShowModalNuevo(false);
      setNuevoProyecto({ nombre: '', cliente: '', ubicacion: '', descripcion: '', moneda: 'DOP', porcentaje_indirectos: 15, porcentaje_utilidad: 10, porcentaje_itbis: 18 });
      abrirProyecto(proyecto);
    } catch (error) {
      console.error('Error:', error);
      setToast({ message: 'Error al crear proyecto', type: 'error' });
    }
  };

  const abrirProyecto = (proyecto) => {
    setProyectoActivo(proyecto);
    setVista('editor');
  };

  const eliminarProyecto = async (proyectoId) => {
    if (!confirm('¿Eliminar proyecto?')) return;
    try {
      await supabase.from('presupuesto_proyectos').delete().eq('id', proyectoId);
      setToast({ message: 'Proyecto eliminado', type: 'success' });
      cargarProyectos();
    } catch (error) {
      setToast({ message: 'Error al eliminar', type: 'error' });
    }
  };

  const proyectosFiltrados = proyectos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.cliente && p.cliente.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.ubicacion && p.ubicacion.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ width: '100%', height: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {vista === 'proyectos' && (
        <PantallaProyectos
          proyectos={proyectosFiltrados}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onNuevoProyecto={() => setShowModalNuevo(true)}
          onAbrirProyecto={abrirProyecto}
          onEliminarProyecto={eliminarProyecto}
          onRefresh={cargarProyectos}
          onVolver={onClose}
        />
      )}

      {vista === 'editor' && proyectoActivo && (
        <EditorPresupuesto
          proyecto={proyectoActivo}
          userId={userId}
          onVolver={() => {
            setVista('proyectos');
            setProyectoActivo(null);
            cargarProyectos();
          }}
          onShowToast={(msg, type) => setToast({ message: msg, type })}
          onActualizarProyecto={setProyectoActivo}
        />
      )}

      {showModalNuevo && (
        <ModalNuevoProyecto
          proyecto={nuevoProyecto}
          onChange={setNuevoProyecto}
          onCrear={crearProyecto}
          onCancelar={() => {
            setShowModalNuevo(false);
            setNuevoProyecto({ nombre: '', cliente: '', ubicacion: '', descripcion: '', moneda: 'DOP', porcentaje_indirectos: 15, porcentaje_utilidad: 10, porcentaje_itbis: 18 });
          }}
        />
      )}
    </div>
  );
}

function PantallaProyectos({ proyectos, loading, searchTerm, onSearchChange, onNuevoProyecto, onAbrirProyecto, onEliminarProyecto, onRefresh, onVolver }) {
  const totalMonto = proyectos.reduce((sum, p) => sum + (p.costo_total || 0), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={onVolver} style={{ padding: '8px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={18} /></button>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>Presupuestos</h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onRefresh} style={{ padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Actualizar</button>
            <button onClick={onNuevoProyecto} style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: 'white' }}>+ Nuevo</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>Proyectos</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>{proyectos.length}</div>
          </div>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>Monto Total</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#059669', fontFamily: 'monospace' }}>{formatCurrency(totalMonto)}</div>
          </div>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' }}>Última Act.</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>{proyectos.length > 0 ? formatDate(proyectos[0].updated_at) : '—'}</div>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Buscar proyectos..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '14px', outline: 'none' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '10px' }} />
            <span style={{ fontSize: '13px' }}>Cargando...</span>
          </div>
        ) : proyectos.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#374151' }}>No hay proyectos</h3>
            <p style={{ fontSize: '13px' }}>Crea tu primer presupuesto</p>
            <button onClick={onNuevoProyecto} style={{ marginTop: '16px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>Crear Proyecto</button>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Proyecto</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Cliente</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Ubicación</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Monto</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', width: '80px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < proyectos.length - 1 ? '1px solid #f3f4f6' : 'none', background: 'white', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#fafafa'} onMouseLeave={e => e.currentTarget.style.background = 'white'} onClick={() => onAbrirProyecto(p)}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{p.nombre}</div>
                      {p.descripcion && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{p.descripcion.substring(0, 50)}</div>}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{p.cliente || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>{p.ubicacion || '—'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600', color: '#059669', fontSize: '13px' }}>{formatCurrency(p.costo_total || 0)}</td>
                    <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button onClick={() => onAbrirProyecto(p)} style={{ padding: '6px', background: '#eff6ff', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#3b82f6', display: 'flex' }}><FolderOpen size={14} /></button>
                        <button onClick={() => onEliminarProyecto(p.id)} style={{ padding: '6px', background: '#fef2f2', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function EditorPresupuesto({ proyecto, userId, onVolver, onShowToast, onActualizarProyecto }) {
  const [capitulos, setCapitulos] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [apuItems, setApuItems] = useState({});
  const [mediciones, setMediciones] = useState({});
  const [vistaEditor, setVistaEditor] = useState('tabla');
  const [partidaSeleccionada, setPartidaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBiblioteca, setShowBiblioteca] = useState(false);
  const [showParametros, setShowParametros] = useState(false);
  const [parametros, setParametros] = useState({
    porcentaje_indirectos: proyecto.porcentaje_indirectos,
    porcentaje_utilidad: proyecto.porcentaje_utilidad,
    porcentaje_itbis: proyecto.porcentaje_itbis
  });

  useEffect(() => {
    cargarDatos();
  }, [proyecto.id]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const { data: caps } = await supabase.from('presupuesto_capitulos').select('*').eq('proyecto_id', proyecto.id).order('orden');
      const { data: parts } = await supabase.from('presupuesto_partidas').select('*').eq('proyecto_id', proyecto.id).order('orden');
      setCapitulos(caps || []);
      setPartidas(parts || []);

      if (parts && parts.length > 0) {
        const pIds = parts.map(p => p.id);
        const { data: apus } = await supabase.from('presupuesto_apu_items').select('*').in('partida_id', pIds);
        const { data: meds } = await supabase.from('presupuesto_mediciones').select('*').in('partida_id', pIds);
        
        const aMap = {};
        (apus || []).forEach(a => { if (!aMap[a.partida_id]) aMap[a.partida_id] = []; aMap[a.partida_id].push(a); });
        setApuItems(aMap);

        const mMap = {};
        (meds || []).forEach(m => { if (!mMap[m.partida_id]) mMap[m.partida_id] = []; mMap[m.partida_id].push(m); });
        setMediciones(mMap);
      }

      // Calcular total
      await recalcularTotalProyecto(parts || []);
    } catch (error) {
      console.error('Error:', error);
      onShowToast('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const recalcularTotalProyecto = async (partidas) => {
    const total = partidas.reduce((sum, p) => sum + (p.subtotal || 0), 0);
    try {
      const { error } = await supabase.from('presupuesto_proyectos').update({ costo_total: total }).eq('id', proyecto.id);
      if (!error) {
        onActualizarProyecto({ ...proyecto, costo_total: total });
      }
    } catch (error) {
      console.error('Error updating total:', error);
    }
  };

  const agregarPartida = async (capituloId, datos) => {
    try {
      const subtotal = (datos.cantidad || 1) * (datos.precio_unitario || 0);
      const { data, error } = await supabase.from('presupuesto_partidas').insert([{ proyecto_id: proyecto.id, capitulo_id: capituloId, subtotal, ...datos }]).select().single();
      if (error) throw error;
      const newPartidas = [...partidas, data];
      setPartidas(newPartidas);
      await recalcularTotalProyecto(newPartidas);
      onShowToast('Partida agregada', 'success');
    } catch (error) {
      console.error('Error:', error);
      onShowToast('Error al agregar partida', 'error');
    }
  };

  const eliminarPartida = async (partidaId) => {
    if (!confirm('¿Eliminar partida?')) return;
    try {
      await supabase.from('presupuesto_partidas').delete().eq('id', partidaId);
      const newPartidas = partidas.filter(p => p.id !== partidaId);
      setPartidas(newPartidas);
      await recalcularTotalProyecto(newPartidas);
      if (partidaSeleccionada?.id === partidaId) setPartidaSeleccionada(null);
      onShowToast('Partida eliminada', 'success');
    } catch (error) {
      onShowToast('Error al eliminar', 'error');
    }
  };

  const actualizarPartida = async (partidaId, cambios) => {
    try {
      await supabase.from('presupuesto_partidas').update(cambios).eq('id', partidaId);
      const newPartidas = partidas.map(p => p.id === partidaId ? { ...p, ...cambios } : p);
      setPartidas(newPartidas);
      await recalcularTotalProyecto(newPartidas);
      if (partidaSeleccionada?.id === partidaId) setPartidaSeleccionada({ ...partidaSeleccionada, ...cambios });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const agregarAPU = async (partidaId, datos) => {
    try {
      const parcial = (datos.cantidad || 0) * (datos.precio_unitario || 0) / (datos.rendimiento || 1);
      const { data, error } = await supabase.from('presupuesto_apu_items').insert([{ partida_id: partidaId, ...datos, parcial }]).select().single();
      if (error) throw error;
      setApuItems({ ...apuItems, [partidaId]: [...(apuItems[partidaId] || []), data] });
      await recalcularAPU(partidaId);
      onShowToast('Recurso agregado', 'success');
    } catch (error) {
      onShowToast('Error al agregar', 'error');
    }
  };

  const eliminarAPU = async (apuId, partidaId) => {
    try {
      await supabase.from('presupuesto_apu_items').delete().eq('id', apuId);
      setApuItems({ ...apuItems, [partidaId]: (apuItems[partidaId] || []).filter(a => a.id !== apuId) });
      await recalcularAPU(partidaId);
      onShowToast('Recurso eliminado', 'success');
    } catch (error) {
      onShowToast('Error al eliminar', 'error');
    }
  };

  const actualizarAPU = async (apuId, partidaId, cambios) => {
    try {
      const parcial = (cambios.cantidad || 0) * (cambios.precio_unitario || 0) / (cambios.rendimiento || 1);
      await supabase.from('presupuesto_apu_items').update({ ...cambios, parcial }).eq('id', apuId);
      setApuItems({ ...apuItems, [partidaId]: apuItems[partidaId].map(a => a.id === apuId ? { ...a, ...cambios, parcial } : a) });
      await recalcularAPU(partidaId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const recalcularAPU = async (partidaId) => {
    const items = apuItems[partidaId] || [];
    const mat = items.filter(i => i.tipo === 'material').reduce((s, i) => s + (i.parcial || 0), 0);
    const mo = items.filter(i => i.tipo === 'mano_obra').reduce((s, i) => s + (i.parcial || 0), 0);
    const eq = items.filter(i => i.tipo === 'equipo').reduce((s, i) => s + (i.parcial || 0), 0);
    const pu = mat + mo + eq;
    const part = partidas.find(p => p.id === partidaId);
    const subt = (part?.cantidad || 0) * pu;
    
    await actualizarPartida(partidaId, {
      costo_materiales: mat,
      costo_mano_obra: mo,
      costo_equipos: eq,
      precio_unitario: pu,
      subtotal: subt
    });
  };

  const agregarMedicion = async (partidaId, datos) => {
    try {
      const parc = (datos.largo || 0) * (datos.ancho || 0) * (datos.alto || 0) * (datos.unidades || 1);
      const { data, error } = await supabase.from('presupuesto_mediciones').insert([{ partida_id: partidaId, ...datos, parcial: parc }]).select().single();
      if (error) throw error;
      setMediciones({ ...mediciones, [partidaId]: [...(mediciones[partidaId] || []), data] });
      await recalcularMediciones(partidaId);
      onShowToast('Medición agregada', 'success');
    } catch (error) {
      onShowToast('Error al agregar', 'error');
    }
  };

  const eliminarMedicion = async (medicionId, partidaId) => {
    try {
      await supabase.from('presupuesto_mediciones').delete().eq('id', medicionId);
      setMediciones({ ...mediciones, [partidaId]: (mediciones[partidaId] || []).filter(m => m.id !== medicionId) });
      await recalcularMediciones(partidaId);
      onShowToast('Medición eliminada', 'success');
    } catch (error) {
      onShowToast('Error al eliminar', 'error');
    }
  };

  const actualizarMedicion = async (medicionId, partidaId, cambios) => {
    try {
      const parc = (cambios.largo || 0) * (cambios.ancho || 0) * (cambios.alto || 0) * (cambios.unidades || 1);
      await supabase.from('presupuesto_mediciones').update({ ...cambios, parcial: parc }).eq('id', medicionId);
      setMediciones({ ...mediciones, [partidaId]: mediciones[partidaId].map(m => m.id === medicionId ? { ...m, ...cambios, parcial: parc } : m) });
      await recalcularMediciones(partidaId);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const recalcularMediciones = async (partidaId) => {
    const meds = mediciones[partidaId] || [];
    const cant = meds.reduce((s, m) => s + (m.parcial || 0), 0);
    const part = partidas.find(p => p.id === partidaId);
    const subt = cant * (part?.precio_unitario || 0);
    await actualizarPartida(partidaId, { cantidad: cant, subtotal: subt });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onVolver} style={{ padding: '8px', background: '#f3f4f6', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><ArrowLeft size={18} /></button>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>{proyecto.nombre}</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{proyecto.cliente || '—'} • {proyecto.ubicacion || '—'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '6px', padding: '3px' }}>
            <button onClick={() => setVistaEditor('tabla')} style={{ padding: '6px 12px', background: vistaEditor === 'tabla' ? 'white' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: vistaEditor === 'tabla' ? '#3b82f6' : '#6b7280' }}>Tabla</button>
            <button onClick={() => setVistaEditor('arbol')} style={{ padding: '6px 12px', background: vistaEditor === 'arbol' ? 'white' : 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: vistaEditor === 'arbol' ? '#3b82f6' : '#6b7280' }}>Árbol</button>
          </div>
          <button onClick={() => setShowBiblioteca(true)} style={{ padding: '8px 14px', background: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: 'white' }}>Biblioteca</button>
          <button onClick={() => setShowParametros(true)} style={{ padding: '8px 14px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Parámetros</button>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669', fontFamily: 'monospace', minWidth: '150px', textAlign: 'right' }}>
            {formatCurrency(proyecto.costo_total || 0)}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : vistaEditor === 'tabla' ? (
            <VistaTabla
              capitulos={capitulos}
              partidas={partidas}
              onAgregarPartida={agregarPartida}
              onEliminarPartida={eliminarPartida}
              onActualizarPartida={actualizarPartida}
              onSeleccionarPartida={setPartidaSeleccionada}
              onShowBiblioteca={() => setShowBiblioteca(true)}
            />
          ) : (
            <VistaArbol
              capitulos={capitulos}
              partidas={partidas}
              onSeleccionarPartida={setPartidaSeleccionada}
            />
          )}
        </div>

        {partidaSeleccionada && (
          <PanelDetalles
            partida={partidaSeleccionada}
            apuItems={apuItems[partidaSeleccionada.id] || []}
            mediciones={mediciones[partidaSeleccionada.id] || []}
            onCerrar={() => setPartidaSeleccionada(null)}
            onActualizarPartida={(c) => actualizarPartida(partidaSeleccionada.id, c)}
            onAgregarAPU={(d) => agregarAPU(partidaSeleccionada.id, d)}
            onEliminarAPU={(id) => eliminarAPU(id, partidaSeleccionada.id)}
            onActualizarAPU={(id, c) => actualizarAPU(id, partidaSeleccionada.id, c)}
            onAgregarMedicion={(d) => agregarMedicion(partidaSeleccionada.id, d)}
            onEliminarMedicion={(id) => eliminarMedicion(id, partidaSeleccionada.id)}
            onActualizarMedicion={(id, c) => actualizarMedicion(id, partidaSeleccionada.id, c)}
            onShowToast={onShowToast}
          />
        )}
      </div>

      {showBiblioteca && <ModalBiblioteca onCerrar={() => setShowBiblioteca(false)} onAgregar={(p, c) => { agregarPartida(c, p); setShowBiblioteca(false); }} capitulos={capitulos} />}
      {showParametros && <ModalParametros parametros={parametros} onChange={setParametros} onGuardar={async () => { await supabase.from('presupuesto_proyectos').update(parametros).eq('id', proyecto.id); onShowToast('Parámetros actualizados', 'success'); setShowParametros(false); }} onCancelar={() => setShowParametros(false)} />}
    </div>
  );
}

function VistaTabla({ capitulos, partidas, onAgregarPartida, onEliminarPartida, onActualizarPartida, onSeleccionarPartida, onShowBiblioteca }) {
  const [editando, setEditando] = useState(null);

  return (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Código</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase' }}>Descripción</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', width: '80px' }}>Unidad</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', width: '100px' }}>Cantidad</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', width: '120px' }}>P. Unitario</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', width: '120px' }}>Total</th>
            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', width: '80px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {capitulos.map(cap => {
            const partsDelCap = partidas.filter(p => p.capitulo_id === cap.id);
            const totalCap = partsDelCap.reduce((s, p) => s + (p.subtotal || 0), 0);
            return (
              <React.Fragment key={cap.id}>
                <tr style={{ background: '#f3f4f6', borderTop: '1px solid #e5e7eb' }}>
                  <td colSpan="7" style={{ padding: '12px 16px', fontWeight: '700', fontSize: '14px', color: '#111827' }}>
                    {cap.codigo} - {cap.descripcion}
                    <span style={{ marginLeft: '20px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Total: {formatCurrency(totalCap)}</span>
                  </td>
                </tr>
                {partsDelCap.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                      Sin partidas
                      <button onClick={onShowBiblioteca} style={{ marginLeft: '8px', padding: '6px 12px', background: '#3b82f6', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontWeight: '600', fontSize: '12px' }}>Agregar</button>
                    </td>
                  </tr>
                ) : (
                  partsDelCap.map(p => (
                    <FilaPartida key={p.id} partida={p} editando={editando} onEditar={setEditando} onActualizar={onActualizarPartida} onEliminar={onEliminarPartida} onSeleccionar={onSeleccionarPartida} />
                  ))
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FilaPartida({ partida, editando, onEditar, onActualizar, onEliminar, onSeleccionar }) {
  const [hover, setHover] = useState(false);

  const handleChange = (field, value) => {
    const cambios = { [field]: field === 'cantidad' || field === 'precio_unitario' ? parseFloat(value) || 0 : value };
    if (field === 'cantidad' || field === 'precio_unitario') {
      cambios.subtotal = (field === 'cantidad' ? parseFloat(value) || 0 : partida.cantidad) * (field === 'precio_unitario' ? parseFloat(value) || 0 : partida.precio_unitario);
    }
    onActualizar(partida.id, cambios);
    onEditar(null);
  };

  return (
    <tr style={{ borderBottom: '1px solid #f3f4f6', background: hover ? '#f9fafb' : 'white', cursor: 'pointer' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={() => onSeleccionar(partida)}>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>{partida.codigo}</td>
      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', fontWeight: '500' }} onDoubleClick={e => { e.stopPropagation(); onEditar({ id: partida.id, field: 'descripcion' }); }}>
        {editando?.id === partida.id && editando?.field === 'descripcion' ? (
          <input type="text" value={partida.descripcion} onChange={e => handleChange('descripcion', e.target.value)} autoFocus style={{ width: '100%', padding: '4px 8px', border: '2px solid #3b82f6', borderRadius: '4px', fontSize: '14px', outline: 'none' }} />
        ) : partida.descripcion}
      </td>
      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>{partida.unidad}</td>
      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', textAlign: 'right', fontFamily: 'monospace' }} onDoubleClick={e => { e.stopPropagation(); onEditar({ id: partida.id, field: 'cantidad' }); }}>
        {editando?.id === partida.id && editando?.field === 'cantidad' ? (
          <input type="number" value={partida.cantidad} onChange={e => handleChange('cantidad', e.target.value)} autoFocus step="0.01" style={{ width: '100%', padding: '4px 8px', border: '2px solid #3b82f6', borderRadius: '4px', fontSize: '14px', outline: 'none', textAlign: 'right' }} />
        ) : formatNumber(partida.cantidad || 0, 2)}
      </td>
      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#059669', textAlign: 'right', fontFamily: 'monospace', fontWeight: '600' }} onDoubleClick={e => { e.stopPropagation(); onEditar({ id: partida.id, field: 'precio_unitario' }); }}>
        {editando?.id === partida.id && editando?.field === 'precio_unitario' ? (
          <input type="number" value={partida.precio_unitario} onChange={e => handleChange('precio_unitario', e.target.value)} autoFocus step="0.01" style={{ width: '100%', padding: '4px 8px', border: '2px solid #3b82f6', borderRadius: '4px', fontSize: '14px', outline: 'none', textAlign: 'right' }} />
        ) : formatCurrency(partida.precio_unitario || 0)}
      </td>
      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', textAlign: 'right', fontFamily: 'monospace', fontWeight: '700' }}>{formatCurrency(partida.subtotal || 0)}</td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onEliminar(partida.id)} style={{ padding: '6px', background: '#fef2f2', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
      </td>
    </tr>
  );
}

function VistaArbol({ capitulos, partidas, onSeleccionarPartida }) {
  const [expandidos, setExpandidos] = useState({});

  return (
    <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '20px' }}>
      {capitulos.map(cap => {
        const parts = partidas.filter(p => p.capitulo_id === cap.id);
        const total = parts.reduce((s, p) => s + (p.subtotal || 0), 0);
        const isExp = expandidos[cap.id];

        return (
          <div key={cap.id} style={{ marginBottom: '16px' }}>
            <div onClick={() => setExpandidos({ ...expandidos, [cap.id]: !isExp })} style={{
              padding: '12px 16px', background: '#f3f4f6', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isExp ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{cap.codigo} - {cap.descripcion}</div>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{parts.length} partida(s)</div>
                </div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#059669', fontFamily: 'monospace' }}>{formatCurrency(total)}</div>
            </div>

            {isExp && parts.length > 0 && (
              <div style={{ marginTop: '8px', marginLeft: '32px', borderLeft: '2px solid #e5e7eb', paddingLeft: '20px' }}>
                {parts.map(p => (
                  <div key={p.id} onClick={() => onSeleccionarPartida(p)} style={{
                    padding: '10px 12px', background: 'white', borderRadius: '6px', marginBottom: '6px',
                    cursor: 'pointer', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between'
                  }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{p.codigo} - {p.descripcion}</div>
                      <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{formatNumber(p.cantidad || 0, 2)} {p.unidad}</div>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827', fontFamily: 'monospace' }}>{formatCurrency(p.subtotal || 0)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PanelDetalles({ partida, apuItems, mediciones, onCerrar, onActualizarPartida, onAgregarAPU, onEliminarAPU, onActualizarAPU, onAgregarMedicion, onEliminarMedicion, onActualizarMedicion, onShowToast }) {
  const [tab, setTab] = useState('info');
  const [nuevoAPU, setNuevoAPU] = useState({ tipo: 'material', codigo: '', descripcion: '', unidad: '', cantidad: 1, precio_unitario: 0, rendimiento: 1 });
  const [nuevaMedicion, setNuevaMedicion] = useState({ descripcion: '', largo: 0, ancho: 0, alto: 0, unidades: 1 });

  return (
    <div style={{ width: '400px', borderLeft: '1px solid #e5e7eb', background: '#fafafa', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: 'white', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#111827' }}>Detalles</h3>
        <button onClick={onCerrar} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
      </div>

      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        {['info', 'apu', 'mediciones'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px', background: tab === t ? '#f3f4f6' : 'transparent', border: 'none',
            borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer',
            fontWeight: '600', fontSize: '12px', color: tab === t ? '#3b82f6' : '#6b7280'
          }}>
            {t === 'info' ? 'Info' : t === 'apu' ? 'APU' : 'Mediciones'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Código</label>
              <div style={{ fontSize: '13px', color: '#111827', fontFamily: 'monospace' }}>{partida.codigo}</div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px', textTransform: 'uppercase' }}>Descripción</label>
              <input type="text" value={partida.descripcion} onChange={e => onActualizarPartida({ descripcion: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Unidad</label>
                <input type="text" value={partida.unidad} onChange={e => onActualizarPartida({ unidad: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Cantidad</label>
                <input type="number" value={partida.cantidad || 0} onChange={e => onActualizarPartida({ cantidad: parseFloat(e.target.value) || 0, subtotal: (parseFloat(e.target.value) || 0) * (partida.precio_unitario || 0) })} step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Precio Unitario</label>
              <input type="number" value={partida.precio_unitario || 0} onChange={e => onActualizarPartida({ precio_unitario: parseFloat(e.target.value) || 0, subtotal: (partida.cantidad || 0) * (parseFloat(e.target.value) || 0) })} step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div style={{ padding: '12px', background: '#dcfce7', borderRadius: '6px', fontWeight: '700', color: '#047857', fontSize: '14px', fontFamily: 'monospace', textAlign: 'right' }}>
              {formatCurrency(partida.subtotal || 0)}
            </div>
          </div>
        )}

        {tab === 'apu' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Agregar Recurso</div>
              <select value={nuevoAPU.tipo} onChange={e => setNuevoAPU({ ...nuevoAPU, tipo: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', outline: 'none' }}>
                <option value="material">Material</option>
                <option value="mano_obra">Mano de Obra</option>
                <option value="equipo">Equipo</option>
              </select>
              <input type="text" placeholder="Descripción" value={nuevoAPU.descripcion} onChange={e => setNuevoAPU({ ...nuevoAPU, descripcion: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', outline: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input type="number" placeholder="Cantidad" value={nuevoAPU.cantidad} onChange={e => setNuevoAPU({ ...nuevoAPU, cantidad: parseFloat(e.target.value) || 0 })} step="0.01" style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                <input type="number" placeholder="Precio" value={nuevoAPU.precio_unitario} onChange={e => setNuevoAPU({ ...nuevoAPU, precio_unitario: parseFloat(e.target.value) || 0 })} step="0.01" style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
              </div>
              <input type="number" placeholder="Rendimiento" value={nuevoAPU.rendimiento} onChange={e => setNuevoAPU({ ...nuevoAPU, rendimiento: parseFloat(e.target.value) || 1 })} step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', outline: 'none' }} />
              <button onClick={() => { onAgregarAPU(nuevoAPU); setNuevoAPU({ tipo: 'material', codigo: '', descripcion: '', unidad: '', cantidad: 1, precio_unitario: 0, rendimiento: 1 }); }} style={{ width: '100%', padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: '600', fontSize: '13px' }}>Agregar</button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Recursos ({apuItems.length})</div>
              {apuItems.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Sin recursos</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {apuItems.map(apu => (
                    <div key={apu.id} style={{ padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{apu.descripcion}</div>
                        <button onClick={() => onEliminarAPU(apu.id)} style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={12} /></button>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{apu.tipo}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <input type="number" value={apu.cantidad} onChange={e => onActualizarAPU(apu.id, { cantidad: parseFloat(e.target.value) || 0 })} step="0.01" style={{ padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', outline: 'none' }} />
                        <input type="number" value={apu.precio_unitario} onChange={e => onActualizarAPU(apu.id, { precio_unitario: parseFloat(e.target.value) || 0 })} step="0.01" style={{ padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', outline: 'none' }} />
                      </div>
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600', marginTop: '4px', fontFamily: 'monospace' }}>{formatCurrency(apu.parcial || 0)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'mediciones' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Agregar Medición</div>
              <input type="text" placeholder="Descripción" value={nuevaMedicion.descripcion} onChange={e => setNuevaMedicion({ ...nuevaMedicion, descripcion: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', outline: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input type="number" placeholder="Largo" value={nuevaMedicion.largo} onChange={e => setNuevaMedicion({ ...nuevaMedicion, largo: parseFloat(e.target.value) || 0 })} step="0.01" style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                <input type="number" placeholder="Ancho" value={nuevaMedicion.ancho} onChange={e => setNuevaMedicion({ ...nuevaMedicion, ancho: parseFloat(e.target.value) || 0 })} step="0.01" style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input type="number" placeholder="Alto" value={nuevaMedicion.alto} onChange={e => setNuevaMedicion({ ...nuevaMedicion, alto: parseFloat(e.target.value) || 0 })} step="0.01" style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                <input type="number" placeholder="Unidades" value={nuevaMedicion.unidades} onChange={e => setNuevaMedicion({ ...nuevaMedicion, unidades: parseInt(e.target.value) || 1 })} style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
              </div>
              <button onClick={() => { onAgregarMedicion(nuevaMedicion); setNuevaMedicion({ descripcion: '', largo: 0, ancho: 0, alto: 0, unidades: 1 }); }} style={{ width: '100%', padding: '8px', background: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: '600', fontSize: '13px' }}>Agregar</button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Mediciones ({mediciones.length})</div>
              {mediciones.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', padding: '20px' }}>Sin mediciones</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mediciones.map(med => (
                    <div key={med.id} style={{ padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>{med.descripcion || 'Medición'}</div>
                        <button onClick={() => onEliminarMedicion(med.id)} style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={12} /></button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '4px' }}>
                        <input type="number" value={med.largo} onChange={e => onActualizarMedicion(med.id, { largo: parseFloat(e.target.value) || 0 })} step="0.01" placeholder="L" style={{ padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', outline: 'none' }} />
                        <input type="number" value={med.ancho} onChange={e => onActualizarMedicion(med.id, { ancho: parseFloat(e.target.value) || 0 })} step="0.01" placeholder="A" style={{ padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', outline: 'none' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <input type="number" value={med.alto} onChange={e => onActualizarMedicion(med.id, { alto: parseFloat(e.target.value) || 0 })} step="0.01" placeholder="H" style={{ padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', outline: 'none' }} />
                        <input type="number" value={med.unidades} onChange={e => onActualizarMedicion(med.id, { unidades: parseInt(e.target.value) || 1 })} placeholder="U" style={{ padding: '4px', border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '12px', outline: 'none' }} />
                      </div>
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600', marginTop: '4px', fontFamily: 'monospace' }}>{formatNumber(med.parcial || 0, 2)} {partida.unidad}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalBiblioteca({ onCerrar, onAgregar, capitulos }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [capituloSeleccionado, setCapituloSeleccionado] = useState(capitulos[0]?.id || '');

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (busqueda.length < 2) { setResultados([]); return; }
      setLoading(true);
      try {
        const { data } = await supabase.from('analisis_costo').select('*').eq('tipo_fila', 'partida').ilike('descripcion', `%${busqueda}%`).limit(20);
        setResultados(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '8px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>Biblioteca</h3>
          <button onClick={onCerrar} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Capítulo</label>
            <select value={capituloSeleccionado} onChange={e => setCapituloSeleccionado(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }}>
              {capitulos.map(c => <option key={c.id} value={c.id}>{c.codigo} - {c.descripcion}</option>)}
            </select>
          </div>

          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input type="text" placeholder="Buscar partidas..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ width: '100%', padding: '8px 8px 8px 40px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>

          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>Buscando...</div>
            ) : resultados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>
                {busqueda.length < 2 ? 'Escribe al menos 2 caracteres' : 'No se encontraron partidas'}
              </div>
            ) : (
              resultados.map(p => (
                <div key={p.id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827', marginBottom: '2px' }}>{p.codigo} - {p.descripcion}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>Unidad: {p.unidad} • Precio: {formatCurrency(p.precio_unitario || 0)}</div>
                  </div>
                  <button onClick={() => onAgregar({ codigo: p.codigo, descripcion: p.descripcion, unidad: p.unidad || 'm²', cantidad: 1, precio_unitario: p.precio_unitario || 0, subtotal: p.precio_unitario || 0, orden: 999 }, capituloSeleccionado)} style={{ padding: '6px 12px', background: '#3b82f6', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'white', fontWeight: '600', fontSize: '12px', whiteSpace: 'nowrap' }}>Agregar</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalNuevoProyecto({ proyecto, onChange, onCrear, onCancelar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '8px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>Nuevo Proyecto</h3>
          <button onClick={onCancelar} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Nombre *</label>
            <input type="text" value={proyecto.nombre} onChange={e => onChange({ ...proyecto, nombre: e.target.value })} placeholder="Nombre del proyecto" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Cliente</label>
            <input type="text" value={proyecto.cliente} onChange={e => onChange({ ...proyecto, cliente: e.target.value })} placeholder="Nombre del cliente" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Ubicación</label>
            <input type="text" value={proyecto.ubicacion} onChange={e => onChange({ ...proyecto, ubicacion: e.target.value })} placeholder="Ciudad, País" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>Descripción</label>
            <textarea value={proyecto.descripcion} onChange={e => onChange({ ...proyecto, descripcion: e.target.value })} placeholder="Descripción breve..." rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>% Indirectos</label>
              <input type="number" value={proyecto.porcentaje_indirectos} onChange={e => onChange({ ...proyecto, porcentaje_indirectos: parseFloat(e.target.value) || 0 })} step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>% Utilidad</label>
              <input type="number" value={proyecto.porcentaje_utilidad} onChange={e => onChange({ ...proyecto, porcentaje_utilidad: parseFloat(e.target.value) || 0 })} step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>% ITBIS</label>
              <input type="number" value={proyecto.porcentaje_itbis} onChange={e => onChange({ ...proyecto, porcentaje_itbis: parseFloat(e.target.value) || 0 })} step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
            </div>
          </div>
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onCancelar} style={{ padding: '8px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#374151' }}>Cancelar</button>
          <button onClick={onCrear} style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: 'white' }}>Crear</button>
        </div>
      </div>
    </div>
  );
}

function ModalParametros({ parametros, onChange, onGuardar, onCancelar }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '8px', maxWidth: '400px', width: '100%' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>Parámetros</h3>
          <button onClick={onCancelar} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>% Indirectos</label>
            <input type="number" value={parametros.porcentaje_indirectos} onChange={e => onChange({ ...parametros, porcentaje_indirectos: parseFloat(e.target.value) || 0 })} step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>% Utilidad</label>
            <input type="number" value={parametros.porcentaje_utilidad} onChange={e => onChange({ ...parametros, porcentaje_utilidad: parseFloat(e.target.value) || 0 })} step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>% ITBIS</label>
            <input type="number" value={parametros.porcentaje_itbis} onChange={e => onChange({ ...parametros, porcentaje_itbis: parseFloat(e.target.value) || 0 })} step="0.01" style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
          </div>
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onCancelar} style={{ padding: '8px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: '#374151' }}>Cancelar</button>
          <button onClick={onGuardar} style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', color: 'white' }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}