export type DateFormat = 'YYYY-MM-DD HH:mm' | 'YYYY-MM-DD' | 'MM-DD HH:mm';
export type AppLocale = 'auto' | 'en' | 'zh-CN';

export interface PluginSettings {
  language: AppLocale;
  showPath: boolean;
  showCtime: boolean;
  showMtime: boolean;
  dateFormat: DateFormat;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  language: 'auto',
  showPath: true,
  showCtime: true,
  showMtime: true,
  dateFormat: 'YYYY-MM-DD HH:mm',
};

export interface InfoItemRegistrar {
  registerInfoItem(item: InfoItemDefinition): void;
  unregisterInfoItem(id: string): void;
}

export interface InfoItemDefinition {
  id: string;
  labelKey: string;
  getValue: () => string;
}
