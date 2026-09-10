const GlobalUI = {
  announce(message) {
    document.querySelectorAll('[data-global-status]').forEach((node) => {
      node.textContent = message;
    });
  },
  closeOthers(owner) {
    document.dispatchEvent(new CustomEvent('global-ui:close', { detail: { owner } }));
  },
};

class GlobalHeader extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.trigger = this.querySelector('[data-header-menu]');
    this.drawer = this.querySelector('[data-header-drawer]');

    this.trigger?.addEventListener('click', () => this.open(), { signal });
    this.querySelector('[data-header-close]')?.addEventListener('click', () => this.close(), { signal });
    this.drawer?.addEventListener('click', (event) => {
      if (event.target === this.drawer) this.close();
    }, { signal });
    this.drawer?.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close();
    }, { signal });
    document.addEventListener('global-ui:close', (event) => {
      if (event.detail.owner !== this) this.close(false);
    }, { signal });
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = null;
  }

  open() {
    if (!this.drawer || this.drawer.open) return;
    GlobalUI.closeOthers(this);
    this.lastFocused = document.activeElement;
    this.drawer.showModal();
    this.trigger?.setAttribute('aria-expanded', 'true');
    this.querySelector('[data-header-close]')?.focus();
  }

  close(restoreFocus = true) {
    if (!this.drawer?.open) return;
    this.drawer.close();
    this.trigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) this.lastFocused?.focus();
  }
}

class GlobalNavigation extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    this.querySelectorAll('[data-navigation-toggle]').forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const submenu = this.querySelector(`#${CSS.escape(toggle.getAttribute('aria-controls'))}`);
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        if (submenu) submenu.hidden = expanded;
      }, { signal: this.abortController.signal });
    });
<<<<<<< HEAD
    this.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const expanded = this.querySelector('[data-navigation-toggle][aria-expanded="true"]');
      if (!expanded) return;
      const submenu = this.querySelector(`#${CSS.escape(expanded.getAttribute('aria-controls'))}`);
      expanded.setAttribute('aria-expanded', 'false');
      if (submenu) submenu.hidden = true;
      expanded.focus();
      event.stopPropagation();
    }, { signal: this.abortController.signal });
=======
>>>>>>> 4cb7b22 (fix: isolate header navigation lifecycle)
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = null;
  }
}

class CartDrawer extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.dialog = this.querySelector('[data-cart-dialog]');

    document.addEventListener('click', (event) => this.onDocumentClick(event), { signal });
    document.addEventListener('cart:open', () => this.open(), { signal });
    document.addEventListener('cart:refresh', () => this.refresh(), { signal });
    document.addEventListener('global-ui:close', (event) => {
      if (event.detail.owner !== this) this.close(false);
    }, { signal });
    this.dialog?.addEventListener('click', (event) => {
      if (event.target === this.dialog || event.target.closest('[data-cart-close]')) this.close();
    }, { signal });
    this.dialog?.addEventListener('change', (event) => {
      const input = event.target.closest('[data-cart-quantity]');
      if (input) this.updateLine(input.dataset.lineKey, Math.max(0, Number(input.value) || 0));
    }, { signal });
    this.dialog?.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close();
    }, { signal });
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = null;
  }

  onDocumentClick(event) {
    const trigger = event.target.closest('[data-cart-open]');
    if (trigger) {
      event.preventDefault();
      this.open(trigger);
      return;
    }
    const remove = event.target.closest('[data-cart-remove]');
    if (remove && this.contains(remove)) {
      event.preventDefault();
      this.updateLine(remove.dataset.lineKey, 0);
    }
  }

  open(trigger = document.activeElement) {
    if (!this.dialog || this.dialog.open) return;
    GlobalUI.closeOthers(this);
    this.lastFocused = trigger;
    this.setState('opening');
    this.dialog.showModal();
    document.querySelectorAll('[data-cart-open]').forEach((node) => node.setAttribute('aria-expanded', 'true'));
    this.querySelector('[data-cart-close]')?.focus();
    this.setState(this.surface()?.dataset.cartEmpty === 'true' ? 'empty' : 'ready');
  }

  close(restoreFocus = true) {
    if (!this.dialog?.open) return;
    this.dialog.close();
    this.setState('closed');
    document.querySelectorAll('[data-cart-open]').forEach((node) => node.setAttribute('aria-expanded', 'false'));
    if (restoreFocus) this.lastFocused?.focus();
  }

  surface() {
    return this.querySelector('[data-cart-surface]');
  }

  setState(state) {
    this.dataset.state = state;
    this.dialog?.setAttribute('aria-busy', state === 'updating' ? 'true' : 'false');
  }

  setBusy(isBusy) {
    this.querySelectorAll('button, input, textarea').forEach((control) => {
      control.disabled = isBusy;
    });
  }

  updateCount(value) {
    document.querySelectorAll('[data-cart-count]').forEach((badge) => {
      badge.textContent = value;
      badge.hidden = Number(value) < 1;
    });
  }

  async updateLine(key, quantity) {
    this.setState('updating');
    this.setBusy(true);
    try {
      const response = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ updates: { [key]: quantity } }),
      });
      if (!response.ok) throw new Error('Cart update failed');
      await this.refresh();
      GlobalUI.announce(this.dataset.updatedMessage);
    } catch (error) {
      this.setState('error');
      GlobalUI.announce(this.dataset.errorMessage);
    } finally {
      this.setBusy(false);
    }
  }

  async refresh() {
    try {
      const sectionId = this.dataset.sectionId;
      const url = `${window.location.pathname}?sections=${encodeURIComponent(sectionId)}`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Cart refresh failed');
      const sections = await response.json();
      const documentFragment = new DOMParser().parseFromString(sections[sectionId], 'text/html');
      const nextSurface = documentFragment.querySelector('[data-cart-surface]');
      if (!nextSurface || !this.surface()) throw new Error('Cart fragment missing');
      this.surface().replaceWith(nextSurface);
      this.updateCount(nextSurface.dataset.cartItemCount || 0);
      this.setState(nextSurface.dataset.cartEmpty === 'true' ? 'empty' : 'ready');
    } catch (error) {
      this.setState('error');
      GlobalUI.announce(this.dataset.errorMessage);
    }
  }
}

class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    this.requestController = null;
    this.input = this.querySelector('[data-search-input]');
    this.output = this.querySelector('[data-search-predictive]');
    this.input?.addEventListener('input', () => this.schedule(), { signal: this.abortController.signal });
    this.input?.addEventListener('keydown', (event) => this.onKeydown(event), { signal: this.abortController.signal });
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.requestController?.abort();
    clearTimeout(this.timer);
    this.abortController = null;
  }

  schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.search(), Number(this.dataset.debounce) || 250);
  }

  async search() {
    const query = this.input?.value.trim() || '';
    if (this.dataset.enabled !== 'true' || query.length < Number(this.dataset.minChars || 2)) {
      this.clear();
      return;
    }
    this.requestController?.abort();
    this.requestController = new AbortController();
    this.dataset.state = 'querying';
    try {
      const types = 'product,collection,page,article';
      const url = `${window.Shopify.routes.root}search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=${types}&resources[limit]=${this.dataset.limit || 6}`;
      const response = await fetch(url, { signal: this.requestController.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Predictive search failed');
      const payload = await response.json();
      if ((this.input?.value.trim() || '') !== query) return;
      this.render(payload.resources?.results || {});
    } catch (error) {
      if (error.name === 'AbortError') return;
      this.clear();
      this.dataset.state = 'error';
    }
  }

  render(groups) {
    this.output.replaceChildren();
    const labels = {
      products: this.dataset.productsLabel,
      collections: this.dataset.collectionsLabel,
      pages: this.dataset.pagesLabel,
      articles: this.dataset.articlesLabel,
    };
    let count = 0;
    Object.entries(labels).forEach(([key, label]) => {
      const items = Array.isArray(groups[key]) ? groups[key] : [];
      if (!items.length) return;
      const group = document.createElement('section');
      const heading = document.createElement('h3');
      const list = document.createElement('ul');
      heading.textContent = label;
      list.setAttribute('role', 'listbox');
      items.forEach((item) => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.title;
        link.setAttribute('role', 'option');
        link.tabIndex = -1;
        listItem.append(link);
        list.append(listItem);
        count += 1;
      });
      group.append(heading, list);
      this.output.append(group);
    });
    this.dataset.state = count ? 'results' : 'empty';
    this.output.hidden = false;
    this.input?.setAttribute('aria-expanded', count ? 'true' : 'false');
  }

  clear() {
    this.output?.replaceChildren();
    if (this.output) this.output.hidden = true;
    this.dataset.state = 'idle';
    this.input?.setAttribute('aria-expanded', 'false');
  }

  onKeydown(event) {
    const links = [...this.output.querySelectorAll('a')];
    if (!links.length) return;
    const activeIndex = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      links[Math.min(activeIndex + 1, links.length - 1)]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      (activeIndex <= 0 ? this.input : links[activeIndex - 1])?.focus();
    } else if (event.key === 'Escape') {
      this.clear();
      this.input?.focus();
    }
  }
}

class SearchDrawer extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.dialog = this.querySelector('[data-search-dialog]');
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-search-open]');
      if (trigger) {
        event.preventDefault();
        this.open(trigger);
      }
    }, { signal });
    document.addEventListener('global-ui:close', (event) => {
      if (event.detail.owner !== this) this.close(false);
    }, { signal });
    this.dialog?.addEventListener('click', (event) => {
      if (event.target === this.dialog || event.target.closest('[data-search-close]')) this.close();
    }, { signal });
    this.dialog?.addEventListener('cancel', (event) => {
      event.preventDefault();
      this.close();
    }, { signal });
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = null;
  }

  open(trigger) {
    if (!this.dialog || this.dialog.open) return;
    GlobalUI.closeOthers(this);
    this.lastFocused = trigger;
    this.dialog.showModal();
    document.querySelectorAll('[data-search-open]').forEach((node) => node.setAttribute('aria-expanded', 'true'));
    this.querySelector('[data-search-input]')?.focus();
  }

  close(restoreFocus = true) {
    if (!this.dialog?.open) return;
    this.dialog.close();
    document.querySelectorAll('[data-search-open]').forEach((node) => node.setAttribute('aria-expanded', 'false'));
    this.querySelector('predictive-search')?.clear();
    if (restoreFocus) this.lastFocused?.focus();
  }
}

if (!customElements.get('global-header')) customElements.define('global-header', GlobalHeader);
if (!customElements.get('global-navigation')) customElements.define('global-navigation', GlobalNavigation);
if (!customElements.get('cart-drawer')) customElements.define('cart-drawer', CartDrawer);
if (!customElements.get('predictive-search')) customElements.define('predictive-search', PredictiveSearch);
if (!customElements.get('search-drawer')) customElements.define('search-drawer', SearchDrawer);
