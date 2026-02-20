# Water Quality Monitor – Milestone 2

## Overview
Milestone 2 enhances the Water Quality Monitor application by adding map-based station visualization, report submission, report viewing, and authority-based verification features.

## Features

### Station Map View
- Displays all station locations on an interactive map in the dashboard.
- Station details and readings are fetched from open APIs.

### Submit Report
- A “Report” button is available in the navigation bar.
- Users can submit reports through a dedicated report submission page with the required fields.

### View Reports
- A page to view all submitted reports.
- Reports display their current status such as pending, verified, or rejected.

### Report Verification (Authority)
- Authority users can view reports in pending state.
- Authorities can verify or reject reports.
- Report status updates based on the action taken.

## User Roles
- User: View stations and submit reports.
- Authority: View all reports and verify or reject pending reports.

## References
https://github.com/springboardmentor377/Water-Quality-Monitor/blob/main/user_stories_and_backlog_m2.txt

## Tech Stack
- Frontend: React
- Backend: FastAPI
- Database: SQLite
- APIs: Open water quality and station APIs
