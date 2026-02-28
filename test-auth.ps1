# PrintME Auth API — Comprehensive Test Script
# Run with: powershell -File test-auth.ps1
# Requires server running on localhost:4000

$base = "http://localhost:4000/api"
$pass = 0
$fail = 0

function Test-Endpoint {
    param (
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus
    )

    try {
        $params = @{
            Uri = "$base$Url"
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }

        if ($Headers.Count -gt 0) { $params.Headers = $Headers }
        if ($Body) { $params.Body = $Body }

        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json

        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  PASS  $Name (HTTP $statusCode)" -ForegroundColor Green
            $script:pass++
        } else {
            Write-Host "  FAIL  $Name — Expected $ExpectedStatus, got $statusCode" -ForegroundColor Red
            $script:fail++
        }
        return $content
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = ""
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
        } catch {}

        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  PASS  $Name (HTTP $statusCode)" -ForegroundColor Green
            $script:pass++
        } else {
            Write-Host "  FAIL  $Name — Expected $ExpectedStatus, got $statusCode" -ForegroundColor Red
            $script:fail++
        }
        return $errorBody
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " PrintME Auth API — Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Health Check
Write-Host "[1/12] Health Check" -ForegroundColor Yellow
Test-Endpoint -Name "GET /health" -Method "GET" -Url "/health" -ExpectedStatus 200

# 2. Register — Success
Write-Host "`n[2/12] Register" -ForegroundColor Yellow
$regResult = Test-Endpoint -Name "POST /auth/register" -Method "POST" -Url "/auth/register" `
    -Body '{"email":"testuser@printme.com","password":"Secure1234","name":"Test User"}' `
    -ExpectedStatus 201

# 3. Register — Duplicate
Write-Host "`n[3/12] Duplicate Registration" -ForegroundColor Yellow
Test-Endpoint -Name "POST /auth/register (duplicate)" -Method "POST" -Url "/auth/register" `
    -Body '{"email":"testuser@printme.com","password":"Secure1234","name":"Test User"}' `
    -ExpectedStatus 409

# 4. Register — Validation Error (weak password)
Write-Host "`n[4/12] Validation Error" -ForegroundColor Yellow
Test-Endpoint -Name "POST /auth/register (weak password)" -Method "POST" -Url "/auth/register" `
    -Body '{"email":"weak@printme.com","password":"123"}' `
    -ExpectedStatus 400

# 5. Login — Success
Write-Host "`n[5/12] Login" -ForegroundColor Yellow
$loginResult = Test-Endpoint -Name "POST /auth/login" -Method "POST" -Url "/auth/login" `
    -Body '{"email":"testuser@printme.com","password":"Secure1234"}' `
    -ExpectedStatus 200

$token = $loginResult.accessToken
$refreshTok = $loginResult.refreshToken

# 6. Login — Wrong Password
Write-Host "`n[6/12] Login (wrong password)" -ForegroundColor Yellow
Test-Endpoint -Name "POST /auth/login (wrong pwd)" -Method "POST" -Url "/auth/login" `
    -Body '{"email":"testuser@printme.com","password":"WrongPass1"}' `
    -ExpectedStatus 401

# 7. Get Profile (Protected)
Write-Host "`n[7/12] Get Profile" -ForegroundColor Yellow
Test-Endpoint -Name "GET /auth/me" -Method "GET" -Url "/auth/me" `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -ExpectedStatus 200

# 8. Get Profile — No Token
Write-Host "`n[8/12] Get Profile (no token)" -ForegroundColor Yellow
Test-Endpoint -Name "GET /auth/me (no token)" -Method "GET" -Url "/auth/me" `
    -ExpectedStatus 401

# 9. Update Profile
Write-Host "`n[9/12] Update Profile" -ForegroundColor Yellow
Test-Endpoint -Name "PATCH /auth/me" -Method "PATCH" -Url "/auth/me" `
    -Body '{"name":"Updated Name"}' `
    -Headers @{ "Authorization" = "Bearer $token" } `
    -ExpectedStatus 200

# 10. Refresh Token
Write-Host "`n[10/12] Refresh Token" -ForegroundColor Yellow
$refreshResult = Test-Endpoint -Name "POST /auth/refresh" -Method "POST" -Url "/auth/refresh" `
    -Body "{`"refreshToken`":`"$refreshTok`"}" `
    -ExpectedStatus 200

# 11. Change Password
Write-Host "`n[11/12] Change Password" -ForegroundColor Yellow
$newToken = $refreshResult.accessToken
Test-Endpoint -Name "POST /auth/change-password" -Method "POST" -Url "/auth/change-password" `
    -Body '{"currentPassword":"Secure1234","newPassword":"NewSecure5678"}' `
    -Headers @{ "Authorization" = "Bearer $newToken" } `
    -ExpectedStatus 200

# 12. Login with new password
Write-Host "`n[12/12] Login with New Password" -ForegroundColor Yellow
$loginNew = Test-Endpoint -Name "POST /auth/login (new pwd)" -Method "POST" -Url "/auth/login" `
    -Body '{"email":"testuser@printme.com","password":"NewSecure5678"}' `
    -ExpectedStatus 200

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Results: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "========================================`n" -ForegroundColor Cyan
