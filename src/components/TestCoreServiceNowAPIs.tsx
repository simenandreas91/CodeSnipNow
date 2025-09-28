import { IntegrationCard } from './IntegrationCard';
import type { Integration } from '../types/snippet';

// Sample core_servicenow_apis data to demonstrate the enhanced rendering
const sampleCoreServiceNowAPIs: Integration[] = [
  {
    id: '1',
    title: 'Table API - Get Records',
    description: 'Retrieve records from any ServiceNow table using the Table API with filtering and pagination support.',
    code: `// Get records from incident table
var gr = new GlideRecord('incident');
gr.addQuery('state', '1');
gr.orderByDesc('sys_created_on');
gr.setLimit(10);
gr.query();

var results = [];
while (gr.next()) {
    results.push({
        sys_id: gr.getUniqueValue(),
        number: gr.getValue('number'),
        short_description: gr.getValue('short_description'),
        state: gr.getDisplayValue('state')
    });
}

return results;`,
    code2: `// REST API equivalent
var request = new sn_ws.RESTMessageV2();
request.setEndpoint('https://instance.service-now.com/api/now/table/incident');
request.setHttpMethod('GET');
request.setQueryParameter('sysparm_query', 'state=1');
request.setQueryParameter('sysparm_limit', '10');
request.setQueryParameter('sysparm_order_by', 'sys_created_on');

var response = request.execute();
return JSON.parse(response.getBody());`,
    type: 'core_servicenow_apis',
    repo_path: '/api/table',
    author_id: 'user123',
    is_public: true,
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: 'Attachment API - Upload File',
    description: 'Upload attachments to ServiceNow records using the Attachment API.',
    code: `// Upload attachment to a record
var attachment = new GlideSysAttachment();
var attachmentId = attachment.write(
    gr,                    // GlideRecord object
    fileName,              // File name
    contentType,           // MIME type
    base64Content          // Base64 encoded content
);

gs.info('Attachment created with ID: ' + attachmentId);
return attachmentId;`,
    type: 'Core ServiceNow APIs',
    repo_path: '/api/attachment',
    author_id: null,
    is_public: true,
    created_at: '2025-01-14T15:45:00Z',
    updated_at: '2025-01-14T15:45:00Z'
  },
  {
    id: '3',
    title: 'User Management API',
    description: 'Manage users and groups through ServiceNow APIs with role assignments.',
    code: `// Create new user
var userGR = new GlideRecord('sys_user');
userGR.initialize();
userGR.setValue('user_name', username);
userGR.setValue('first_name', firstName);
userGR.setValue('last_name', lastName);
userGR.setValue('email', email);
userGR.setValue('active', true);

var userSysId = userGR.insert();

// Assign role to user
var roleGR = new GlideRecord('sys_user_has_role');
roleGR.initialize();
roleGR.setValue('user', userSysId);
roleGR.setValue('role', roleId);
roleGR.insert();

return userSysId;`,
    type: '',
    repo_path: '/api/user',
    author_id: 'admin456',
    is_public: false,
    created_at: '2025-01-13T09:20:00Z',
    updated_at: '2025-01-13T09:20:00Z'
  }
];

export function TestCoreServiceNowAPIs() {
  return (
    <div className="p-8 bg-slate-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Core ServiceNow APIs - Enhanced Rendering Test
        </h1>
        
        <div className="mb-6 text-slate-300">
          <p>This demonstrates how Core ServiceNow APIs are rendered using the same technique as business rules:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Distinctive orange-to-red gradient for Core ServiceNow APIs</li>
            <li>Special "ServiceNow Core API" badge for identification</li>
            <li>Support for both primary and secondary code sections</li>
            <li>Repository path display</li>
            <li>Public/private status indicators</li>
            <li>Consistent styling with business rules and other artifacts</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleCoreServiceNowAPIs.map((api) => (
            <IntegrationCard
              key={api.id}
              integration={api}
              onClick={() => {
                console.log('Clicked Core ServiceNow API:', api.title);
                alert(`Clicked: ${api.title}\n\nThis would open a detailed view of the API.`);
              }}
            />
          ))}
        </div>

        <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-2">Implementation Notes:</h3>
          <div className="text-sm text-slate-300 space-y-2">
            <p>• <strong>Type Detection:</strong> Cards automatically detect Core ServiceNow APIs by checking the type field</p>
            <p>• <strong>Color Coding:</strong> Uses orange-to-red gradient to distinguish from other integration types</p>
            <p>• <strong>Metadata Display:</strong> Shows ServiceNow-specific information like API paths and access levels</p>
            <p>• <strong>Code Preview:</strong> Supports both primary code and additional code sections</p>
            <p>• <strong>Consistent UX:</strong> Follows the same interaction patterns as business rules and snippets</p>
          </div>
        </div>
      </div>
    </div>
  );
}
