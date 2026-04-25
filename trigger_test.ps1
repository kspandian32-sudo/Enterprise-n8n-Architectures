
$body = @{
    "Your Agency Name" = "Antigravity AI Solutions"
    "Service You Are Selling" = "AI Outreach Automation"
    "Your Unique Value Proposition" = "We replace entire SDR teams with autonomous AI lead gen agents that personalize at scale."
    "Your Sender Email" = "assistant@antigravity.ai"
    "Your Full Name" = "Antigravity Assistant"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/a592cba2-e37a-41f6-a573-8e6b49020c16" -Method Post -Body $body -ContentType "application/json"
