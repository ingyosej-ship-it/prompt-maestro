// lib/presupuestosAPI.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hbolprmitnjqxvmfddhl.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_ATBpGkcNJ_DWWKKkt-ZKPg_5p7ZPQjQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==================== PRESUPUESTOS ====================

/**
 * Obtiene todos los presupuestos del usuario
 * @returns {Promise<Array>} Lista de presupuestos
 */
export async function getPresupuestos() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    throw error;
  }
}

/**
 * Obtiene un presupuesto específico por ID
 * @param {string} presupuestoId - ID del presupuesto
 * @returns {Promise<Object>} Datos del presupuesto
 */
export async function getPresupuesto(presupuestoId) {
  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .select('*')
      .eq('id', presupuestoId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al obtener presupuesto:', error);
    throw error;
  }
}

/**
 * Crea un nuevo presupuesto
 * @param {Object} presupuestoData - Datos del presupuesto (nombre, descripcion, cliente, etc.)
 * @returns {Promise<Object>} Presupuesto creado
 */
export async function crearPresupuesto(presupuestoData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('presupuestos')
      .insert([{
        user_id: user.id,
        nombre: presupuestoData.nombre || 'Nuevo Presupuesto',
        descripcion: presupuestoData.descripcion || '',
        cliente: presupuestoData.cliente || '',
        ubicacion: presupuestoData.ubicacion || '',
        fecha: presupuestoData.fecha || new Date().toISOString(),
        total: 0,
        estado: 'borrador',
        ...presupuestoData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al crear presupuesto:', error);
    throw error;
  }
}

/**
 * Elimina un presupuesto
 * @param {string} presupuestoId - ID del presupuesto a eliminar
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export async function eliminarPresupuesto(presupuestoId) {
  try {
    // Primero eliminar todos los items del presupuesto
    await supabase
      .from('presupuesto_items')
      .delete()
      .eq('presupuesto_id', presupuestoId);

    // Luego eliminar el presupuesto
    const { error } = await supabase
      .from('presupuestos')
      .delete()
      .eq('id', presupuestoId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    throw error;
  }
}

// ==================== CONCEPTOS/CATEGORÍAS ====================

/**
 * Obtiene todos los conceptos/categorías disponibles
 * @returns {Promise<Array>} Lista de conceptos
 */
export async function getConceptos() {
  try {
    const { data, error } = await supabase
      .from('conceptos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener conceptos:', error);
    throw error;
  }
}

/**
 * Crea un nuevo concepto/categoría
 * @param {Object} conceptoData - Datos del concepto (nombre, descripcion, etc.)
 * @returns {Promise<Object>} Concepto creado
 */
export async function crearConcepto(conceptoData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await supabase
      .from('conceptos')
      .insert([{
        nombre: conceptoData.nombre,
        descripcion: conceptoData.descripcion || '',
        user_id: user.id,
        ...conceptoData
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al crear concepto:', error);
    throw error;
  }
}

// ==================== ITEMS DE PRESUPUESTO ====================

/**
 * Agrega un item/partida a un presupuesto
 * @param {string} presupuestoId - ID del presupuesto
 * @param {Object} itemData - Datos del item (descripcion, cantidad, precio_unitario, etc.)
 * @returns {Promise<Object>} Item creado
 */
export async function agregarItemPresupuesto(presupuestoId, itemData) {
  try {
    const { data, error } = await supabase
      .from('presupuesto_items')
      .insert([{
        presupuesto_id: presupuestoId,
        codigo: itemData.codigo || '',
        descripcion: itemData.descripcion,
        unidad: itemData.unidad || 'u',
        cantidad: itemData.cantidad || 1,
        precio_unitario: itemData.precio_unitario || 0,
        subtotal: (itemData.cantidad || 1) * (itemData.precio_unitario || 0),
        categoria: itemData.categoria || '',
        tipo: itemData.tipo || 'material',
        ...itemData
      }])
      .select()
      .single();

    if (error) throw error;

    // Actualizar el total del presupuesto
    await actualizarTotalPresupuesto(presupuestoId);

    return data;
  } catch (error) {
    console.error('Error al agregar item:', error);
    throw error;
  }
}

/**
 * Actualiza la cantidad de un item
 * @param {string} itemId - ID del item
 * @param {number} nuevaCantidad - Nueva cantidad
 * @returns {Promise<Object>} Item actualizado
 */
export async function actualizarCantidadItem(itemId, nuevaCantidad) {
  try {
    // Primero obtener el item para calcular el nuevo subtotal
    const { data: item, error: fetchError } = await supabase
      .from('presupuesto_items')
      .select('*, presupuesto_id')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const nuevoSubtotal = nuevaCantidad * item.precio_unitario;

    const { data, error } = await supabase
      .from('presupuesto_items')
      .update({
        cantidad: nuevaCantidad,
        subtotal: nuevoSubtotal
      })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    // Actualizar el total del presupuesto
    await actualizarTotalPresupuesto(item.presupuesto_id);

    return data;
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    throw error;
  }
}

/**
 * Elimina un item del presupuesto
 * @param {string} itemId - ID del item a eliminar
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export async function eliminarItemPresupuesto(itemId) {
  try {
    // Primero obtener el presupuesto_id antes de eliminar
    const { data: item, error: fetchError } = await supabase
      .from('presupuesto_items')
      .select('presupuesto_id')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('presupuesto_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Actualizar el total del presupuesto
    await actualizarTotalPresupuesto(item.presupuesto_id);

    return true;
  } catch (error) {
    console.error('Error al eliminar item:', error);
    throw error;
  }
}

// ==================== FUNCIONES AUXILIARES ====================

/**
 * Actualiza el total de un presupuesto sumando todos sus items
 * @param {string} presupuestoId - ID del presupuesto
 */
async function actualizarTotalPresupuesto(presupuestoId) {
  try {
    // Obtener todos los items del presupuesto
    const { data: items, error: itemsError } = await supabase
      .from('presupuesto_items')
      .select('subtotal')
      .eq('presupuesto_id', presupuestoId);

    if (itemsError) throw itemsError;

    // Calcular el total
    const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);

    // Actualizar el presupuesto
    const { error: updateError } = await supabase
      .from('presupuestos')
      .update({ total })
      .eq('id', presupuestoId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error al actualizar total del presupuesto:', error);
  }
}

/**
 * Obtiene todos los items de un presupuesto
 * @param {string} presupuestoId - ID del presupuesto
 * @returns {Promise<Array>} Lista de items
 */
export async function getItemsPresupuesto(presupuestoId) {
  try {
    const { data, error } = await supabase
      .from('presupuesto_items')
      .select('*')
      .eq('presupuesto_id', presupuestoId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error al obtener items:', error);
    throw error;
  }
}

/**
 * Actualiza un presupuesto completo
 * @param {string} presupuestoId - ID del presupuesto
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<Object>} Presupuesto actualizado
 */
export async function actualizarPresupuesto(presupuestoId, updates) {
  try {
    const { data, error } = await supabase
      .from('presupuestos')
      .update(updates)
      .eq('id', presupuestoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error al actualizar presupuesto:', error);
    throw error;
  }
}
