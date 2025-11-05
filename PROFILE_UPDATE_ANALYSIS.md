# Profile Update Analysis - Pet SOS Frontend

## Executive Summary

There is a critical architectural disconnect in how profile updates are synchronized with authentication state. When users update their firstName, lastName, or ONG name, the changes are saved to the database but NOT reflected in the AuthService.currentUser signal, causing stale data to persist across the application until a page refresh.

## Problems Identified

### 1. Stale Greeting Display
- User updates firstName from "Joao" to "Joao Silva"
- Greeting on home page still shows "Ola, Joao!"
- Only updates after page refresh

### 2. Inconsistent Authentication State
- UsersService.currentUser$ has new data
- AuthService.currentUser has stale data
- Different services see different user information

### 3. localStorage Out of Sync
- Browser storage retains old user data
- Profile updates do not persist to localStorage

### 4. No Real-time UI Updates
- Components reading from AuthService get stale data
- No reactive updates propagate through the app
- Multiple sources of truth for user data

## Files Involved

### Core Services

1. **AuthService**
   - File: E:\Projetos\aubrigo\frontend\src\app\core\services\auth.service.ts
   - Lines 76-77: Define currentUserSignal (source of truth)
   - Line 151: Set via handleAuthSuccess() only (login/register)
   - NEVER updated by profile changes

2. **UsersService**
   - File: E:\Projetos\aubrigo\frontend\src\app\core\services\users.service.ts
   - Lines 53-54: Define currentUserSubject (separate BehaviorSubject)
   - Lines 68-72: updateUserProfile() updates own subject only
   - NEVER notifies AuthService

3. **OngService**
   - File: E:\Projetos\aubrigo\frontend\src\app\core\services\ong.service.ts
   - Lines 85-86: Define currentOngSubject (separate BehaviorSubject)
   - Lines 100-104: updateOngProfile() updates own subject only
   - NEVER notifies AuthService

### Profile Components

1. **ProfileComponent**
   - File: E:\Projetos\aubrigo\frontend\src\app\features\profile\profile.component.ts
   - Lines 98-124: firstName and lastName form fields
   - Line 691-696: Prepare update data
   - Line 698: Call usersService.updateUserProfile()
   - Does not sync updated data with AuthService

2. **ProfileEditComponent (ONG)**
   - File: E:\Projetos\aubrigo\frontend\src\app\features\ong\profile\profile-edit.component.ts
   - Lines 56-123: Form fields for ONG profile
   - Lines 565-573: Prepare update data
   - Line 576: Call ongService.updateOngProfile()
   - Does not sync updated data with AuthService

### Display Components

1. **HomeComponent**
   - File: E:\Projetos\aubrigo\frontend\src\app\features\home\home.component.ts
   - Lines 873-887: getGreeting() method
   - Line 874: Reads from authService.currentUser() (STALE)
   - Line 877: Uses stale firstName in greeting
   - Depends on AuthService being kept current

## Current Data Flow (BROKEN)

ProfileComponent (User edits firstName, lastName)
  -> ProfileComponent.saveProfile()
    -> UsersService.updateUserProfile(updateData)
      -> HTTP PUT /api/users/profile
        -> Response: { message, user: UpdatedUser }
          -> tap() updates UsersService.currentUserSubject [OK]
          -> BUT does not update AuthService.currentUserSignal [BROKEN]
          -> AND does not update localStorage [BROKEN]

Result:
- API data persisted [OK]
- UsersService.currentUser$ notified [OK]
- AuthService.currentUser remains stale [BROKEN]
- localStorage not updated [BROKEN]

HomeComponent.getGreeting()
  -> Reads from authService.currentUser()
  -> Gets stale data
  -> Shows old name

## What Should Happen

1. Profile API call succeeds [OK - working]
2. UsersService gets updated [OK - working]
3. AuthService gets updated [BROKEN - missing]
4. localStorage gets updated [BROKEN - missing]
5. Components reading AuthService see current data [BROKEN - fails]

## Code References

### ProfileComponent.saveProfile() - Lines 664-709

The component saves profile data:
  const updateData = {
    firstName: formValue.firstName,
    lastName: formValue.lastName,
    phone: formValue.phone,
    location: formValue.location,
  };
  
  this.usersService.updateUserProfile(updateData).subscribe({
    next: () => {
      this.toastService.success('Perfil atualizado com sucesso');
      // MISSING: Does not update AuthService!
    }
  });

### UsersService.updateUserProfile() - Lines 68-72

Updates wrong store:
  updateUserProfile(data: UpdateProfileDto): Observable<UpdateProfileResponse> {
    return this.http.put<UpdateProfileResponse>(...).pipe(
      tap((response) => this.currentUserSubject.next(response.user))
      // Updates UsersService only, not AuthService!
    );
  }

### AuthService.currentUserSignal - Lines 76-77

Source of truth that should be updated:
  private currentUserSignal = signal<User | null>(null);
  currentUser = this.currentUserSignal.asReadonly();

### AuthService.handleAuthSuccess() - Lines 148-155

Only place currentUserSignal is updated:
  private handleAuthSuccess(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    this.currentUserSignal.set(response.user);
    // This is ONLY called during login/register
  }

Called by:
  - register() at line 87
  - registerUser() at line 93
  - registerOng() at line 99
  - login() at line 105
  - NEVER by profile update methods

### HomeComponent.getGreeting() - Lines 873-887

Displays stale data:
  getGreeting(): string {
    const user = this.authService.currentUser();
    if (user?.firstName) {
      return `Ola, ${user.firstName}!`;  // STALE data!
    }
  }

## Verification

To confirm the bug:

1. Log in with firstName "John"
2. Navigate to profile
3. Change firstName to "John Doe"
4. Click "Salvar Alteracoes"
5. Go back to home page
6. Greeting still shows "Ola, John!" (STALE)
7. Refresh page
8. Greeting now shows "Ola, John Doe!" (from API)

This proves AuthService signal is NOT updated by profile saves.

## Impact

Severity: HIGH

- Stale greeting display
- Inconsistent authentication state
- Out of sync localStorage
- Confusing user experience
- Different parts of app show different names

## Solution Needed

Profile update services must:
1. Update the API (already works)
2. Update UsersService/OngService (already works)
3. Update AuthService.currentUserSignal (MISSING)
4. Update localStorage (MISSING)

This would require either:
- Adding a method to AuthService to update currentUserSignal
- Having profile services also update AuthService
- Creating a synchronized state management system

