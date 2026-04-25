const slideId = $input.first().json.id;
const d = $('🔀 Merge AI + Form Data').first().json;

const mapping = {
  "client_name": d.clientName,
  "company_name": d.companyName,
  "proposal_id": d.proposalId,
  "date_created": d.dateCreated,
  "executive_summary": d.executive_summary || "",
  "why_choose_us": d.why_choose_us || "",
  "our_approach": d.our_approach || "",
  "scope_of_work": d.scope_of_work || "",
  "deliverables_timeline": d.deliverables_timeline || "",
  "budget": d.budgetFormatted,
  "total_investment": d.totalFormatted,
  "timeline": d.timeline,
  "expected_outcomes": d.expected_outcomes || "",
  "investment_justification": d.investment_justification || "",
  "competitive_positioning": d.competitive_positioning || ""
};

const requests = [];
const keys = Object.keys(mapping);
for (let i = 0; i < keys.length; i++) {
  const k = keys[i];
  requests.push({
    "replaceAllText": {
      "containsText": { "text": "{{" + k + "}}", "matchCase": true },
      "replaceText": String(mapping[k])
    }
  });
}

d.slideId = slideId;
d.payload = { "requests": requests };
return [{ "json": d }];
