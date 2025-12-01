## Notification Dropdown Troubleshooting

### Issue
Notification dropdown doesn't appear when clicking the bell icon.

### Quick Fixes to Try

#### 1. Check Browser Console
Open browser DevTools (F12) and look for these errors:
- `Cannot find module` errors
- `useNotifications` hook errors
- React rendering errors

#### 2. Verify NotificationProvider is Loaded
In browser console, type:
```javascript
console.log('Provider check')
```

#### 3. Test Click Handler
Add this temporarily to `NotificationIcon.tsx`:
```typescript
onClick={() => {
    console.log('Bell clicked!');
    console.log('Current state:', isDropdownOpen);
    setIsDropdownOpen(!isDropdownOpen);
}}
```

#### 4. Check Z-Index Conflicts
The dropdown has `z-50` but TopNavBar might be covering it. Try changing:
```typescript
// In NotificationDropdown.tsx line 83
className="... z-[9999]"  // Change from z-50 to z-[9999]
```

#### 5. Verify Context is Working
Add to `NotificationIcon.tsx` after `useNotifications()`:
```typescript
console.log('Unread count:', unreadCount);
console.log('Dropdown open:', isDropdownOpen);
```

### Most Likely Solutions

**Solution 1: Restart Dev Server**
```bash
# Stop current server (Ctrl+C)
npm run dev
```

**Solution 2: Clear Next.js Cache**
```bash
rm -rf .next
npm run dev
```

**Solution 3: Force Re-render**
Add a key prop to force re-mount:
```typescript
<NotificationDropdown
    key={isDropdownOpen ? 'open' : 'closed'}
    isOpen={isDropdownOpen}
    onClose={() => setIsDropdownOpen(false)}
/>
```

### If Still Not Working

Check if the dropdown HTML is in the DOM but hidden:
1. Right-click the bell icon → Inspect
2. Look for a `div` with class `absolute right-0 top-full`
3. If it exists but invisible, it's a CSS issue
4. If it doesn't exist, it's a rendering issue

### Expected Behavior
- Click bell → dropdown appears below the icon
- Click outside → dropdown closes
- Click bell again → dropdown toggles
