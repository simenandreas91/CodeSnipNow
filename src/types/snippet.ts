export interface User {
  id: string;
  email?: string;
  name?: string;
}

export interface Snippet {
  id: string;
  name: string;
  description: string;
  script: string;
  artifact_type: string;
  collection: string;
  condition: string;
  when: string;
  order: number;
  priority: number;
  active: boolean;
  advanced: boolean;
  field_name: string;
  global: boolean;
  isolate_script: boolean;
  applies_extended: boolean;
  messages: string;
  order_value: number;
  view: string;
  ui_type_code: number;
  // Script Include specific fields
  api_name: string;
  client_callable: boolean;
  access_level: string;
  caller_access: string;
  mobile_callable: boolean;
  sandbox_callable: boolean;
  sys_policy: string;
  // Service Portal Widget specific fields
  html: string;
  css: string;
  client_script: string;
  server_script: string;
  controller_as: string;
  link: string;
  demo_data: any;
  option_schema: any;
  repo_path: string;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  sys_id: string;
  user_id: string;
}

export interface CreateSnippetData {
  name: string;
  description: string;
  script: string;
  artifact_type: string;
  collection?: string;
  condition?: string;
  when?: string;
  order?: number;
  priority?: number;
  active?: boolean;
  advanced?: boolean;
  field_name?: string;
  global?: boolean;
  isolate_script?: boolean;
  applies_extended?: boolean;
  messages?: string;
  order_value?: number;
  view?: string;
  ui_type_code?: number;
  // Script Include specific fields
  api_name?: string;
  client_callable?: boolean;
  access_level?: string;
  caller_access?: string;
  mobile_callable?: boolean;
  sandbox_callable?: boolean;
  sys_policy?: string;
  // Service Portal Widget specific fields
  html?: string;
  css?: string;
  client_script?: string;
  server_script?: string;
  controller_as?: string;
  link?: string;
  demo_data?: any;
  option_schema?: any;
  // Common fields
  tags: string[];
  form_button?: boolean;
  form_action?: boolean;
  form_context_menu?: boolean;
  form_link?: boolean;
  form_menu_button?: boolean;
  list_button?: boolean;
  list_action?: boolean;
  list_choice?: boolean;
  list_context_menu?: boolean;
  list_banner_button?: boolean;
  show_insert?: boolean;
  show_update?: boolean;
  show_query?: boolean;
  show_multiple_update?: boolean;
  client_script_v2?: boolean;
  onclick?: string;
  hint?: string;
  comments?: string;
}

export interface ArtifactType {
  label: string;
  value: string;
  table: string;
  icon: string;
}

export const ARTIFACT_TYPES: ArtifactType[] = [
  {
    label: 'Business Rule',
    value: 'business_rule',
    table: 'business_rules',
    icon: 'code'
  },
  {
    label: 'Client Script',
    value: 'client_script',
    table: 'client_scripts',
    icon: 'code'
  },
  {
    label: 'Script Include',
    value: 'script_include',
    table: 'script_includes',
    icon: 'code'
  },
  {
    label: 'UI Action',
    value: 'ui_action',
    table: 'ui_actions',
    icon: 'code'
  },
  {
    label: 'Scheduled Job',
    value: 'scheduled_job',
    table: 'scheduled_jobs',
    icon: 'code'
  },
  {
    label: 'Transform Map',
    value: 'transform_map',
    table: 'transform_maps',
    icon: 'code'
  },
  {
    label: 'Background Script',
    value: 'background_script',
    table: 'background_scripts',
    icon: 'code'
  },
  {
    label: 'Mail Script',
    value: 'mail_script',
    table: 'mail_scripts',
    icon: 'code'
  },
  {
    label: 'Inbound Action',
    value: 'inbound_action',
    table: 'inbound_actions',
    icon: 'code'
  },
  {
    label: 'Service Portal Widget',
    value: 'service_portal_widget',
    table: 'service_portal_widgets',
    icon: 'code'
  },
  {
    label: 'Integrations',
    value: 'integrations',
    table: 'integrations',
    icon: 'plug'
  }
];

export interface Integration {
  id: string;
  title: string;
  description?: string;
  code: string;
  code2?: string;
  type: string; // e.g., 'Attachments', 'AzureAD Integration', etc.
  repo_path?: string;
  author_id?: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export const INTEGRATION_SUBTYPES = [
  'Attachments',
  'AzureAD Integration',
  'Import Set API',
  'Import Sets',
  'MIDServer',
  'RESTMessageV2',
  'Scripted REST Api'
] as const;

export type IntegrationSubtype = typeof INTEGRATION_SUBTYPES[number];
