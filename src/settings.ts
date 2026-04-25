import { PluginSettingTab, Setting } from 'obsidian';
import type MobileHeaderInfoPlugin from './main';
import { type CustomInfoItem, type DateFormat, type CustomItemType } from './types';
import { t } from './i18n';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export class MobileHeaderSettingTab extends PluginSettingTab {
  plugin: MobileHeaderInfoPlugin;

  constructor(plugin: MobileHeaderInfoPlugin) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t('settings.plugin-enabled'))
      .setDesc(t('settings.plugin-enabled-desc'))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.pluginEnabled)
          .onChange(async (value) => {
            this.plugin.settings.pluginEnabled = value;
            await this.plugin.saveSettings();
            this.plugin.refreshBubbles();
          }),
      );

    new Setting(containerEl).setName(t('settings.heading')).setHeading();

    new Setting(containerEl)
      .setName(t('settings.show-path'))
      .setDesc(t('settings.show-path-desc'))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showPath)
          .onChange(async (value) => {
            this.plugin.settings.showPath = value;
            await this.plugin.saveSettings();
            this.plugin.refreshBubbles();
          }),
      );

    new Setting(containerEl)
      .setName(t('settings.show-ctime'))
      .setDesc(t('settings.show-ctime-desc'))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showCtime)
          .onChange(async (value) => {
            this.plugin.settings.showCtime = value;
            await this.plugin.saveSettings();
            this.plugin.refreshBubbles();
          }),
      );

    new Setting(containerEl)
      .setName(t('settings.show-mtime'))
      .setDesc(t('settings.show-mtime-desc'))
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showMtime)
          .onChange(async (value) => {
            this.plugin.settings.showMtime = value;
            await this.plugin.saveSettings();
            this.plugin.refreshBubbles();
          }),
      );

    new Setting(containerEl)
      .setName(t('settings.date-format'))
      .setDesc(t('settings.date-format-desc'))
      .addDropdown((dropdown) => {
        const formats: DateFormat[] = [
          'YYYY-MM-DD HH:mm',
          'YYYY-MM-DD',
          'MM-DD HH:mm',
        ];
        for (const fmt of formats) {
          dropdown.addOption(fmt, fmt);
        }
        dropdown.setValue(this.plugin.settings.dateFormat);
        dropdown.onChange(async (value) => {
          this.plugin.settings.dateFormat = value as DateFormat;
          await this.plugin.saveSettings();
          this.plugin.refreshBubbles();
        });
      });

    // Custom display items section
    new Setting(containerEl).setName(t('settings.custom-heading')).setHeading();

    const descSetting = new Setting(containerEl)
      .setDesc(t('settings.custom-desc'));

    descSetting.addButton((button) => {
      button.setButtonText(t('settings.custom-add'));
      button.onClick(async () => {
        const newItem: CustomInfoItem = {
          id: generateId(),
          label: '',
          type: 'static',
          value: '',
          enabled: true,
        };
        this.plugin.settings.customItems.push(newItem);
        await this.plugin.saveSettings();
        this.display();
      });
    });

    // Render custom items
    const items = this.plugin.settings.customItems;
    if (items.length === 0) {
      new Setting(containerEl).setDesc(t('settings.custom-empty'));
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        this.renderCustomItem(containerEl, item, i);
      }
    }
  }

  private renderCustomItem(containerEl: HTMLElement, item: CustomInfoItem, index: number): void {
    const setting = new Setting(containerEl);

    // Toggle enabled/disabled
    setting.addToggle((toggle) => {
      toggle.setValue(item.enabled);
      toggle.onChange(async (value) => {
        item.enabled = value;
        await this.plugin.saveSettings();
        this.plugin.refreshBubbles();
      });
    });

    // Label input
    setting.addText((text) => {
      text.setPlaceholder(t('settings.custom-label'));
      text.setValue(item.label);
      text.onChange(async (value) => {
        item.label = value;
        await this.plugin.saveSettings();
        this.plugin.refreshBubbles();
      });
    });

    // Type dropdown
    setting.addDropdown((dropdown) => {
      const types: Array<{ id: CustomItemType; labelKey: string }> = [
        { id: 'static', labelKey: 'settings.custom-type-static' },
        { id: 'frontmatter', labelKey: 'settings.custom-type-frontmatter' },
        { id: 'word-count', labelKey: 'settings.custom-type-word-count' },
      ];
      for (const type of types) {
        dropdown.addOption(type.id, t(type.labelKey));
      }
      dropdown.setValue(item.type);
      dropdown.onChange(async (value) => {
        item.type = value as CustomItemType;
        await this.plugin.saveSettings();
        this.plugin.refreshBubbles();
      });
    });

    // Value input
    setting.addText((text) => {
      text.setPlaceholder(t('settings.custom-value'));
      text.setValue(item.value);
      text.onChange(async (value) => {
        item.value = value;
        await this.plugin.saveSettings();
        this.plugin.refreshBubbles();
      });
    });

    // Remove button
    setting.addExtraButton((button) => {
      button.setIcon('trash');
      button.setTooltip(t('settings.custom-remove'));
      button.onClick(async () => {
        this.plugin.settings.customItems.splice(index, 1);
        await this.plugin.saveSettings();
        this.display();
      });
    });
  }
}
