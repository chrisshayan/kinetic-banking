# Open Policy Agent — Kinetic guardrails
# Policy enforcement for AI decisions

package guardrails

# Default: allow (replace with real rules)
default allow = true

# Example: block decisions for closed accounts
deny_account_closed {
    input.account_status == "CLOSED"
}

# Example: require minimum confidence for NBA
deny_low_confidence {
    input.confidence < 0.7
}

allow = true {
    not deny_account_closed
    not deny_low_confidence
}
