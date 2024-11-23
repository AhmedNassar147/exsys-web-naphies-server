# Function to log messages

# Check the current execution policy for the current user
$currentPolicy = Get-ExecutionPolicy -Scope CurrentUser -ErrorAction SilentlyContinue

if ($currentPolicy) {
  Write-Host "Current execution policy for 'CurrentUser' is: $currentPolicy"
} else {
  Write-Host "Failed to retrieve execution policy. Please check permissions."
  exit 1
}

# If the policy is not 'Unrestricted', attempt to change it
if ($currentPolicy -ne "Unrestricted") {
  Write-Host "Setting execution policy to 'Unrestricted' for 'CurrentUser'..."

  try {
    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted -Force
    Write-Host "Execution policy successfully set to 'Unrestricted'."
  } catch {
    Write-Host "Failed to set execution policy: $_"
    exit 1
  }
} else {
  Write-Host "No changes needed. Execution policy is already 'Unrestricted'."
}

exit 0
