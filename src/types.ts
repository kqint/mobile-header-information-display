export type DateFormat = 'YYYY-MM-DD HH:mm' | 'YYYY-MM-DD' | 'MM-DD HH:mm';

export type CustomItemType = 'static' | 'frontmatter' | 'word-count';

export interface CustomInfoItem {
  id: string;
  label: string;
  type: CustomItemType;
  value: string;
  enabled: boolean;
}

export interface PluginSettings {
  pluginEnabled: boolean;
  showPath: boolean;
  showCtime: boolean;
  showMtime: boolean;
  dateFormat: DateFormat;
  customItems: CustomInfoItem[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
  pluginEnabled: true,
  showPath: true,
  showCtime: true,
  showMtime: true,
  dateFormat: 'YYYY-MM-DD HH:mm',
  customItems: [],
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
