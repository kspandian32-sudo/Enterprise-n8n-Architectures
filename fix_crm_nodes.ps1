# Fix CRM Update nodes by calling n8n REST API directly
# This bypasses the MCP tool's parameter stripping

$workflowId = "cZccbNLce7BFtb7x"
$baseUrl = "http://localhost:5678"

# Get API key from MCP config
$claudeConfig = Get-Content "$env:APPDATA\Claude\claude_desktop_config.json" -Raw -ErrorAction SilentlyContinue
if ($claudeConfig) {
    $parsed = $claudeConfig | ConvertFrom-Json
    # Try to find the API key from env vars in MCP config
    $mcpServers = $parsed.mcpServers
    if ($mcpServers.'n8n-mcp'.env.N8N_API_KEY) {
        $apiKey = $mcpServers.'n8n-mcp'.env.N8N_API_KEY
    } elseif ($mcpServers.'n8n'.env.N8N_API_KEY) {
        $apiKey = $mcpServers.'n8n'.env.N8N_API_KEY
    }
}

# Fallback: try gemini config 
if (-not $apiKey) {
    $geminiMcp = Get-Content "$env:USERPROFILE\.gemini\settings\mcp_config.json" -Raw -ErrorAction SilentlyContinue
    if ($geminiMcp) {
        $parsed2 = $geminiMcp | ConvertFrom-Json
        if ($parsed2.mcpServers.'n8n-mcp'.env.N8N_API_KEY) {
            $apiKey = $parsed2.mcpServers.'n8n-mcp'.env.N8N_API_KEY
        }
    }
}

if (-not $apiKey) {
    Write-Host "ERROR: Could not find N8N_API_KEY in any config file"
    Write-Host "Checking common config locations..."
    Get-ChildItem "$env:USERPROFILE\.gemini" -Recurse -Filter "*.json" | ForEach-Object { Write-Host $_.FullName }
    exit 1
}

Write-Host "API Key found: $($apiKey.Substring(0,8))..."

# Step 1: Get current workflow
$headers = @{
    "X-N8N-API-KEY" = $apiKey
    "Content-Type" = "application/json"
}

$workflow = Invoke-RestMethod -Uri "$baseUrl/api/v1/workflows/$workflowId" -Headers $headers -Method Get
Write-Host "Got workflow: $($workflow.name) with $($workflow.nodes.Count) nodes"

# Step 2: Find and fix the Update CRM nodes
$fixed = 0
for ($i = 0; $i -lt $workflow.nodes.Count; $i++) {
    $node = $workflow.nodes[$i]
    
    if ($node.name -eq "Update CRM: Reply Status") {
        Write-Host "Fixing node: $($node.name) (index $i, current typeVersion: $($node.typeVersion))"
        
        # Set to typeVersion 4.5 with the correct update parameters
        $workflow.nodes[$i].typeVersion = 4.5
        $workflow.nodes[$i].parameters = @{
            operation = "update"
            documentId = @{ mode = "id"; value = "1KEGnIhb68tK1tLGL3rZ-MA7kso1KFdAFa8fmQ13nhKo" }
            sheetName = @{ mode = "id"; value = "1475293523" }
            columnToMatchOn = "Email"
            valueToMatchOn = "={{ `$json.Email }}"
            fieldsUi = @{
                values = @(
                    @{ column = "Status"; value = "Replied" },
                    @{ column = "Reply Intent"; value = "={{ `$json.Intent || `$json.intent || '' }}" },
                    @{ column = "Reply Intent Check At"; value = "={{ new Date().toISOString() }}" }
                )
            }
            options = @{}
        }
        $fixed++
    }
    
    if ($node.name -eq "Update CRM: Bounced") {
        Write-Host "Fixing node: $($node.name) (index $i, current typeVersion: $($node.typeVersion))"
        
        $workflow.nodes[$i].typeVersion = 4.5
        $workflow.nodes[$i].parameters = @{
            operation = "update"
            documentId = @{ mode = "id"; value = "1KEGnIhb68tK1tLGL3rZ-MA7kso1KFdAFa8fmQ13nhKo" }
            sheetName = @{ mode = "id"; value = "1475293523" }
            columnToMatchOn = "Email"
            valueToMatchOn = "={{ `$json.Email }}"
            fieldsUi = @{
                values = @(
                    @{ column = "Status"; value = "Bounced" },
                    @{ column = "Last Updated"; value = "={{ new Date().toISOString() }}" }
                )
            }
            options = @{}
        }
        $fixed++
    }
}

Write-Host "Fixed $fixed nodes"

if ($fixed -eq 0) {
    Write-Host "ERROR: Could not find the CRM update nodes!"
    exit 1
}

# Step 3: Push the updated workflow back via PUT
$body = @{
    name = $workflow.name
    nodes = $workflow.nodes
    connections = $workflow.connections
    settings = $workflow.settings
} | ConvertTo-Json -Depth 20

Write-Host "Sending update to n8n API..."
Write-Host "Body length: $($body.Length) chars"

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/v1/workflows/$workflowId" -Headers $headers -Method Put -Body $body
    Write-Host "SUCCESS! Workflow updated: $($result.name)"
    Write-Host "Node count: $($result.nodes.Count)"
    
    # Verify the fixed nodes
    foreach ($n in $result.nodes) {
        if ($n.name -match "Update CRM") {
            Write-Host "  Node: $($n.name)"
            Write-Host "    typeVersion: $($n.typeVersion)"
            Write-Host "    operation: $($n.parameters.operation)"
            Write-Host "    columnToMatchOn: $($n.parameters.columnToMatchOn)"
            Write-Host "    valueToMatchOn: $($n.parameters.valueToMatchOn)"
            Write-Host "    has fieldsUi: $($null -ne $n.parameters.fieldsUi)"
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Host "Response: $($_.ErrorDetails.Message)"
}
