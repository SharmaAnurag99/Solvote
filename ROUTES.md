# BlockVote Routes Documentation

## Overview
This document outlines all the routes in the BlockVote application, including their purposes, functionality, and data flow.

---

## Public Routes

### Home Page
**Route:** `/`
**File:** `app/page.tsx`
**Description:** Landing page explaining the BlockVote system
**Key Features:**
- Hero section with platform overview
- Feature highlights (Privacy, Security, Accessibility, Transparency)
- Call-to-action buttons for different user types
- Responsive design for all devices

**Components Used:**
- Navigation header
- Hero banner
- Feature grid
- Footer

---

### About Page
**Route:** `/about`
**File:** `app/about/page.tsx`
**Description:** Detailed information about the BlockVote platform
**Key Features:**
- Platform mission and vision
- How the system works
- Key technologies used
- Team/organizational information

---

### Contact/Support
**Route:** `/contact`
**File:** `app/contact/page.tsx` (if implemented)
**Description:** Contact form and support information
**Key Features:**
- Contact form submission
- Support center links
- FAQ information

---

## Voting Booth Routes

### Booth Landing
**Route:** `/booth`
**File:** `app/booth/page.tsx`
**Description:** Entry point for voting booth operations
**Key Features:**
- Booth information and instructions
- Election details
- Navigation to verification and voting

**Access Requirements:**
- Public access
- Information only - no data submission

---

### Verification Route
**Route:** `/booth/verify`
**File:** `app/booth/verify/page.tsx`
**Description:** Voter identity verification using Aadhaar
**Key Functionality:**
1. **Aadhaar Input**: Secure form for 12-digit Aadhaar number
2. **Verification Steps**:
   - Check Whitelist: Validates against approved voter list
   - Generate ZK Proof: Creates zero-knowledge proof for anonymity
   - Create Nullifier: Generates unique identifier to prevent double voting
   - Clear Data: Removes sensitive Aadhaar from memory
   - Redirect: Routes to voting interface

3. **Error Handling**:
   - Aadhaar validation (12 digits)
   - Whitelist check
   - User-friendly error messages

4. **Security Measures**:
   - Aadhaar cleared from UI after submission
   - Temporary localStorage usage only
   - Client-side proof generation
   - Nullifier prevents double voting

**Components Used:**
- Form validation
- Process step tracker
- Error display
- Loading spinner

**State Management:**
```
- aadhaar: string (voter's Aadhaar number)
- loading: boolean (submission state)
- error: string (error message)
- processSteps: array (verification step statuses)
- verifying: boolean (verification in progress)
```

---

### Voting Interface
**Route:** `/booth/vote`
**File:** `app/booth/vote/page.tsx`
**Description:** Ballot presentation and vote submission
**Prerequisites:**
- Must complete verification at `/booth/verify` first
- Valid verified identity in localStorage

**Key Functionality:**
1. **Candidate Display**:
   - Shows all candidates for current election
   - Displays candidate information (name, party, symbol)
   - Visual voting interface (radio buttons/buttons)

2. **Vote Submission**:
   - Records voter's choice
   - Creates encrypted ballot
   - Submits to blockchain/backend

3. **Confirmation**:
   - Shows confirmation message
   - Thank you screen
   - Option to view election status

4. **Security**:
   - Nullifier prevents duplicate voting
   - Encrypted submission
   - Vote privacy maintained

**Components Used:**
- Candidate cards
- Selection interface
- Confirmation dialog
- Loading states

---

### Receipt/Confirmation
**Route:** `/booth/confirmation` or `/booth/receipt`
**File:** `app/booth/confirmation/page.tsx` (if separate)
**Description:** Vote confirmation and receipt
**Key Features:**
- Confirmation of vote submission
- Receipt generation
- Election information
- Thank you message

---

## Results Routes

### Live Results Dashboard
**Route:** `/results`
**File:** `app/results/page.tsx`
**Description:** Real-time election results and analytics
**Key Features:**
- Vote tallies by candidate
- Percentage distribution
- Voter turnout statistics
- Real-time updates
- Historical data charts

**Components Used:**
- Results cards
- Pie charts
- Bar charts
- Data tables

---

### Detailed Results/Analytics
**Route:** `/results/analytics` or `/results/[id]`
**File:** `app/results/analytics/page.tsx`
**Description:** Detailed election analysis and statistics
**Key Features:**
- Demographic breakdowns
- Geographic distribution
- Temporal voting patterns
- Comparison metrics

---

## Admin/Management Routes

### Dashboard
**Route:** `/admin` or `/admin/dashboard`
**File:** `app/admin/page.tsx` or `app/admin/dashboard/page.tsx`
**Description:** Administrative dashboard
**Requirements:**
- Admin authentication required
- Role-based access control

**Key Features:**
- Election management
- Voter whitelist management
- Results oversight
- System monitoring

---

### Election Management
**Route:** `/admin/elections`
**File:** `app/admin/elections/page.tsx`
**Description:** Create and manage elections
**Functionality:**
- Create new elections
- Edit election details
- Set candidates
- Configure voting periods
- Publish/close elections

---

### Voter Management
**Route:** `/admin/voters` or `/admin/whitelist`
**File:** `app/admin/voters/page.tsx`
**Description:** Manage voter whitelist
**Functionality:**
- Upload voter lists
- Add/remove voters
- Verify Aadhaar numbers
- Set voting eligibility

---

### Settings
**Route:** `/admin/settings`
**File:** `app/admin/settings/page.tsx`
**Description:** System configuration and settings
**Functionality:**
- General settings
- Security settings
- Email/notification settings
- Blockchain/backend configuration

---

## Error Routes

### 404 Not Found
**Route:** `*` or `/not-found`
**File:** `app/not-found.tsx`
**Description:** Displayed when route doesn't exist
**Features:**
- User-friendly error message
- Navigation back to home
- Suggestion links

---

### Server Error
**Route:** `/error` or `error.tsx`
**File:** `app/error.tsx`
**Description:** Error boundary for runtime errors
**Features:**
- Error message display
- Error details (development)
- Recovery/retry options

---

## Route Navigation Flow

```
Home (/)
├── About (/about)
├── Contact (/contact)
│
└── Voting Booth (/booth)
    ├── Booth Info
    ├── Verify (/booth/verify)
    │   └── Generates identity proof
    └── Vote (/booth/vote)
        └── Confirmation (/booth/confirmation)
        
    Results (/results)
    ├── Analytics (/results/analytics)
    
    Admin Routes (requires auth)
    ├── Dashboard (/admin)
    ├── Elections (/admin/elections)
    ├── Voters (/admin/voters)
    └── Settings (/admin/settings)
```

---

## Data Flow Between Routes

### Verification to Voting Flow
1. User navigates to `/booth/verify`
2. Enters Aadhaar and submits form
3. **handleVerify** process:
   - Validates whitelist [Step 1]
   - Generates ZK proof [Step 2]
   - Creates nullifier [Step 3]
   - Clears sensitive data [Step 4]
   - Stores identity in localStorage
   - Redirects to `/booth/vote` [Step 5]

4. Voting page retrieves `verified_identity` from localStorage
5. Submits vote with nullifier
6. Redirects to confirmation page

---

## Route Metadata

### Layout Structure
- **Root Layout:** `app/layout.tsx` - Global layout, navigation, footer
- **Booth Layout:** `app/booth/layout.tsx` - Booth-specific layout (if exists)
- **Admin Layout:** `app/admin/layout.tsx` - Admin-only layout (if exists)

### Middleware
- Authentication checks for admin routes
- Identity verification for voting routes
- Error handling and logging

---

## Implementation Notes

### Next.js App Router
- Uses Next.js 13+ App Router (`app/` directory)
- File-based routing conventions
- Dynamic routes use `[param]` syntax
- Catch-all routes use `[...slug]` syntax

### Query Parameters
- Reserved for filters, sorting, pagination
- Examples: `/results?sort=votes&order=desc`

### Protected Routes
- Admin routes require authentication
- Voting routes require prior verification
- Middleware handles redirects

---

## Future Routes

### Planned Routes
- `/audit` - Blockchain audit trail viewer
- `/statistics` - Detailed voting statistics
- `/api/*` - API endpoints for backend integration
- `/print` - Ballot printing interface
- `/accessibility` - Accessibility information

---

## Usage Examples

### Navigate to Verification
```typescript
router.push("/booth/verify");
```

### Navigate to Voting
```typescript
router.push("/booth/vote");
```

### Navigate to Results
```typescript
router.push("/results");
```

### Navigate with Query Parameters
```typescript
router.push("/results?sort=votes&order=desc");
```

---

## Troubleshooting

### Route Not Loading
1. Check file exists in `app/` directory
2. Verify file has `.tsx` extension
3. Check for syntax errors in the component
4. Clear Next.js cache: `rm -rf .next`

### Page Looks Wrong
1. Check layout files are applied correctly
2. Verify CSS imports
3. Check component props are passed correctly

### Route Redirect Issues
1. Verify authentication state
2. Check localStorage for required data
3. Verify router is imported from `next/router`

---

**Last Updated:** 2024
**Version:** 1.0
