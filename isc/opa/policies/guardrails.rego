# Open Policy Agent — Kinetic guardrails
# Policy enforcement for AI decisions

package guardrails

# Default: deny if no rule matches
default allow = false

# Allow when no deny conditions
allow = true {
    not deny_account_closed
    not deny_low_confidence
}

# Block decisions for closed accounts
deny_account_closed {
    input.account_status == "CLOSED"
}

# Require minimum confidence for NBA
deny_low_confidence {
    input.confidence != null
    input.confidence < 0.7
}
