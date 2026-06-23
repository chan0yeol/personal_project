# Hyper-V VM sync to ip-manager
$API_URL  = "http://192.168.12.211:4100/api/ip"
$HV_HOSTS = @("192.168.11.8", "192.168.11.9")
$LOG_FILE = "$PSScriptRoot\sync.log"
$SLACK_WEBHOOK = ""

function Write-Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Write-Host $line
    Add-Content $LOG_FILE $line -Encoding utf8
}

function Send-Slack($msg) {
    if (!$SLACK_WEBHOOK) { return }
    $body = @{ text = $msg } | ConvertTo-Json
    Invoke-RestMethod $SLACK_WEBHOOK -Method Post -Body $body -ContentType "application/json" | Out-Null
}

function Get-TeamId($ip) {
    $last = [int]($ip.Split(".")[-1])
    if ($last -ge 1   -and $last -le 50)  { return "t1" }
    if ($last -ge 51  -and $last -le 100) { return "t2" }
    if ($last -ge 101 -and $last -le 150) { return "t3" }
    if ($last -ge 151 -and $last -le 200) { return "t4" }
    if ($last -ge 201 -and $last -le 255) { return "t5" }
    return ""
}

function New-ShortId { [System.Guid]::NewGuid().ToString("N").Substring(0,4) }

function Invoke-Api($url, $method, $bodyObj) {
    if ($bodyObj) {
        $json  = $bodyObj | ConvertTo-Json -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        return Invoke-RestMethod $url -Method $method -Body $bytes -ContentType "application/json; charset=utf-8"
    }
    return Invoke-RestMethod $url -Method $method
}

Write-Log "===== Sync Start ====="
$credFile = "$PSScriptRoot\ip-manager.cred"
$lines    = Get-Content $credFile
$username = $lines[0].Trim()
$password = $lines[1].Trim() | ConvertTo-SecureString
$cred     = New-Object System.Management.Automation.PSCredential($username, $password)

$vms = Invoke-Command -ComputerName $HV_HOSTS -Credential $cred -ScriptBlock {
    Get-VM | Select-Object Name, State,
        @{N='IP';E={($_.NetworkAdapters | Select-Object -ExpandProperty IPAddresses | Where-Object {$_ -notlike "fe80*"}) -join ', '}},
        @{N='MAC';E={($_.NetworkAdapters | Select-Object -ExpandProperty MacAddress) -join ', '}}
} | Select-Object Name, State, IP, MAC, PSComputerName

Write-Log "Total $($vms.Count) VMs (Running+Off)"

$existingIps = Invoke-Api "$API_URL/ips" "Get"
$added = 0; $skipped = 0; $macUpdated = 0; $statusUpdated = 0; $offUpdated = 0

# Running VM IP 목록
$runningIpList = $vms | Where-Object { $_.IP } | ForEach-Object { $_.IP.Split(",")[0].Trim() }

# ── Phase 1: Running VM → used ─────────────────────────────
foreach ($vm in $vms) {
    if (!$vm.IP -or $vm.IP -eq "") { continue }
    $ip     = $vm.IP.Split(",")[0].Trim()
    $exists = $existingIps | Where-Object { $_.ip -eq $ip } | Select-Object -First 1

    if ($exists) {
        $patch = @{}
        if ((!$exists.mac -or $exists.mac -eq "") -and $vm.MAC) {
            $patch["mac"] = $vm.MAC
            $macUpdated++
        }
        if ($exists.status -ne "used") {
            $patch["status"] = "used"
            $statusUpdated++
        }
        if ($patch.Count -gt 0) {
            Invoke-Api "$API_URL/ips/$($exists.id)" "Patch" $patch | Out-Null
            Write-Log "UPDATE: $ip ($($vm.Name)) -> used"
        } else {
            $skipped++
        }
        continue
    }

    $body = @{
        id     = New-ShortId
        ip     = $ip
        status = "used"
        name   = $vm.Name
        device = "Windows Server"
        mac    = $vm.MAC
        memo   = "Hyper-V Auto Sync"
        date   = (Get-Date -Format "yyyy-MM-dd")
        team   = Get-TeamId $ip
    }
    Invoke-Api "$API_URL/ips" "Post" $body | Out-Null
    Write-Log "ADD: $ip ($($vm.Name))"
    Send-Slack "IP Manager - NEW VM: $($vm.Name) / $ip"
    $added++
}

# ── Phase 2: Running 목록에 없는 항목 → off ────────────────
foreach ($entry in $existingIps) {
    if ($runningIpList -contains $entry.ip) { continue }  # 켜진 VM 제외
    if ($entry.status -eq "off")            { continue }  # 이미 off
    if ($entry.status -eq "reserved")       { continue }  # 예약됨은 건드리지 않음

    Invoke-Api "$API_URL/ips/$($entry.id)" "Patch" @{ status = "off" } | Out-Null
    Write-Log "VM OFF: $($entry.ip) ($($entry.name))"
    $offUpdated++
}

Write-Log "Done - Added:$added / used:$statusUpdated / MAC:$macUpdated / Off:$offUpdated / Skipped:$skipped"
