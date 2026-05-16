// Trailing-edge debounce: schedules `fn` to run once after `delay` ms of quiet.
// Repeated calls reset the timer. Returns a cancel function on the debounced fn.
export function debounce(fn, delay = 400) {
  let timer = null;
  const debounced = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return debounced;
}
