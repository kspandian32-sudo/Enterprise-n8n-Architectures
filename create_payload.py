import json
import urllib.request
import os

file_path = r'C:\Users\ks_pa\.gemini\antigravity\brain\cd8eea7d-5dc7-4082-8071-753dc5e567a2\.system_generated\steps\107\output.txt'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

workflow = data['data']

# modify nodes
for node in workflow['nodes']:
    if node['name'] == '🔧 Data Normalizer':
        node['parameters']['jsCode'] = node['parameters']['jsCode'].replace(
            'const charAi = JSON.parse($node["🤖 AI: Character Sheet"].json.message.content);',
            'const charAi = JSON.parse($node["🤖 AI: Character Sheet"].json.message.content.replace(/```json/gi, \'\').replace(/```/g, \'\').trim());'
        )
    elif node['name'] == '🔧 Expand Calendar':
        node['parameters']['jsCode'] = node['parameters']['jsCode'].replace(
            'const calAi = JSON.parse($node["🤖 AI: 30-Day Calendar"].json.message.content);',
            'const content = $node["🤖 AI: 30-Day Calendar"].json.message.content.replace(/```json/gi, \'\').replace(/```/g, \'\').trim();\nconst calAi = JSON.parse(content + (content.endsWith("]") ? "" : "]"));'
        )
    elif node['name'] == '🤖 AI: 30-Day Calendar':
        node['parameters']['options']['maxTokens'] = 16384
        node['parameters']['prompt']['messages'][0]['content'] = 'You are an Instagram content strategist. Create detailed content calendars with ready-to-use Ideogram AI image prompts. Return ONLY a raw JSON array. DO NOT use markdown blocks like ```json, just return the raw array starting with [.'
    elif node['name'] == '🤖 AI: Character Sheet':
        node['parameters']['prompt']['messages'][0]['content'] = 'You are an expert AI influencer strategist. Create detailed virtual influencer character sheets. Return ONLY raw valid JSON. DO NOT use markdown blocks like ```json, just return the raw object starting with {.'

with open('payload.json', 'w', encoding='utf-8') as f:
    json.dump({
        "name": workflow['name'],
        "nodes": workflow['nodes'],
        "connections": workflow['connections'],
        "settings": workflow['settings']
    }, f)

print("Created payload.json")
