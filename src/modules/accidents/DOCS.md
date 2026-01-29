# Accidents module

## Responsibilities
- Handle accident reporting and emergency requests from the mobile app.
- Persist accidents and emergency requests.
- Provide a **pure** “in range” computation function for unit testing.

## Public endpoints
- `POST /accident/report-accident`
- `POST /accident/emergency-request`

## Key exports
- `createAccidentsService()` in `accidents.service.js`
- `haversineMeters()` / `isInRange()` in `accidents.service.js` (pure functions)

