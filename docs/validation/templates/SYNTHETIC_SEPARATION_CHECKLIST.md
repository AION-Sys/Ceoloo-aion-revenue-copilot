# Synthetic / Demo Separation Checklist

Complete **before** any CRM confirm or production write during Gate A.  
Fail this checklist → session cannot claim CRM success for Gate A.

| Field | Value |
|-------|-------|
| Session id | `GA-YYYYMMDD-##` |
| Operator | |
| Date | |

## Environment

- [ ] Rep is signed into the **pilot/production** org (not demo-only path for CRM claims)
- [ ] Demo credentials (`rep@demo.local`) were **not** used for this CRM confirm
- [ ] Lead/prospect is a real or explicitly pilot-labeled account (document which)
- [ ] `ENABLE_DEMO_AUTH` / demo fixtures are not driving the confirmed write

## Evidence states

- [ ] CRM proposal started as `draft`
- [ ] Approval was intentional (rep/operator chose to approve)
- [ ] Confirm step only after **external confirmation id** exists
- [ ] Follow-up / message not labeled “sent” without provider confirmation id
- [ ] Learning / intervention retain did not invent revenue attribution

## Attestation

I attest that no synthetic/demo activity mutated a real client CRM record in this session.

| | |
|--|--|
| Operator signature | |
| Date | |
| Result | pass / fail |
