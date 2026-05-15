import { supabase } from './supabaseClient';
import { updateStock } from './materialsService';

export async function listTransactions({ limit = 50, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return data || [];
}

export async function listTransactionsForMaterial(materialId, limit = 20) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('material_id', materialId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function listTransactionsSince(sinceIso) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('created_at', sinceIso);
  if (error) throw error;
  return data || [];
}

// Recording a stock movement = update stock atomically + log a transaction row.
export async function recordStockMovement({
  material,
  type, // 'IN' | 'OUT'
  quantity,
  note,
  user,
  profile,
}) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('Quantity must be a positive number');
  }
  const delta = type === 'IN' ? qty : -qty;

  // 1. Atomic stock update (rejects if it would go negative).
  await updateStock(material.id, delta);

  // 2. Insert the log row.
  const { error } = await supabase.from('transactions').insert({
    material_id: material.id,
    material_name: material.name,
    type,
    quantity: qty,
    note: note || null,
    user_id: user.id,
    user_name: profile?.name || user.email,
  });
  if (error) throw error;
}
