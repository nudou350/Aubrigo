# Frontend Implementation TODO

## 🎯 Status: 75% Complete

**Last Updated**: 2025-11-05
**Priority**: Fix broken/missing functionality

---

## 🔴 **CRITICAL - BROKEN FUNCTIONALITY**

### Home Page - Search & Filters

- [ ] **Location Filter NOT WORKING** ❌ CRITICAL
  - **File**: `frontend/src/app/features/home/home.component.ts:914`
  - **Issue**: Comment says "TODO: Filter pets by location" but doesn't pass location parameter to API
  - **Current**: `this.loadPets()` doesn't use `currentLocation` signal
  - **Fix Needed**:
    ```typescript
    // Line 843-848: Update loadPets() to include location
    const params: any = {};
    if (this.selectedSpecies()) {
      params.species = this.selectedSpecies();
    }
    if (this.currentLocation()) {
      params.location = this.currentLocation();
    }
    const url = `http://localhost:3002/api/pets`;
    this.http.get<any>(url, { params }).subscribe({...});
    ```
  - **Also needs**: Use `PetsService.searchPets()` instead of direct HTTP

- [ ] **Home Component Using Direct HTTP** ⚠️
  - **File**: `frontend/src/app/features/home/home.component.ts:847`
  - **Issue**: Not using `PetsService`
  - **Fix**: Replace direct HTTP with:
    ```typescript
    constructor(private petsService: PetsService) {}

    loadPets() {
      this.loading.set(true);
      const params: SearchPetsParams = {
        species: this.selectedSpecies() || undefined,
        location: this.currentLocation() || undefined,
      };

      this.petsService.searchPets(params).subscribe({
        next: (response) => {
          this.pets.set(response.data);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading pets:', error);
          this.toastService.error('Erro ao carregar pets');
          this.loading.set(false);
        }
      });
    }
    ```

### Profile Navigation

- [ ] **Profile Link Path Issue** ⚠️
  - **File**: `frontend/src/app/shared/components/bottom-nav/bottom-nav.component.ts:158`
  - **Issue**: Uses `routerLink="/profile"` but home component uses `/perfil`
  - **Fix**: Choose one and be consistent. Route exists as `/profile` in app.routes.ts:212
  - **Also fix**: `home.component.ts:891` uses `/perfil` but should be `/profile`

- [ ] **Profile Component Empty** ❌ CRITICAL
  - **File**: `frontend/src/app/features/profile/profile.component.ts`
  - **Issue**: Component exists but is mostly empty placeholder
  - **Status**: According to TODO.md, this should be 100% complete but it's NOT
  - **What's implemented**: Empty shell
  - **What's needed**: Full implementation (view/edit profile, change password, etc.)
  - **Reference**: Check if services exist and wire them up

### Pet Form Issues

- [ ] **Using alert() instead of ToastService** ⚠️
  - **File**: `frontend/src/app/features/pets/pet-form/pet-form.component.ts`
  - **Lines**: 660, 690, 695
  - **Fix**: Replace all `alert()` calls with `this.toastService.success/error()`

---

## 🟡 **MEDIUM PRIORITY - Incomplete Features**

### Services Not Used Consistently

- [ ] **Pet Detail Component** - Partially using service
  - **File**: `frontend/src/app/features/pets/pet-detail/pet-detail.component.ts`
  - **Issue**: May still have direct HTTP calls
  - **Check**: Verify using `PetsService.getPetById()` consistently

- [ ] **Admin Components** - No Admin Service
  - **Files**: All files in `frontend/src/app/features/admin/`
  - **Issue**: All admin components use direct HTTP
  - **Needed**: Create `admin.service.ts` with methods:
    - `getUsers()`, `updateUser()`, `deleteUser()`
    - `getOngs()`, `approveOng()`, `rejectOng()`
    - `getPets()`, `moderatePet()`
    - `getReports()`, `getDashboardStats()`
  - **Then**: Refactor all admin components to use the service

### Missing Features

- [ ] **Pet Detail - Favorite Button NOT Visible**
  - **File**: Check `frontend/src/app/features/pets/pet-detail/pet-detail.component.ts`
  - **Issue**: According to TODO.md it should have a favorite heart button
  - **Status**: Need to verify if it actually exists in the template

- [ ] **Add Advanced Search to Home Page**
  - **Current**: Only basic location + species filter
  - **Missing**: Age range, size, gender filters
  - **Implementation**: Add filter dropdowns/chips
  - **Wire to**: `PetsService.searchPets()` with all SearchPetsParams

### Error Handling

- [ ] **Global Error Interceptor Missing**
  - **File**: Need to create `frontend/src/app/core/interceptors/error.interceptor.ts`
  - **Purpose**: Handle HTTP errors globally and show toast messages
  - **Add to**: `app.config.ts` providers

- [ ] **Retry Mechanisms Missing**
  - **Issue**: No retry logic for failed HTTP requests
  - **Implementation**: Add retry interceptor with exponential backoff

- [ ] **Offline Detection Missing**
  - **Issue**: No handling when user goes offline
  - **Implementation**: Create network status service and show banner

---

## 🟢 **LOW PRIORITY - UI/UX Improvements**

### Replace Remaining alert() Calls

- [ ] **Find and replace all alert() calls**
  - **Command**: `cd frontend && grep -r "alert(" src/`
  - **Replace with**: `this.toastService.success/error/warning()`
  - **Known files**:
    - `pet-form.component.ts` (lines 660, 690, 695)
    - Check all other components

### Loading States

- [ ] **Skeleton Loaders Not Used**
  - **Created**: `skeleton.component.ts` exists
  - **Issue**: Not actually used in any components yet
  - **Add to**:
    - Home page pet cards
    - Pet detail page
    - Profile page
    - Admin pages

### Empty States

- [ ] **Empty State Component Not Used Everywhere**
  - **Created**: `empty-state.component.ts` exists
  - **Check**: Favorites, Appointments, Pet lists
  - **May need**: More use cases

### Navigation Issues

- [ ] **Bottom Nav Center Button**
  - **File**: `bottom-nav.component.ts:26-68`
  - **Issue**: Shows different things for different roles
  - **Verify**: Works correctly for all user types (user/ong/admin)

---

## 🔵 **TECHNICAL DEBT**

### Direct HTTP Calls to Refactor

- [ ] **Home Component** (`home.component.ts`) → Use PetsService ✅ Mentioned above
- [ ] **Pet Detail Component** → Verify using PetsService
- [ ] **All Admin Components** → Create AdminService and refactor
- [ ] **Check for any remaining direct HTTP calls**:
  ```bash
  cd frontend/src/app/features
  grep -r "http.get\|http.post\|http.put\|http.delete" . | grep -v "\.service\.ts"
  ```

### API URL Hardcoded

- [ ] **Remove hardcoded localhost:3002**
  - **Issue**: `http://localhost:3002` appears in several components
  - **Fix**: Use `environment.apiUrl` everywhere
  - **Check**: home.component.ts, pet-form.component.ts, etc.

### Inconsistent Interfaces

- [ ] **Local interfaces vs Service interfaces**
  - **Example**: `home.component.ts:9-25` defines local `Pet` interface
  - **Issue**: Should import from `pets.service.ts` instead
  - **Fix**: Remove local interfaces, import from services

---

## 📦 **FEATURES MARKED AS COMPLETE BUT NOT VERIFIED**

### According to TODO.md these are "complete" - Need Testing

- [x] ~~Favorites Component~~ - Appears complete ✅
- [x] ~~Appointments Service~~ - Appears complete ✅
- [x] ~~Users Service~~ - Created but Profile Component not using it ❌
- [x] ~~ONG Service~~ - Appears complete ✅
- [x] ~~Toast Notifications~~ - Created but not used everywhere ⚠️
- [ ] **User Profile Component** - Marked complete but is EMPTY ❌

---

## 🧪 **TESTING NEEDED**

### Integration Testing

- [ ] **Test Complete User Flows**
  1. Anonymous user browses pets → adds to favorites → schedules visit
  2. ONG registers → login → add pet → manage pet → view appointments
  3. Regular user registers → login → browse → donate
  4. Admin login → manage users/ongs/pets

- [ ] **Test All Routes**
  - [ ] `/home` - Home page loads, filters work
  - [ ] `/pets/:id` - Pet detail shows, favorite button works
  - [ ] `/pets/:id/schedule` - Appointment form works
  - [ ] `/pets/add` - ONG can add pet
  - [ ] `/pets/edit/:id` - ONG can edit pet
  - [ ] `/pets/manage` - ONG can see all their pets
  - [ ] `/favorites` - User can see favorites
  - [ ] `/profile` - Profile page works (CURRENTLY BROKEN)
  - [ ] `/ong/dashboard` - ONG dashboard loads with stats
  - [ ] `/ong/appointments` - ONG sees appointments
  - [ ] `/ong/donations` - ONG sees donations
  - [ ] `/ong/profile/edit` - ONG can edit profile
  - [ ] `/donate` - Donation flow works
  - [ ] `/admin/*` - All admin pages work

### Browser Testing

- [ ] Chrome (Desktop & Mobile)
- [ ] Firefox (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Edge (Desktop)

### PWA Testing

- [ ] Install on Android
- [ ] Install on iOS
- [ ] Install on Desktop
- [ ] Test offline mode
- [ ] Test service worker caching

---

## 📋 **DETAILED FIX CHECKLIST**

### Priority 1 - This Week

1. [ ] **Fix Location Filter in Home Component**
   - Add location parameter to loadPets()
   - Use PetsService instead of direct HTTP
   - Test filter actually works
   - **Time**: 30 minutes

2. [ ] **Fix Profile Navigation**
   - Change `/perfil` to `/profile` in home.component.ts
   - Verify bottom-nav uses `/profile`
   - **Time**: 5 minutes

3. [ ] **Implement Profile Component**
   - Wire up existing UsersService and OngService
   - Add view/edit forms
   - Add password change
   - Add logout button
   - Test for both user types (regular user and ONG)
   - **Time**: 2-3 hours

4. [ ] **Replace alert() with ToastService**
   - Find all alert() calls
   - Replace with appropriate toast calls
   - **Time**: 30 minutes

5. [ ] **Create AdminService**
   - Create service file
   - Add all CRUD methods
   - Refactor admin components to use it
   - **Time**: 2-3 hours

### Priority 2 - Next Week

6. [ ] **Add Skeleton Loaders to Components**
   - Home page (while loading pets)
   - Pet detail page
   - Profile pages
   - **Time**: 1-2 hours

7. [ ] **Create Global Error Interceptor**
   - Handle HTTP errors
   - Show appropriate toast messages
   - Add retry logic
   - **Time**: 1 hour

8. [ ] **Add Advanced Search Filters**
   - Age range slider
   - Size dropdown
   - Gender dropdown
   - Filter chips to show active filters
   - Clear filters button
   - **Time**: 3-4 hours

9. [ ] **Remove Hardcoded API URLs**
   - Use environment.apiUrl everywhere
   - **Time**: 30 minutes

10. [ ] **Integration Testing**
    - Test all user flows
    - Fix any discovered bugs
    - **Time**: 4-6 hours

---

## 🎯 **SUCCESS CRITERIA**

### Must Have (Before Launch)
- ✅ All routes work correctly
- ✅ Location filter works
- ✅ Profile page fully functional
- ✅ All services used consistently (no direct HTTP in components)
- ✅ All alert() replaced with toast messages
- ✅ Admin panel functional
- ✅ No TypeScript compilation errors
- ✅ All user flows tested and working

### Should Have
- ✅ Skeleton loaders on all loading states
- ✅ Empty states on all list components
- ✅ Global error handling
- ✅ Advanced search filters
- ✅ PWA tested on mobile devices
- ✅ Cross-browser tested

### Nice to Have
- ⚪ Offline detection and messaging
- ⚪ Retry mechanisms for failed requests
- ⚪ Animation polish
- ⚪ Performance optimization (lazy loading)
- ⚪ Analytics integration

---

## 📊 **Actual Completion Status**

| Area | Claimed % | Actual % | Gap |
|------|-----------|----------|-----|
| **Backend** | 95% | 95% | ✅ Accurate |
| **Frontend Services** | 100% | 90% | ❌ AdminService missing |
| **Frontend Components** | 100% | 70% | ❌ Profile empty, Admin using direct HTTP |
| **Integration** | 95% | 60% | ❌ Many features not wired up |
| **Overall** | 95% | 75% | ❌ **20% overestimated** |

---

## 🚀 **Time Estimate to Complete**

- **Critical Fixes**: 1-2 days (8-16 hours)
- **Medium Priority**: 2-3 days (16-24 hours)
- **Testing & Polish**: 2-3 days (16-24 hours)
- **Total**: 1-2 weeks

---

## 📝 **Notes**

- Many items in main TODO.md are marked as complete but are actually NOT working
- Profile component is essentially empty despite being marked 100% complete
- Home location filter has a TODO comment and doesn't work
- Most components still use direct HTTP instead of services
- admin.service.ts doesn't exist at all but needed for admin panel
- Many alert() calls should be toast messages

**Recommendation**: Focus on Priority 1 items this week to get core functionality working properly.
