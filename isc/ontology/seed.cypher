// Kinetic Ontology — Demo seed
// Run: cypher-shell -u neo4j -p kinetic123 -f seed.cypher
// Or: docker exec -i kinetic-banking-neo4j-1 cypher-shell -u neo4j -p kinetic123 < isc/ontology/seed.cypher

// Clear demo data (optional)
MATCH (n) DETACH DELETE n;

// Concepts: Life-stages (CHURN_RISK aligns with CLO routing)
CREATE (c1:Concept {id: 'NEW_TO_BANK', name: 'New to Bank', type: 'life_stage'})
CREATE (c2:Concept {id: 'ACTIVE', name: 'Active', type: 'life_stage'})
CREATE (c3:Concept {id: 'AT_RISK', name: 'At Risk', type: 'life_stage'})
CREATE (c4:Concept {id: 'CHURN_RISK', name: 'Churn Risk', type: 'life_stage'})
CREATE (c5:Concept {id: 'CHURNED', name: 'Churned', type: 'life_stage'});

// Concepts: Domains
CREATE (d1:Concept {id: 'ACQUISITION', name: 'Acquisition', type: 'domain'})
CREATE (d2:Concept {id: 'ACTIVATION', name: 'Activation', type: 'domain'})
CREATE (d3:Concept {id: 'EXPANSION', name: 'Expansion', type: 'domain'})
CREATE (d4:Concept {id: 'RETENTION', name: 'Retention', type: 'domain'})
CREATE (d5:Concept {id: 'COACH', name: 'Financial Coach', type: 'domain'});

// Actions: CLO domains (aligned with domain-rules)
CREATE (a1:Action {id: 'sign_up', domain: 'ACQUISITION', description: 'Customer sign up'})
CREATE (a2:Action {id: 'open_account', domain: 'ACQUISITION', description: 'Open first account'})
CREATE (a3:Action {id: 'open_current_account', domain: 'ACTIVATION', description: 'Open current account'})
CREATE (a4:Action {id: 'complete_onboarding', domain: 'ACTIVATION', description: 'Complete onboarding'})
CREATE (a5:Action {id: 'first_transaction', domain: 'ACTIVATION', description: 'Make first transaction'})
CREATE (a6:Action {id: 'add_savings', domain: 'EXPANSION', description: 'Open savings account'})
CREATE (a7:Action {id: 'open_term_deposit', domain: 'EXPANSION', description: 'Open term deposit'})
CREATE (a8:Action {id: 'open_credit_card', domain: 'EXPANSION', description: 'Open credit card'})
CREATE (a9:Action {id: 'add_card', domain: 'EXPANSION', description: 'Add debit/credit card'})
CREATE (a10:Action {id: 'set_up_budget', domain: 'EXPANSION', description: 'Use budgeting feature'})
CREATE (a11:Action {id: 'retention_offer', domain: 'RETENTION', description: 'Retention offer'})
CREATE (a12:Action {id: 'win_back', domain: 'RETENTION', description: 'Re-engagement campaign'});

// Actions: Coach domains
CREATE (ac1:Action {id: 'health_assessment', domain: 'COACH', description: 'Financial health assessment'})
CREATE (ac2:Action {id: 'anomaly_detection', domain: 'COACH', description: 'Spend anomaly alert'})
CREATE (ac3:Action {id: 'peer_benchmarking', domain: 'COACH', description: 'Peer comparison'})
CREATE (ac4:Action {id: 'early_warning', domain: 'COACH', description: 'Low balance warning'})
CREATE (ac5:Action {id: 'weekly_reflection', domain: 'COACH', description: 'Weekly summary'});

// Entity types
CREATE (e1:Entity {id: 'Customer', type: 'entity'})
CREATE (e2:Entity {id: 'Account', type: 'entity'})
CREATE (e3:Entity {id: 'Transaction', type: 'entity'})
CREATE (e4:Entity {id: 'Product', type: 'entity'});

// Relationships: Action IN_DOMAIN Concept
MATCH (a:Action), (d:Concept) WHERE a.domain = d.id AND d.type = 'domain'
CREATE (a)-[:IN_DOMAIN]->(d);

// Relationships: Life-stage TRIGGERS Action (graph-driven routing)
MATCH (c:Concept {id: 'NEW_TO_BANK'}), (a:Action) WHERE a.domain IN ['ACQUISITION', 'ACTIVATION']
CREATE (c)-[:TRIGGERS]->(a);
MATCH (c:Concept {id: 'ACTIVE'}), (a:Action) WHERE a.domain IN ['EXPANSION', 'RETENTION']
CREATE (c)-[:TRIGGERS]->(a);
MATCH (c:Concept {id: 'AT_RISK'}), (a:Action) WHERE a.domain = 'RETENTION'
CREATE (c)-[:TRIGGERS]->(a);
MATCH (c:Concept {id: 'CHURN_RISK'}), (a:Action) WHERE a.domain = 'RETENTION'
CREATE (c)-[:TRIGGERS]->(a);
