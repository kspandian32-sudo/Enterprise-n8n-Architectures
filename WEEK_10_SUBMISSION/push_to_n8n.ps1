$apiKey = "n8n_api_b58350fb7d8e4b75aedc8fc4d5e36d69ee58a68bb4c24c76b7ca3e5b9d8QxMjYwfQ.XizMVE5nblsFfiAawlYZqxzSNQyaBKuE5mRvIdiSFH4"
$workflowId = "kHUqP4bRNKBNkM04"
$jsonPath = "C:\AI-SEO\mission-control\WEEK_10_SUBMISSION\Updated_AI_Onboarding_SMTP.json"

$wf = Get-Content -Raw -Path $jsonPath | ConvertFrom-Json

$payload = @{
    name = $wf.name
    nodes = $wf.nodes
    connections = $wf.connections
    settings = $wf.settings
} | ConvertTo-Json -Depth 100 -Compress

$headers = @{
    "X-N8N-API-KEY" = $apiKey
    "Content-Type" = "application/json"
}

try {
    $resp = Invoke-RestMethod -Uri "http://localhost:5678/api/v1/workflows/$workflowId" -Method Put -Headers $headers -Body $payload
    Write-Output "SUCCESS: Workflow updated."
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Output "Details: $($_.ErrorDetails.Message)"
    }
}
