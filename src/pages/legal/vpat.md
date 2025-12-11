---
layout: "../../layouts/PageLayout.astro"
title: Audacity ® | VPAT – Accessibility Conformance Report
---

# Voluntary Product Accessibility Template (VPAT)

The VPAT is a standardized document that explains how Audacity conforms to accessibility standards, including WCAG 2.1 and Section 508.

## Current Report

**Product:** Audacity 3.7.3 on Windows  
**Report Date:** May 2025  
**VPAT Version:** 2.5 (International Edition)

[Download Full VPAT (PDF)](/VPAT.pdf)

## Standards Covered

| Standard | Level A | Level AA | Level AAA |
|----------|---------|----------|-----------|
| WCAG 2.0 | ✓ | ✓ | – |
| WCAG 2.1 | ✓ | ✓ | – |
| Revised Section 508 | ✓ | | |
| EN 301 549 | ✓ | | |

## Summary

The Audacity desktop application is **partially compliant** with the accessibility standards listed above. The application satisfies most applicable WCAG 2.1 Level A and Level AA criteria.

### Key Strengths

- Full keyboard shortcut customization
- Screen reader compatibility (JAWS, NVDA, Narrator)
- No flashing content or time limits
- Logical focus order
- Minimum contrast requirements met

### Known Limitations

Some accessibility gaps exist and are being addressed in future releases:

- Keyboard access is partial for some controls (envelope points, clip trimming)
- Some UI elements lack accessible names
- Text resizing requires OS-level configuration
- Tooltips are not fully accessible

For the complete list of conformance details, exceptions, and remarks, please refer to the [full VPAT document](/VPAT.pdf).

## Evaluation Methods

The evaluation was conducted using:

- JAWS, NVDA, and Narrator screen readers
- Accessibility Insights for Windows
- Windows accessibility features

## Contact

For questions about Audacity accessibility:

- **Email:** feedback@audacityteam.org
- **Address:** MuseCY SM Ltd., Spyrou Kyprianou, 84, 4004, Limassol, Cyprus

See also: [Accessibility Statement](/legal/accessibility)
