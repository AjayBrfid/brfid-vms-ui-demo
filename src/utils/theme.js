export const Theme = {
  KEY: 'vms_theme',
  get() { return localStorage.getItem(this.KEY) || 'light'; },
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },
  init() { this.apply(this.get()); },
  toggle() {
    const next = this.get() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(this.KEY, next);
    this.apply(next);
    return next;
  },
};
