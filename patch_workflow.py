import json

with open('C:/Users/ks_pa/.gemini/antigravity/brain/ae15da1e-0b42-4e93-9f0d-0a8c325e5d5e/.system_generated/steps/1378/output.txt', 'r', encoding='utf-8') as f:
    data = json.load(f)

nodes = data['data']['nodes']
connections = data['data']['connections']

# Helper to find node by name
def find_node(name):
    for n in nodes:
        if n['name'] == name: return n
    return None

# Fix Telegram Sent (n16)
n16 = find_node('📱 Format Telegram — Sent')
n16['parameters']['jsCode'] = """const d = $('🔀 Merge AI + Form Data').first().json;
const eventType = 'Proposal Sent';
const msg = `📤 *${eventType}*

👤 *Client:* ${d.clientName || d.client_name || 'Valued Client'}
🏢 *Company:* ${d.companyName || d.company_name || 'Your Company'}
📧 *Email:* ${d.clientEmail || d.client_email || 'N/A'}
🎯 *Service:* ${d.serviceType || d.service_type || 'Consulting'}
🏭 *Industry:* ${d.industry || 'N/A'}
💰 *Value:* ${d.totalFormatted || 'N/A'}
📅 *Timeline:* ${d.timeline || 'N/A'}
🔖 *Proposal ID:* ${d.proposalId || d.proposal_id || 'N/A'}

⏰ ${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}`;
return [{ json: { text: msg } }];"""

# Fix Telegram FU1 (n24)
n24 = find_node('📱 Format Telegram — FU1')
if n24:
    n24['parameters']['jsCode'] = n24['parameters']['jsCode'].replace('const d = $input.first().json;', "const d = $('🔀 Merge AI + Form Data').first().json;")

# Fix Telegram FU2 (n32)
n32 = find_node('📱 Format Telegram — FU2')
if n32:
    n32['parameters']['jsCode'] = n32['parameters']['jsCode'].replace('const d = $input.first().json;', "const d = $('🔀 Merge AI + Form Data').first().json;")

# Fix Telegram Closed (n40)
n40 = find_node('📱 Format Telegram — Closed')
if n40:
    n40['parameters']['jsCode'] = n40['parameters']['jsCode'].replace('const d = $input.first().json;', "const d = $('🔀 Merge AI + Form Data').first().json;")

# Fix Gmail Body (n15)
n15 = find_node('📧 Send Proposal Email')
new_msg = "='<div style=\"font-family:\\'Segoe UI\\',Arial,sans-serif;max-width:650px;margin:0 auto;background:#fff;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;\"><div style=\"background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:40px 30px;text-align:center;\"><h1 style=\"color:#fff;margin:0;font-size:24px;letter-spacing:0.5px;\">Your Custom Proposal is Ready</h1><p style=\"color:rgba(255,255,255,0.9);margin:10px 0 0;font-size:14px;\">Prepared exclusively for ' + $('🔀 Merge AI + Form Data').first().json.companyName + '</p></div><div style=\"padding:35px 30px;\"><p style=\"font-size:16px;color:#333;margin-bottom:5px;\">Dear ' + $('🔀 Merge AI + Form Data').first().json.clientName + ',</p><p style=\"font-size:15px;color:#555;line-height:1.8;\">Thank you for your interest in our <strong>' + $('🔀 Merge AI + Form Data').first().json.serviceType + '</strong> services. We\\'ve prepared a comprehensive, tailored proposal for <strong>' + $('🔀 Merge AI + Form Data').first().json.companyName + '</strong> based on your specific goals and requirements.</p><div style=\"background:#f8f9ff;border-radius:10px;padding:20px;margin:25px 0;\"><h3 style=\"color:#667eea;margin:0 0 15px;font-size:16px;\">📋 Proposal Highlights</h3><table style=\"width:100%;font-size:14px;color:#555;\"><tr><td style=\"padding:6px 0;width:140px;\"><strong>Proposal ID:</strong></td><td>' + $('🔀 Merge AI + Form Data').first().json.proposalId + '</td></tr><tr><td style=\"padding:6px 0;\"><strong>Service:</strong></td><td>' + $('🔀 Merge AI + Form Data').first().json.serviceType + '</td></tr><tr><td style=\"padding:6px 0;\"><strong>Timeline:</strong></td><td>' + $('🔀 Merge AI + Form Data').first().json.timeline + '</td></tr><tr><td style=\"padding:6px 0;\"><strong>Investment:</strong></td><td>' + $('🔀 Merge AI + Form Data').first().json.totalFormatted + ' (incl. 18% GST)</td></tr></table></div><p style=\"font-size:15px;color:#555;line-height:1.8;\">' + $('🤖 Generate Proposal Content').first().json.execSummaryShort + '</p><p style=\"font-size:15px;color:#555;line-height:1.8;\">Please find attached:</p><ul style=\"font-size:15px;color:#555;line-height:2.2;\"><li>📑 <strong>Detailed Proposal</strong> — scope, methodology, deliverables &amp; timeline</li><li>🧾 <strong>Invoice</strong> — pricing breakdown with GST and payment details</li></ul><div style=\"text-align:center;margin:30px 0;\"><a href=\"' + $('🔀 Merge AI + Form Data').first().json.acceptUrl + '\" style=\"display:inline-block;padding:14px 32px;background:#22c55e;color:#fff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;margin:0 8px;\">✅ Accept Proposal</a><a href=\"' + $('🔀 Merge AI + Form Data').first().json.declineUrl + '\" style=\"display:inline-block;padding:14px 32px;background:#ef4444;color:#fff;text-decoration:none;border-radius:8px;font-size:16px;font-weight:bold;margin:0 8px;\">❌ Decline</a></div><p style=\"font-size:13px;color:#999;text-align:center;margin-top:0;\">Click a button above to let us know your decision instantly, or simply reply to this email.</p><hr style=\"border:none;border-top:1px solid #eee;margin:25px 0;\"><p style=\"font-size:15px;color:#555;line-height:1.8;\">I\\'d love to schedule a quick 15-minute call to walk you through the proposal and answer any questions. Just reply to this email with a time that works for you.</p><p style=\"font-size:15px;color:#555;\">Warm regards,<br><strong>YOUR_NAME</strong><br>YOUR_AGENCY_NAME<br>📞 YOUR_PHONE</p></div><div style=\"background:#f8f9fa;padding:20px 30px;text-align:center;\"><p style=\"font-size:12px;color:#999;margin:0;\">This proposal was generated on ' + $('🔀 Merge AI + Form Data').first().json.dateCreated + ' and is valid for 15 days.</p></div></div>'"
n15['parameters']['message'] = new_msg

# Output the result
with open('C:/Users/ks_pa/AppData/Local/Temp/final_workflow.json', 'w', encoding='utf-8') as f:
    json.dump({'nodes': nodes, 'connections': connections}, f)
