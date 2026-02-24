// Kinetic Banking OS — Ontology schema
// Run after seed.cypher if you want constraints
// CREATE CONSTRAINT action_id IF NOT EXISTS FOR (a:Action) REQUIRE a.id IS UNIQUE;
// CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE;

// Node labels: Action, Entity, Concept
// Relationships: (Action)-[:IN_DOMAIN]->(Concept), (Concept)-[:TRIGGERS]->(Action)
