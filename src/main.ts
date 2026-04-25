import { Plugin, Platform } from 'obsidian';
import { type PluginSettings, type InfoItemDefinition, DEFAULT_SETTINGS } from './types';
import { MobileHeaderSettingTab } from './settings';
import { updateBubbles, removeInfoContainer } from './bubble-view';
import { setLocale } from './i18n';

export default class MobileHeaderInfoPlugin extends Plugin {
  settings!: PluginSettings;
  private registeredItems: Map<string, InfoItemDefinition> = new Map();

  async onload(): Promise<void> {
    await this.loadSettings();
    setLocale(this.settings.language);

    this.addSettingTab(new MobileHeaderSettingTab(this));

    if (!Platform.isMobile) {
      return;
    }

    // Wait for layout to be fully rendered before first injection
    this.app.workspace.onLayoutReady(() => {
      this.refreshBubbles();
    });

    // React to switching between notes/views
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.refreshBubbles();
      }),
    );

    // React to metadata changes (frontmatter updates)
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && file.path === activeFile.path) {
          this.refreshBubbles();
        }
      }),
    );

    // React to file content modifications (word count)
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && file.path === activeFile.path) {
          this.refreshBubbles();
        }
      }),
    );
  }

  onunload(): void {
    removeInfoContainer();
    this.registeredItems.clear();
  }

  async refreshBubbles(): Promise<void> {
    if (!Platform.isMobile) {
      return;
    }

    const file = this.app.workspace.getActiveFile();
    await updateBubbles(file, this.settings);
  }

  async loadSettings(): Promise<void> {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
    setLocale(this.settings.language);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  registerInfoItem(item: InfoItemDefinition): void {
    this.registeredItems.set(item.id, item);
    this.refreshBubbles();
  }

  unregisterInfoItem(id: string): void {
    this.registeredItems.delete(id);
    this.refreshBubbles();
  }
}
