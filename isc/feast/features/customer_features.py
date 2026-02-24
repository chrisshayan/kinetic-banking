"""
Feast feature definitions for Kinetic ISC
- customer_health: balance, savings, activity (for Coach health score)
- Used by MLflow health model + Coach agent

Schema (aligned with dbt fct_customer_health):
  current_balance, savings_balance, credit_utilization,
  has_current_account, has_savings, txn_count_30d, life_stage

Full Feast: pip install 'feast[postgres]', feast apply
For demo: use get_customer_health_features() below (reads from PostgreSQL)
"""

CUSTOMER_HEALTH_SCHEMA = [
    "current_balance",
    "savings_balance",
    "credit_utilization",
    "has_current_account",
    "has_savings",
    "txn_count_30d",
    "life_stage",
]


def get_customer_health_features(customer_id: str, conn=None) -> dict | None:
    """
    Fetch customer health features from fct_customer_health (dbt) or raw join.
    Used by Coach agent and MLflow health model.
    Requires: pip install psycopg2-binary
    """
    import os

    def _query(cursor, sql, params):
        cursor.execute(sql, params)
        return cursor.fetchone()

    def _run(connection):
        try:
            row = _query(
                connection.cursor(),
                """
                SELECT current_balance, savings_balance, credit_utilization,
                       has_current_account, has_savings, txn_count_30d, life_stage
                FROM fct_customer_health WHERE customer_id = %s
                """,
                (customer_id,),
            )
        except Exception:
            row = _query(
                connection.cursor(),
                """
                WITH cb AS (
                  SELECT c.id,
                    coalesce(sum(a.balance) FILTER (WHERE a.product_type = 'CURRENT'), 0) AS current_balance,
                    coalesce(sum(a.balance) FILTER (WHERE a.product_type IN ('TERM_DEPOSIT','SAVINGS')), 0) AS savings_balance,
                    coalesce(sum(abs(a.balance)) FILTER (WHERE a.product_type = 'CREDIT_CARD'), 0) AS credit_utilization,
                    count(*) FILTER (WHERE a.product_type = 'CURRENT')::int AS has_current_account,
                    count(*) FILTER (WHERE a.product_type IN ('TERM_DEPOSIT','SAVINGS'))::int AS has_savings
                  FROM customers c
                  LEFT JOIN accounts a ON a.customer_id = c.id AND a.status = 'ACTIVE'
                  WHERE c.id = %s GROUP BY c.id
                ),
                ta AS (
                  SELECT a.customer_id, count(t.id)::int AS txn_count_30d
                  FROM accounts a JOIN transactions t ON t.account_id = a.id
                  WHERE a.customer_id = %s AND t.created_at >= current_date - interval '30 days'
                  GROUP BY a.customer_id
                )
                SELECT cb.current_balance, cb.savings_balance, cb.credit_utilization,
                       cb.has_current_account, cb.has_savings, coalesce(ta.txn_count_30d, 0) AS txn_count_30d,
                       c.life_stage
                FROM customers c LEFT JOIN cb ON cb.id = c.id LEFT JOIN ta ON ta.customer_id = c.id
                WHERE c.id = %s
                """,
                (customer_id, customer_id, customer_id),
            )
        return row

    if conn:
        row = _run(conn)
    else:
        import psycopg2
        url = os.environ.get("DATABASE_URL", "postgresql://kinetic:kinetic@localhost:5432/kinetic")
        with psycopg2.connect(url) as c:
            row = _run(c)

    if not row:
        return None
    return {
        "current_balance": float(row[0] or 0),
        "savings_balance": float(row[1] or 0),
        "credit_utilization": float(row[2] or 0),
        "has_current_account": int(row[3] or 0),
        "has_savings": int(row[4] or 0),
        "txn_count_30d": int(row[5] or 0),
        "life_stage": str(row[6] or ""),
    }
