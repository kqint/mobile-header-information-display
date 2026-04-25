import { type App, TFile, Platform } from 'obsidian';
import { type PluginSettings, type CustomInfoItem } from './types';
import { t } from './i18n';

const CONTAINER_CLASS = 'mhid-info-container';
const BUBBLE_CLASS = 'mhid-info-bubble';
const LABEL_CLASS = 'mhid-info-label';
const VALUE_CLASS = 'mhid-info-value';

function formatDate(timestamp: number, format: string): string {
  const date = new Date(timestamp);
  const pad = (n: number): string => n.toString().padStart(2, '0');
  const y = date.getFullYear().toString();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());

  switch (format) {
    case 'YYYY-MM-DD':
      return `${y}-${mo}-${d}`;
    case 'MM-DD HH:mm':
      return `${mo}-${d} ${h}:${m}`;
    case 'YYYY-MM-DD HH:mm':
    default:
      return `${y}-${mo}-${d} ${h}:${m}`;
  }
}

function createBubble(label: string, value: string): HTMLElement {
  const bubble = document.createElement('div');
  bubble.className = BUBBLE_CLASS;

  const labelEl = document.createElement('span');
  labelEl.className = LABEL_CLASS;
  labelEl.textContent = label + ':';

  const valueEl = document.createElement('span');
  valueEl.className = VALUE_CLASS;
  valueEl.textContent = value;

  bubble.appendChild(labelEl);
  bubble.appendChild(valueEl);
  return bubble;
}

async function getCustomItemValue(file: TFile, app: App, item: CustomInfoItem): Promise<string> {
  switch (item.type) {
    case 'static':
      return item.value;
    case 'frontmatter': {
      const cache = app.metadataCache.getFileCache(file);
      const frontmatter = cache?.frontmatter;
      if (frontmatter && item.value in frontmatter) {
        const val = frontmatter[item.value];
        return val != null ? String(val) : '';
      }
      return '';
    }
    case 'word-count': {
      const content = await app.vault.cachedRead(file);
      const words = content.trim().split(/\s+/).filter(Boolean).length;
      return words.toString();
    }
    default:
      return '';
  }
}

export function removeInfoContainer(): void {
  const existing = document.querySelector(`.${CONTAINER_CLASS}`);
  if (existing) {
    existing.remove();
  }
}

export async function updateBubbles(
  app: App,
  file: TFile | null,
  settings: PluginSettings,
): Promise<void> {
  if (!Platform.isMobile) {
    return;
  }

  if (!settings.pluginEnabled || !file) {
    removeInfoContainer();
    return;
  }

  const header = document.querySelector('.view-header');
  if (!(header instanceof HTMLElement)) {
    return;
  }

  // Prevent the header from clipping the bubble row
  header.style.overflow = 'visible';
  header.style.minHeight = 'auto';

  removeInfoContainer();

  const container = document.createElement('div');
  container.className = CONTAINER_CLASS;
  const items: Array<{ label: string; value: string }> = [];

  if (settings.showPath) {
    items.push({ label: t('bubble.path'), value: file.path });
  }

  if (settings.showCtime) {
    const ctime = formatDate(file.stat.ctime, settings.dateFormat);
    items.push({ label: t('bubble.ctime'), value: ctime });
  }

  if (settings.showMtime) {
    const mtime = formatDate(file.stat.mtime, settings.dateFormat);
    items.push({ label: t('bubble.mtime'), value: mtime });
  }

  for (const item of settings.customItems) {
    if (!item.enabled) {
      continue;
    }
    const value = await getCustomItemValue(file, app, item);
    if (value) {
      items.push({ label: item.label, value });
    }
  }

  if (items.length === 0) {
    return;
  }

  for (const item of items) {
    container.appendChild(createBubble(item.label, item.value));
  }

  // Insert right after the title container, so the info sits between
  // the left nav area and the right controls.
  const titleContainer = header.querySelector('.view-header-title-container');
  if (titleContainer instanceof HTMLElement) {
    titleContainer.style.overflow = 'visible';
    titleContainer.after(container);
  } else {
    header.appendChild(container);
  }
}
