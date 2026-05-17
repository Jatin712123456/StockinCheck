import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
  Pencil,
  Trash2,
  AlertTriangle,
  Save,
  X as XIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useMaterialsStore } from '../stores/materialsStore';
import { useTransactionsStore } from '../stores/transactionsStore';
import * as materialsService from '../services/materialsService';
import { recordStockMovement } from '../services/transactionsService';
import { formatQuantity, formatDateTime } from '../utils/formatters';
import { useDeferredFlag } from '../utils/useDeferredFlag';
import {
  required,
  nonNegativeNumber,
  positiveNumber,
  friendlyError,
} from '../utils/validators';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ErrorState from '../components/ui/ErrorState';

export default function MaterialDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { materials, updateMaterial, deleteMaterial } = useMaterialsStore();
  const { byMaterial, refreshMaterialTransactions } = useTransactionsStore();
  const isAdmin = profile?.role === 'admin';

  // Seed from the cached materials list if we have it, so navigation from
  // the Materials page is instant — no spinner.
  const cachedMaterial = materials.find((m) => m.id === id) || null;
  const cachedTxs = byMaterial[id]?.items || [];

  const [material, setMaterial] = useState(cachedMaterial);
  const [txs, setTxs] = useState(cachedTxs);
  const [fetching, setFetching] = useState(!cachedMaterial);
  const [error, setError] = useState(null);

  const coldStart = !cachedMaterial && !material;
  const showSpinner = useDeferredFlag(coldStart && fetching);

  const [stockModal, setStockModal] = useState(null); // 'IN' | 'OUT' | null
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function load() {
    setFetching(true);
    setError(null);
    try {
      const [m, t] = await Promise.all([
        materialsService.getMaterial(id),
        refreshMaterialTransactions(id, 20),
      ]);
      setMaterial(m);
      setTxs(t);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    // Always refresh in background; the UI shows cached data immediately.
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep displayed transactions in sync with the store as it updates.
  useEffect(() => {
    if (byMaterial[id]?.items) setTxs(byMaterial[id].items);
  }, [byMaterial, id]);

  if (showSpinner) return <Spinner />;
  if ((error || !material) && coldStart)
    return <ErrorState message={error || 'Not found'} onRetry={load} />;
  if (!material) return <Spinner />;

  const low = Number(material.quantity) < Number(material.minimum_stock);

  async function onConfirmStock(type, quantity, note) {
    try {
      await recordStockMovement({
        material,
        type,
        quantity,
        note,
        user,
        profile,
      });
      toast.success(type === 'IN' ? 'Stock added' : 'Stock removed');
      setStockModal(null);
      await load();
    } catch (e) {
      toast.error(friendlyError(e));
    }
  }

  async function onSaveEdit(payload) {
    try {
      const updated = await updateMaterial(material.id, payload);
      setMaterial(updated);
      toast.success('Material updated');
      setEditOpen(false);
    } catch (e) {
      toast.error(friendlyError(e));
    }
  }

  async function onConfirmDelete() {
    try {
      await deleteMaterial(material.id);
      toast.success('Material deleted');
      navigate('/materials');
    } catch (e) {
      toast.error(friendlyError(e));
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/materials')}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to materials
      </button>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">
              {material.name}
            </h1>
            {material.supplier && (
              <p className="text-sm text-gray-500">
                Supplier: {material.supplier}
              </p>
            )}
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Quantity" value={formatQuantity(material.quantity, material.unit)} />
          <Stat label="Minimum stock" value={formatQuantity(material.minimum_stock, material.unit)} />
          <Stat label="Unit" value={material.unit} />
          <Stat label="Updated" value={formatDateTime(material.updated_at)} />
        </div>

        {material.notes && (
          <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {material.notes}
          </div>
        )}

        {low && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              This material is below the minimum stock level of{' '}
              {formatQuantity(material.minimum_stock, material.unit)}.
            </span>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="success"
            size="lg"
            className="w-full"
            onClick={() => setStockModal('IN')}
          >
            <Plus className="h-4 w-4" /> Add stock
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="w-full"
            onClick={() => setStockModal('OUT')}
          >
            <Minus className="h-4 w-4" /> Remove stock
          </Button>
        </div>
      </Card>

      <Card>
        <div className="border-b border-gray-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent transactions
          </h2>
        </div>
        {txs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            No transactions yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {txs.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Badge tone={t.type === 'IN' ? 'green' : 'red'}>
                    {t.type}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {formatQuantity(t.quantity, material.unit)}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {t.user_name}
                      {t.note ? ` · ${t.note}` : ''}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-gray-500">
                  {formatDateTime(t.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <StockModal
        open={!!stockModal}
        type={stockModal}
        material={material}
        onClose={() => setStockModal(null)}
        onConfirm={onConfirmStock}
      />

      <EditModal
        open={editOpen}
        material={material}
        onClose={() => setEditOpen(false)}
        onSave={onSaveEdit}
      />

      <Modal
        open={deleteOpen}
        title="Delete material?"
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirmDelete}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          This will permanently delete{' '}
          <span className="font-medium text-gray-900">{material.name}</span> and
          all of its transactions. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function StockModal({ open, type, material, onClose, onConfirm }) {
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantity('');
      setNote('');
      setErrors({});
    }
  }, [open]);

  if (!open) return null;

  function validate() {
    const errs = {};
    const qErr = positiveNumber(quantity, 'Quantity');
    if (qErr) errs.quantity = qErr;
    if (!qErr && type === 'OUT' && Number(quantity) > Number(material.quantity)) {
      errs.quantity = `Cannot exceed current stock (${material.quantity})`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onConfirm(type, Number(quantity), note.trim());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={type === 'IN' ? 'Add stock' : 'Remove stock'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={type === 'IN' ? 'success' : 'danger'}
            onClick={submit}
            loading={submitting}
          >
            {type === 'IN' ? 'Add' : 'Remove'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          label={`Quantity (${material.unit})`}
          type="number"
          step="any"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={errors.quantity}
          autoFocus
        />
        <Input
          label="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. From supplier order #123"
        />
        <p className="text-xs text-gray-500">
          Current stock: {formatQuantity(material.quantity, material.unit)}
        </p>
      </form>
    </Modal>
  );
}

function EditModal({ open, material, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    unit: '',
    supplier: '',
    minimum_stock: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && material) {
      setForm({
        name: material.name || '',
        unit: material.unit || '',
        supplier: material.supplier || '',
        minimum_stock: String(material.minimum_stock ?? ''),
        notes: material.notes || '',
      });
      setErrors({});
    }
  }, [open, material]);

  function validate() {
    const errs = {};
    const nameErr = required(form.name, 'Name');
    if (nameErr) errs.name = nameErr;
    const unitErr = required(form.unit, 'Unit');
    if (unitErr) errs.unit = unitErr;
    const minErr = nonNegativeNumber(form.minimum_stock, 'Minimum stock');
    if (minErr) errs.minimum_stock = minErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSave({
        name: form.name.trim(),
        unit: form.unit.trim(),
        supplier: form.supplier.trim() || null,
        minimum_stock: Number(form.minimum_stock),
        notes: form.notes.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit material"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            <XIcon className="h-4 w-4" /> Cancel
          </Button>
          <Button onClick={submit} loading={submitting}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          error={errors.name}
        />
        <Input
          label="Unit"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          error={errors.unit}
          placeholder="e.g. Bags, Kg, Litres"
        />
        <Input
          label="Supplier"
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
        />
        <Input
          label="Minimum stock"
          type="number"
          step="any"
          min="0"
          value={form.minimum_stock}
          onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
          error={errors.minimum_stock}
        />
        <Input
          label="Notes"
          as="textarea"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </form>
    </Modal>
  );
}

