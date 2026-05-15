import { supabase } from './supabaseClient';

export async function listMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getMaterial(id) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createMaterial(payload) {
  const { data, error } = await supabase
    .from('materials')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMaterial(id, payload) {
  const { data, error } = await supabase
    .from('materials')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMaterial(id) {
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw error;
}

// Atomic stock change via RPC. delta is positive for IN, negative for OUT.
export async function updateStock(materialId, delta) {
  const { data, error } = await supabase.rpc('update_stock', {
    p_material_id: materialId,
    p_delta: delta,
  });
  if (error) throw error;
  return data; // returns new quantity
}
