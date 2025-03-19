param (
    [string]$Frequency = "DAILY",
    [string]$StartTime = "09:00",
    [string]$TaskName = "MonitorGifticFees"
)

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
# Remove the unused variable or use it in a comment to explain what it would be for
# $monitorScriptPath = Join-Path $scriptDir "monitorFees.js"
$npmPath = (Get-Command npm).Source

# Create the task action
$action = New-ScheduledTaskAction -Execute $npmPath -Argument "run monitor" -WorkingDirectory $scriptDir

# Create the trigger (daily by default)
switch ($Frequency) {
    "DAILY" {
        $trigger = New-ScheduledTaskTrigger -Daily -At $StartTime
    }
    "HOURLY" {
        $trigger = New-ScheduledTaskTrigger -Once -At $StartTime -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration ([TimeSpan]::MaxValue)
    }
    "WEEKLY" {
        $trigger = New-ScheduledTaskTrigger -Weekly -At $StartTime -DaysOfWeek Monday
    }
    default {
        Write-Error "Invalid frequency. Use DAILY, HOURLY, or WEEKLY."
        exit 1
    }
}

# Settings for the task
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -WakeToRun

# Create and register the task
try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Force
    Write-Host "Task '$TaskName' created successfully! It will run $Frequency at $StartTime."
    Write-Host "The task will monitor fees for the Giftic contract and trigger withdrawals when they reach the USD threshold."
} catch {
    Write-Error "Failed to create task: $_"
    exit 1
} 