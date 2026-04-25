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
      flex: 1 1 auto;
      min-width: 0;
      padding: 2px 6px;
      line-height: 1.35;
      font-family: var(--font-interface);
      overflow: visible;
      white-space: nowrap;
    }
    .${ROW_CLASS} {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 10px;
      color: var(--text-muted);
    }
    .${LABEL_CLASS} {
      color: var(--text-accent);
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-right: 3px;
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

/**
 * Insertion point: between the left nav buttons and the right "more" button,
 * i.e. right after `.view-header-nav-buttons`, left of `.view-header-right`.
 */
function getInsertionPoint(): { parent: HTMLElement; refChild: Node | null } | null {
  const right = document.querySelector('.view-header-right');
  if (right && right.parentElement) {
    return { parent: right.parentElement, refChild: right };
  }
  const header = document.querySelector('.view-header');
  if (header instanceof HTMLElement) {
    return { parent: header, refChild: null };
  }
  return null;
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

  const insertion = getInsertionPoint();
  if (!insertion) {
    return;
  }

  removeInfoContainer();

  const container = document.createElement('div');
  container.className = CONTAINER_CLASS;

  // Path
  if (settings.showPath) {
    container.appendChild(createInfoRow(t('bubble.path'), file.path));
  }

  // Creation time
  if (settings.showCtime) {
    const ctime = formatDate(file.stat.ctime, settings.dateFormat);
    container.appendChild(createInfoRow(t('bubble.ctime'), ctime));
  }

  // Modification time
  if (settings.showMtime) {
    const mtime = formatDate(file.stat.mtime, settings.dateFormat);
    container.appendChild(createInfoRow(t('bubble.mtime'), mtime));
  }

  // Custom items
  for (const item of settings.customItems) {
    if (!item.enabled) {
      continue;
    }
    const value = await getCustomItemValue(file, app, item);
    if (value) {
      container.appendChild(createInfoRow(item.label, value));
    }
  }

  insertion.parent.insertBefore(container, insertion.refChild);
}
