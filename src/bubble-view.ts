import { type App, TFile, Platform } from 'obsidian';
import { type PluginSettings, type CustomInfoItem } from './types';
import { t } from './i18n';

const CONTAINER_CLASS = 'mhid-info-container';
const ROW_CLASS = 'mhid-info-row';
const LABEL_CLASS = 'mhid-info-label';
const VALUE_CLASS = 'mhid-info-value';

let styleInjected = false;

function injectStyles(): void {
  if (styleInjected) {
    return;
  }
  const style = document.createElement('style');
  style.textContent = `
    .${CONTAINER_CLASS} {
      flex: 0 0 auto;
      padding: 2px 4px;
      line-height: 1.35;
      font-family: var(--font-interface);
      overflow: visible;
    }
    .${ROW_CLASS} {
      font-size: 10px;
      color: var(--text-muted);
      overflow-wrap: break-word;
      word-break: break-word;
      line-height: 1.35;
      padding: 1px 0;
    }
    .${LABEL_CLASS} {
      color: var(--text-accent);
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-right: 3px;
      white-space: nowrap;
    }
    .${VALUE_CLASS} {
      color: var(--text-normal);
      font-size: 10px;
    }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}

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

function createInfoRow(label: string, value: string): HTMLElement {
  const row = document.createElement('div');
  row.className = ROW_CLASS;

  const labelEl = document.createElement('span');
  labelEl.className = LABEL_CLASS;
  labelEl.textContent = label + ':';

  const valueEl = document.createElement('span');
  valueEl.className = VALUE_CLASS;
  valueEl.textContent = value;

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
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

  injectStyles();

  const header = document.querySelector('.view-header');
  if (!(header instanceof HTMLElement)) {
    return;
  }

  // Remove clipping so multi-line content is visible
  header.style.overflow = 'visible';
  header.style.minHeight = 'auto';

  removeInfoContainer();

  const container = document.createElement('div');
  container.className = CONTAINER_CLASS;

  if (settings.showPath) {
    container.appendChild(createInfoRow(t('bubble.path'), file.path));
  }

  if (settings.showCtime) {
    const ctime = formatDate(file.stat.ctime, settings.dateFormat);
    container.appendChild(createInfoRow(t('bubble.ctime'), ctime));
  }

  if (settings.showMtime) {
    const mtime = formatDate(file.stat.mtime, settings.dateFormat);
    container.appendChild(createInfoRow(t('bubble.mtime'), mtime));
  }

  for (const item of settings.customItems) {
    if (!item.enabled) {
      continue;
    }
    const value = await getCustomItemValue(file, app, item);
    if (value) {
      container.appendChild(createInfoRow(item.label, value));
    }
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
