# Implementation Plan: Full Firebase Integration (Firestore & Firebase Auth)

Integrate Firebase Authentication and Cloud Firestore into the LBRCE Hostel Management System. Every user registration, login, outpass request, warden approval, complaint resolution, fee payment, and room allocation will be permanently recorded in Cloud Firestore with role-based security rules.

---

## 1. User Requirements & Architectural Decisions

- **Full Cloud Persistence**: Transition data storage to Cloud Firestore (`users`, `rooms`, `outpasses`, `complaints`, `notices`, `mess`, `fees`, `attendance`, and `auditLogs`).
- **Firebase Authentication**: Implement real Email/Password authentication for students, wardens, and administrators, with roll number and institutional profile verification.
- **Comprehensive Activity Recording**: Record every transactional event into an `auditLogs` collection in Firestore (timestamp, actor UID, role, action type, before/after snapshot).
- **Graceful Fallback & Offline Resilience**: Maintain local cache synchronization so the application continues to function seamlessly in development and production environments.

---

## 2. Proposed Changes & Steps

### Step 1: Firebase Provisioning & Terms Verification (Interactive Tools)
- Launch `show_aistudio_ui` with `ui_type: "firebase_setup"` to open the Firebase provisioning curtain.
- Upon resumption, verify TOS acceptance via `GetFirebaseTos` RPC.
- Call `ProvisionFirebase` RPC (`service_name: "fax"`) for platform `web` to provision Firestore and Firebase Auth.
- Verify `firebase-applet-config.json` is generated.

### Step 2: Security Rules & Blueprint Deployment
- Author `firebase-blueprint.json` defining collection schemas (`users`, `rooms`, `outpasses`, `complaints`, `notices`, `mess`, `fees`, `attendance`, `auditLogs`).
- Author `firestore.rules` enforcing role-based access control (RBAC):
  - Users can read their own profile; wardens/admins can read and manage all profiles.
  - Students can create outpass requests and complaints; only wardens/admins can update approval status and remarks.
  - Every update logs an audit record into `auditLogs`.
- Deploy security rules via `DeployRules` RPC (`service_name: "fax"`).

### Step 3: Dependency Installation & Client SDK Initialization
- Install official `firebase` client SDK package.
- Create `src/lib/firebase.ts` reading configuration dynamically from `firebase-applet-config.json`.
- Export initialized `auth` and `db` (Firestore) instances with offline persistence enabled.

### Step 4: Authentication Flow & Account Registration
- Update `src/context/AuthContext.tsx` to handle:
  - Firebase `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, and `onAuthStateChanged`.
  - Automatic profile document creation in `/users/{uid}` with fields: `rollNo`, `name`, `role`, `roomNo`, `block`, `branch`, `phone`.
  - Support for new student sign-up / registration with roll number verification.
  - Pre-seeded institutional accounts for instant testing.

### Step 5: Firestore Service Layer
- Create `src/services/firestoreService.ts` to execute real-time Firestore queries and mutations:
  - `subscribeRooms`, `allocateBedInFirestore`, `vacateBedInFirestore`
  - `subscribeOutpasses`, `createOutpassInFirestore`, `updateOutpassStatusInFirestore`
  - `subscribeComplaints`, `createComplaintInFirestore`, `updateComplaintStatusInFirestore`
  - `subscribeNotices`, `publishNoticeInFirestore`
  - `subscribeMessMenu`, `updateMessDayInFirestore`
  - `subscribeFees`, `recordFeePaymentInFirestore`
  - `subscribeAttendance`, `toggleAttendanceInFirestore`
  - `recordAuditLog` helper logging every operation with actor details.

### Step 6: UI & Dashboard Integration
- Update `LoginPage.tsx` with dedicated tabs for **Sign In** and **New Student Registration** with roll number, branch, room, and parent contact fields.
- Update `Header.tsx` to display live Firebase connection status (green indicator with Firestore project ID).
- Add an **Audit & Activity Log** viewer in `AdminDashboard.tsx` displaying the stream of recorded operations.

### Step 7: Build Verification
- Run `lint_applet` and `compile_applet` to ensure zero compilation or TypeScript errors.

---

## 3. Verification Plan

### Automated Verification
- Verify `firebase-applet-config.json` exists with valid `projectId` and `apiKey`.
- Run `npm run lint` (`tsc --noEmit`) to verify strict typing.
- Run `npm run build` to confirm Vite production bundle builds without errors.

### User Flow Verification
1. Open the login page and test creating a new student account using Firebase Auth.
2. Sign in as Admin (`warden@lbrce.ac.in`) and Student (`21761a0501@lbrce.ac.in`).
3. Apply for an outpass and verify it is written to Firestore and appears in the Warden console.
4. Approve the outpass as Warden and verify the status update and audit log in Firestore.
5. Check the MERN / Firebase console in the header to confirm live cloud sync.
