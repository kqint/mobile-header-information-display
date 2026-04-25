import { PluginSettingTab, Setting } from 'obsidian';
import type MobileHeaderInfoPlugin from './main';
import { t, setLocale } from './i18n';
import { type AppLocale, type DateFormat } from './types';

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
      .setName(t('settings.language'))
      .setDesc(t('settings.language-desc'))
      .addDropdown((dropdown) => {
        const locales: Array<{ value: AppLocale; labelKey: string }> = [
          { value: 'auto', labelKey: 'settings.language-auto' },
          { value: 'en', labelKey: 'settings.language-en' },
          { value: 'zh-CN', labelKey: 'settings.language-zh-CN' },
        ];

        for (const locale of locales) {
          dropdown.addOption(locale.value, t(locale.labelKey));
        }

        dropdown.setValue(this.plugin.settings.language);
        dropdown.onChange(async (value) => {
          this.plugin.settings.language = value as AppLocale;
          setLocale(this.plugin.settings.language);
          await this.plugin.saveSettings();
          await this.plugin.refreshBubbles();
          this.display();
        });
      });

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
            await this.plugin.refreshBubbles();
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
            await this.plugin.refreshBubbles();
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
            await this.plugin.refreshBubbles();
          }),
      );

    new Setting(containerEl)
      .setName(t('settings.date-format'))
      .setDesc(t('settings.date-format-desc'))
      .addDropdown((dropdown) => {
        const formats: DateFormat[] = ['YYYY-MM-DD HH:mm', 'YYYY-MM-DD', 'MM-DD HH:mm'];
        for (const fmt of formats) {
          dropdown.addOption(fmt, fmt);
        }
        dropdown.setValue(this.plugin.settings.dateFormat);
        dropdown.onChange(async (value) => {
          this.plugin.settings.dateFormat = value as DateFormat;
          await this.plugin.saveSettings();
          await this.plugin.refreshBubbles();
        });
      });

    new Setting(containerEl).setName(t('settings.custom-heading')).setHeading();
    new Setting(containerEl).setDesc(t('settings.custom-coming-soon'));
  }
}
