// Base interface for all ServiceNow artifacts
export interface BaseArtifact {
  id: string;
  title: string;
  description: string;
  code: string;
  tags: string[];
  is_public: boolean;
  author_id: string;
  created_at: string;
  updated_at: string;
}

// Business Rule specific fields
export interface BusinessRule extends BaseArtifact {
  collection?: string;
  when_to_run?: 'before' | 'after' | 'async' | 'display';
  condition?: string;
  order_value?: number;
  priority?: number;
  active?: boolean;
  advanced?: boolean;
  // Action fields
  action_delete?: boolean;
  action_insert?: boolean;
  action_query?: boolean;
  action_update?: boolean;
  // Behavior fields
  abort_action?: boolean;
  add_message?: boolean;
  change_fields?: boolean;
  execute_function?: boolean;
  // Access and security
  access?: 'public' | 'package_private';
  client_callable?: boolean;
  is_rest?: boolean;
  // REST API fields
  rest_method?: string;
  rest_service?: string;
  rest_variables?: string;
  // Conditions and filters
  filter_condition?: string;
  role_conditions?: string;
  // Message and template
  message?: string;
  template?: string;
}

// Client Script specific fields
export interface ClientScript extends BaseArtifact {
  applies_to?: string;
  ui_type?: 'desktop' | 'mobile' | 'both';
  sys_scope?: string;
  type?: string;
  cat_item?: string;
  active?: boolean;
}

// Catalog Client Script specific fields (legacy interface name)
export interface CatalogClientScriptLegacy extends BaseArtifact {
  table_name?: string;
  ui_type?: 'desktop' | 'mobile' | 'both';
  script_type: 'onLoad' | 'onChange' | 'onSubmit' | 'onCellEdit';
  field_name?: string;
  condition?: string;
  active?: boolean;
  global?: boolean;
  isolate_script?: boolean;
  applies_extended?: boolean;
  messages?: string;
  order_value?: number;
  view?: string;
  ui_type_code?: number;
}

// Script Include specific fields
export interface ScriptInclude extends BaseArtifact {
  api_name?: string;
  client_callable?: boolean;
  access_level?: string;
  caller_access?: string;
  mobile_callable?: boolean;
  sandbox_callable?: boolean;
  sys_policy?: string;
}

// UI Action specific fields
export interface UIAction extends BaseArtifact {
  table_name?: string;
  action_name: string;
  client?: boolean;
  client_script_v2?: string;
  comments?: string;
  condition?: string;
  form_button?: boolean;
  form_action?: boolean;
  form_button_v2?: boolean;
  form_context_menu?: boolean;
  form_link?: boolean;
  form_menu_button?: boolean;
  form_menu_button_v2?: boolean;
  form_style?: string;
  hint?: string;
  isolate_script?: boolean;
  list_action?: boolean;
  list_banner_button?: boolean;
  list_button?: boolean;
  list_choice?: boolean;
  list_context_menu?: boolean;
  list_link?: boolean;
  list_save_with_form_button?: boolean;
  list_style?: string;
  messages?: string;
  onclick?: string;
  order_value?: number;
  show_insert?: boolean;
  show_multiple_update?: boolean;
  show_query?: boolean;
  show_update?: boolean;
  ui11_compatible?: boolean;
  ui16_compatible?: boolean;
  active?: boolean;
}

// Scheduled Job specific fields
export interface ScheduledJob extends BaseArtifact {
  job_name: string;
  run_as?: string;
  run_start?: string;
  run_period?: string;
  run_dayofweek?: string;
  run_dayofmonth?: string;
  run_time?: string;
  active?: boolean;
}

// Transform Map specific fields
export interface TransformMap extends BaseArtifact {
  source_table: string;
  target_table: string;
  run_business_rules?: boolean;
  coalesce?: boolean;
  active?: boolean;
}

// Background Script specific fields
export interface BackgroundScript extends BaseArtifact {
  // Background scripts are simple - just title, description, and code
  // No additional fields needed beyond the base artifact
}

// Service Portal Widget specific fields
export interface ServicePortalWidget extends BaseArtifact {
  name?: string;
  html?: string;
  css?: string;
  server_script?: string;
  client_script?: string;
  controller_as?: string;
  link?: string;
  demo_data?: any; // JSONB field
  option_schema?: any; // JSONB field
  active?: boolean;
}

// Union type for all artifacts
export type ServiceNowArtifact = BusinessRule | ClientScript | ScriptInclude | UIAction | ScheduledJob | TransformMap | BackgroundScript | CatalogClientScriptLegacy | ServicePortalWidget;

// Legacy Snippet interface for backward compatibility
export interface Snippet {
  id: string;
  name: string;
  description: string;
  script: string;
  artifact_type: string;
  collection?: string;
  condition?: string;
  when?: string;
  order?: number;
  priority?: number;
  active: boolean;
  advanced?: boolean;
  field_name?: string;
  global?: boolean;
  isolate_script?: boolean;
  applies_extended?: boolean;
  messages?: string;
  order_value?: number;
  view?: string;
  ui_type_code?: number;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  sys_id?: string;
  user_id?: string;
  repo_path?: string;
  // Script Include specific fields
  api_name?: string;
  access_level?: string;
  caller_access?: string;
  client_callable?: boolean;
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
}

export interface User {
  id: string;
  username?: string;
  email?: string;
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
  active: boolean;
  advanced?: boolean;
  tags: string[];
  // Business Rule specific fields
  action_delete?: boolean;
  action_insert?: boolean;
  action_query?: boolean;
  action_update?: boolean;
  abort_action?: boolean;
  add_message?: boolean;
  change_fields?: boolean;
  execute_function?: boolean;
  access?: string;
  client_callable?: boolean;
  is_rest?: boolean;
  filter_condition?: string;
  message?: string;
  // UI Action specific fields
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
  client_script_v2?: string;
  onclick?: string;
  hint?: string;
  comments?: string;
  // Client Script specific fields
  field_name?: string;
  global?: boolean;
  isolate_script?: boolean;
  applies_extended?: boolean;
  messages?: string;
  order_value?: number;
  view?: string;
  ui_type_code?: number;
}

// Artifact type definitions
export type ArtifactType = 'business_rule' | 'client_script' | 'script_include' | 'ui_action' | 'scheduled_job' | 'transform_map' | 'background_script' | 'catalog_client_script' | 'service_portal_widget';

export const ARTIFACT_TYPES: { value: ArtifactType; label: string; table: string }[] = [
  { value: 'business_rule', label: 'Business Rules', table: 'business_rules' },
  { value: 'client_script', label: 'Client Scripts', table: 'client_scripts' },
  { value: 'script_include', label: 'Script Includes', table: 'script_includes' },
  { value: 'ui_action', label: 'UI Actions', table: 'ui_actions' },
  { value: 'scheduled_job', label: 'Scheduled Jobs', table: 'scheduled_jobs' },
  { value: 'transform_map', label: 'Transform Maps', table: 'transform_maps' },
  { value: 'background_script', label: 'Background Scripts', table: 'background_scripts' },
  { value: 'catalog_client_script', label: 'Catalog Client Scripts', table: 'catalog_client_scripts' },
  { value: 'service_portal_widget', label: 'Service Portal Widgets', table: 'service_portal_widgets' },
];
