# Fix for Refresh Token bcrypt 72-Byte Limit Issue

## Problem Statement
The application was attempting to hash JWT refresh tokens using bcrypt's `hash_password()` function. JWT refresh tokens are approximately 200+ characters long, but bcrypt has a hard 72-byte input limit. This caused the authentication system to fail when creating refresh tokens.

## Root Cause Analysis
- JWT tokens produced by the `create_refresh_token()` function were ~200+ characters
- The `hash_password()` function uses bcrypt which enforces a 72-byte maximum input
- Attempting to hash tokens longer than 72 bytes would either:
  - Raise a `ValueError: invalid salt`
  - Silently truncate the token to 72 bytes during hashing
- The `RefreshToken` model was missing the `jti` field that was being populated in `auth_service.py`

## Solution Implemented

### 1. **Added SHA256 Token Hashing Functions** 
   - File: `app/core/security.py`
   - Added `hash_token(token: str) -> str` - SHA256 hashing with no length limit
   - Added `verify_token_hash(token: str, stored_hash: str) -> bool` - Compare token against stored hash
   - SHA256 outputs 64 hexadecimal characters regardless of input length

### 2. **Updated RefreshToken Model**
   - File: `app/models/auth.py`
   - Added missing `jti` field: `jti: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)`
   - Added index on `jti` field for query performance

### 3. **Updated Authentication Service**
   - File: `app/services/auth_service.py`
   - Updated imports to include `hash_token` and `verify_token_hash`
   - Changed token storage: `hash_password(refresh_token)` → `hash_token(refresh_token)`
   - Fixed field name: `token_hash=` → `token=` (matching model definition)
   - Added token verification in `refresh_tokens()` method to ensure token integrity

### 4. **Created Database Migration**
   - File: `alembic/versions/add_jti_to_refresh_tokens.py`
   - Adds `jti` column to `refresh_tokens` table
   - Creates unique index on `jti` field
   - Provides rollback capability via downgrade

## Technical Details

### Why SHA256 Instead of Bcrypt?
- **Bcrypt**: Limited to 72-byte input, designed for passwords
- **SHA256**: No length limit, fast hashing, cryptographically secure
- Our Token Strategy:
  1. Store the SHA256 hash in the database (64 characters)
  2. Compare incoming token's SHA256 against stored hash
  3. JWT validates signature independently

### Token Storage Flow
```
User Login:
1. create_refresh_token() → JWT token (~200 chars)
2. hash_token(token) → SHA256 hash (64 chars) 
3. Store in DB: RefreshToken(token=hash, jti=uuid, ...)

Token Refresh:
1. Receive token from client
2. JWT.decode() validates signature
3. hash_token(received_token) == stored_hash? → Verify integrity
4. Check JTI, expiry, revocation status
```

## Files Modified
1. ✅ `app/core/security.py` - Added hash functions
2. ✅ `app/models/auth.py` - Added jti field  
3. ✅ `app/services/auth_service.py` - Updated token handling
4. ✅ `alembic/versions/add_jti_to_refresh_tokens.py` - Database migration

## Migration Steps
```bash
# Apply migration
alembic upgrade head

# Existing tokens in database will need to be regenerated
# since they were stored incorrectly as bcrypt hashes
```

## Testing Recommendations

### Unit Tests
```python
# Test SHA256 hashing
token = "test_token_" + "x" * 200
hashed = hash_token(token)
assert verify_token_hash(token, hashed)

# Test with actual JWT token
jti = str(uuid.uuid4())
token = create_refresh_token(subject="user_id")
hashed = hash_token(token[0])
assert len(hashed) == 64  # SHA256 produces 64 hex chars
```

### Integration Tests
1. User login → refresh token created
2. Use refresh token → verify token doesn't exceed 72 bytes before hashing
3. Tampered token → should fail hash comparison
4. Expired token → should fail expiry check
5. Revoked token → should fail revocation check

## Backwards Compatibility
- **Breaking**: Existing refresh tokens stored as bcrypt hashes will not work
- **Action**: Users will need to re-authenticate after this deployment
- **Future**: Could add data migration to re-hash existing tokens if needed

## Security Implications
✅ **Improved**: No data loss from 72-byte truncation
✅ **Improved**: Explicit token integrity verification
✅ **Maintained**: JWT signature validation
✅ **Maintained**: JTI uniqueness tracking

## Performance Impact
- SHA256 hashing: ~1-2 microseconds per token (negligible)
- Token comparison: O(1) string comparison
- Database queries: Same as before (indexed by jti)

## Related Issues
- Refresh tokens can now be theoretically unlimited length (though JWT library may have its own limits)
- Token storage is now hash-based for database security
- Implementation now matches the intended design pattern

## Verification
Run after deployment:
```bash
# Check that tokens are being created and refreshed properly
curl -X POST /api/v1/auth/refresh -H "Content-Type: application/json" -d '{"refresh_token":"..."}'

# Should return new access + refresh token pair
```
