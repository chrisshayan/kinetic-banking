# Kinetic Ontology

Neo4j knowledge graph for Banking OS domain concepts.

## Structure

- **Actions**: Next-Best-Actions, Coach nudges, domain actions
- **Entities**: Customer, Account, Product, Transaction
- **Concepts**: Life-stage, Intent, Behavioral signal

## Cypher examples

```cypher
// Create action node
CREATE (a:Action {id: 'complete_onboarding', domain: 'ACTIVATION'})

// Create entity
CREATE (c:Customer {id: 'cust-1', lifeStage: 'NEW_TO_BANK'})

// Relate
MATCH (c:Customer), (a:Action)
WHERE c.lifeStage = 'NEW_TO_BANK' AND a.domain = 'ACTIVATION'
CREATE (c)-[:TRIGGERS]->(a)
```

## Files

- `schema.cypher` — Node and relationship definitions (to be added)
- `seed.cypher` — Demo ontology data (to be added)
