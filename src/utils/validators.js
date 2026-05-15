export function required(value, label = 'This field') {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required`;
  }
  return null;
}

export function nonNegativeNumber(value, label = 'Value') {
  if (value === '' || value === null || value === undefined) {
    return `${label} is required`;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (n < 0) return `${label} cannot be negative`;
  return null;
}

export function positiveNumber(value, label = 'Quantity') {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${label} must be a number`;
  if (n <= 0) return `${label} must be greater than 0`;
  return null;
}

export function validEmail(value) {
  if (!value) return 'Email is required';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter a valid email';
  return null;
}

// Maps common Supabase / Postgres error strings to friendly messages.
export function friendlyError(err) {
  if (!err) return 'Something went wrong';
  const msg = err.message || String(err);
  if (/Invalid login credentials/i.test(msg)) return 'Wrong email or password';
  if (/Email not confirmed/i.test(msg)) return 'Please confirm your email first';
  if (/Insufficient stock/i.test(msg)) return 'Not enough stock to remove that amount';
  if (/Material not found/i.test(msg)) return 'Material no longer exists';
  if (/duplicate key/i.test(msg)) return 'That record already exists';
  if (/permission denied|row-level security/i.test(msg))
    return 'You don’t have permission to do that';
  if (/network|fetch/i.test(msg)) return 'Network error. Please try again';
  return msg;
}
