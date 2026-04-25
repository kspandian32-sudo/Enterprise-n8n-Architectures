$data = Get-Content -Path "C:\AI-SEO\mission-control\New folder\The Content Alchemist.blueprint (2).json" -Raw | ConvertFrom-Json
foreach ($wf in $data.templates) {
    Write-Output "WORKFLOW: $($wf.name)"
    foreach ($node in $wf.nodes) {
        Write-Output "  - Node: $($node.name) (Type: $($node.type))"
    }
}
