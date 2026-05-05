$ErrorActionPreference = "Stop"
$jsonPath = Join-Path $PSScriptRoot "🏥 AI Client Onboarding.json"
$raw = Get-Content -Raw -LiteralPath $jsonPath
$wf = $raw | ConvertFrom-Json

$body = @{
    name = $wf.name
    nodes = $wf.nodes
    connections = $wf.connections
    settings = $wf.settings
} | ConvertTo-Json -Depth 50 -Compress

$apiKey = [System.Environment]::GetEnvironmentVariable("N8N_API_KEY")
if (-not $apiKey) {
    $apiKey = "n8n_api_b58350fb7d8e4b75aedc8fc4d5e36d69ee58a68bb4c24c76b7ca3e5b9d8QxMjYwfQ.XizMVE5nblsFfiAawlYZqxzSNQyaBKuE5mRvIdiSFH4"
}

$headers = @{
    "Content-Type" = "application/json"
    "X-N8N-API-KEY" = $apiKey
}

try {
    $resp = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows" -Method Post -Headers $headers -Body $body
    Write-Output "SUCCESS: Workflow created with ID=$($resp.id)"
    Write-Output "Name: $($resp.name)"
    Write-Output "Nodes: $($resp.nodes.Count)"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Output "Details: $($_.ErrorDetails.Message)"
    }
}
