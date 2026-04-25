import { Plugin, Platform } from 'obsidian';
import { type PluginSettings, type InfoItemDefinition, DEFAULT_SETTINGS } from './types';
import { MobileHeaderSettingTab } from './settings';
import { updateBubbles, removeInfoContainer } from './bubble-view';

export default class MobileHeaderInfoPlugin extends Plugin {
  settings!: PluginSettings;
  private registeredItems: Map<string, InfoItemDefinition> = new Map();
  private activeFileChangeHandler: (() => void) | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Register settings tab
    this.addSettingTab(new MobileHeaderSettingTab(this));

    // Only on mobile: set up the active leaf change listener
    if (Platform.isMobile) {
      this.setupActiveLeafListener();
    }

    // Register event for metadata changes (to update frontmatter-based custom items)
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && file.path === activeFile.path) {
          this.refreshBubbles();
        }
      }),
    );

    // Register event for file modifications (to update word count)
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile && file.path === activeFile.path) {
          this.refreshBubbles();
        }
      }),
    );

    // Initial refresh
    this.refreshBubbles();
  }

  onunload(): void {
    removeInfoContainer();
    this.registeredItems.clear();
  }

  private setupActiveLeafListener(): void {
    this.activeFileChangeHandler = (): void => {
      this.refreshBubbles();
    };

    this.registerEvent(
      this.app.workspace.on('active-leaf-change', this.activeFileChangeHandler),
    );
  }

  async refreshBubbles(): Promise<void> {
    if (!Platform.isMobile) {
      return;
    }

    const file = this.app.workspace.getActiveFile();
    await updateBubbles(this.app, file, this.settings);
  }

  async loadSettings(): Promise<void> {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /**
   * Register a custom info item programmatically (for other plugins to use).
   */
  registerInfoItem(item: InfoItemDefinition): void {
    this.registeredItems.set(item.id, item);
    this.refreshBubbles();
  }

  /**
   * Unregister a previously registered info item.
   */
  unregisterInfoItem(id: string): void {
    this.registeredItems.delete(id);
    this.refreshBubbles();
  }
}
