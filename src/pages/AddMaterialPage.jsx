import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';
import { useMaterialsStore } from '../stores/materialsStore';
import {
  required,
  nonNegativeNumber,
  friendlyError,
} from '../utils/validators';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function AddMaterialPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addMaterial } = useMaterialsStore();

  const [form, setForm] = useState({
    name: '',
    quantity: '',
    unit: '',
    supplier: '',
    minimum_stock: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs = {};
    const nameErr = required(form.name, 'Material name');
    if (nameErr) errs.name = nameErr;
    const qErr = nonNegativeNumber(form.quantity, 'Initial quantity');
    if (qErr) errs.quantity = qErr;
    const unitErr = required(form.unit, 'Unit');
    if (unitErr) errs.unit = unitErr;
    const minErr = nonNegativeNumber(form.minimum_stock, 'Minimum stock');
    if (minErr) errs.minimum_stock = minErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await addMaterial({
        name: form.name.trim(),
        quantity: Number(form.quantity),
        unit: form.unit.trim(),
        supplier: form.supplier.trim() || null,
        minimum_stock: Number(form.minimum_stock),
        notes: form.notes.trim() || null,
        created_by: user.id,
      });
      toast.success('Material added');
      navigate('/materials');
    } catch (err) {
      toast.error(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <button
        onClick={() => navigate('/materials')}
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to materials
      </button>

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Add material</h1>
        <p className="text-sm text-gray-500">
          Create a new material to start tracking stock.
        </p>
      </div>

      <Card className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Material name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Cement"
            error={errors.name}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial quantity"
              type="number"
              step="any"
              min="0"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              error={errors.quantity}
            />
            <Input
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="Bags, Kg, Litres"
              error={errors.unit}
            />
          </div>
          <Input
            label="Supplier (optional)"
            value={form.supplier}
            onChange={(e) => setForm({ ...form, supplier: e.target.value })}
          />
          <Input
            label="Minimum stock level"
            type="number"
            step="any"
            min="0"
            value={form.minimum_stock}
            onChange={(e) =>
              setForm({ ...form, minimum_stock: e.target.value })
            }
            error={errors.minimum_stock}
            hint="A low-stock warning shows when quantity falls below this value."
          />
          <Input
            label="Notes (optional)"
            as="textarea"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/materials')}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save material
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
