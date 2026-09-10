# Fraud Threshold Policy

This file summarizes candidate decision thresholds for fraud-risk review.

## Cost assumptions

- False-positive cost: `1.0`
- False-negative cost: `10.0`
- Interpretation: A false negative is configured as more expensive because missing fraud is usually more costly than reviewing a legitimate transaction.

## Policy candidates

| Policy | Threshold | Precision | Recall | FPR | Flagged rate | Cost | Rationale |
|---|---:|---:|---:|---:|---:|---:|---|
| cost_optimized | 0.350 | 0.442 | 0.914 | 0.135 | 0.217 | 211.000 | Minimizes expected business cost under the configured false-positive and false-negative costs. |
| balanced_f1 | 0.600 | 0.690 | 0.743 | 0.039 | 0.113 | 305.000 | Maximizes F1 to balance precision and recall. |
| high_recall | 0.150 | 0.260 | 0.962 | 0.321 | 0.388 | 327.000 | Maintains recall of at least 95% while minimizing cost. |
| high_precision | 0.650 | 0.706 | 0.686 | 0.034 | 0.102 | 360.000 | Maintains precision of at least 70% while preserving as much recall as possible. |
| review_capacity | 0.700 | 0.724 | 0.600 | 0.027 | 0.087 | 444.000 | Keeps the flagged/review rate at or below 10%. |

## Notes

- These policies are decision-support artifacts, not automatic approval rules.
- Thresholds should be reviewed with business, compliance, and operations stakeholders before deployment.
- The demo dataset is synthetic; threshold values should not be reused for real banking data without validation.
