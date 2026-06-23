$API_URL = "http://192.168.12.211:18281"
$FILE    = "$PSScriptRoot\customers.txt"

function New-ShortId { [System.Guid]::NewGuid().ToString("N").Substring(0,4) }

function Invoke-Api($url, $method, $bodyObj) {
    if ($bodyObj) {
        $json  = $bodyObj | ConvertTo-Json -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
        return Invoke-RestMethod $url -Method $method -Body $bytes -ContentType "application/json; charset=utf-8"
    }
    return Invoke-RestMethod $url -Method $method
}

function Find-TeamId($ip, $teams) {
    $last = [int]($ip.Split(".")[-1])
    $pre  = ($ip.Split(".")[0..2]) -join "."
    foreach ($t in $teams) {
        if ($t.prefix -eq $pre -and $last -ge [int]$t.start -and $last -le [int]$t.end) {
            return [string]$t.id
        }
    }
    return ""
}

$teams = Invoke-Api "$API_URL/teams" "Get"
if (!$teams -or $teams.Count -eq 0) { Write-Host "No teams found."; exit 1 }

Write-Host "=== Teams ==="
foreach ($t in $teams) {
    Write-Host "  [$($t.id)] $($t.name) : $($t.prefix).$($t.start) ~ $($t.prefix).$($t.end)"
}
Write-Host ""

$raw = [System.IO.File]::ReadAllLines($FILE, [System.Text.Encoding]::UTF8) | Select-Object -Skip 1

$records = New-Object System.Collections.Generic.List[object]
$i = 0

while ($i -lt $raw.Count) {
    while ($i -lt $raw.Count -and $raw[$i].Trim() -eq "") { $i++ }
    if (($i + 3) -gt $raw.Count) { break }

    $ip      = $raw[$i].Trim(); $i++
    $name    = $raw[$i].Trim(); $i++
    $engCode = $raw[$i].Trim(); $i++
    $detail  = $raw[$i].Trim(); $i++

    if ($ip -notmatch "^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$") { continue }

    $parts   = $detail -split "`t"
    $devType = ""; $vmhost = ""; $mac = ""; $hvHost = ""
    if ($parts.Count -ge 1 -and $parts[0] -ne "-") { $devType = $parts[0] }
    if ($parts.Count -ge 2 -and $parts[1] -ne "-") { $vmhost  = $parts[1] }
    if ($parts.Count -ge 3 -and $parts[2] -ne "-") { $mac     = $parts[2] }
    if ($parts.Count -ge 4 -and $parts[3] -ne "-") { $hvHost  = $parts[3] }

    $memoParts = @()
    if ($engCode -and $engCode -ne "-") { $memoParts += $engCode }
    if ($vmhost)                        { $memoParts += "host:$vmhost" }
    if ($hvHost)                        { $memoParts += "hv:$hvHost" }

    $records.Add([PSCustomObject]@{
        ip     = $ip
        name   = $name
        device = $devType
        mac    = $mac
        memo   = ($memoParts -join " / ")
    })
}

Write-Host "Parsed: $($records.Count) records"

$grouped = $records | Group-Object ip
$merged  = New-Object System.Collections.Generic.List[object]

foreach ($g in $grouped) {
    if ($g.Count -eq 1) {
        $merged.Add($g.Group[0])
    } else {
        $nameList = ($g.Group | ForEach-Object { $_.name }) -join " / "
        $memoList = ($g.Group | Where-Object { $_.memo } | ForEach-Object { $_.memo }) -join " / "
        $firstMac = ($g.Group | Where-Object { $_.mac    } | Select-Object -First 1).mac
        $firstDev = ($g.Group | Where-Object { $_.device } | Select-Object -First 1).device
        $merged.Add([PSCustomObject]@{
            ip     = $g.Name
            name   = $nameList
            device = $firstDev
            mac    = $firstMac
            memo   = $memoList
        })
        Write-Host "MERGE: $($g.Name) -> $nameList"
    }
}

Write-Host "After merge: $($merged.Count) records`n"

$existingIps = Invoke-Api "$API_URL/ips" "Get"
$added = 0; $updated = 0; $skipped = 0
$today = Get-Date -Format "yyyy-MM-dd"

foreach ($r in $merged) {
    $exists = $existingIps | Where-Object { $_.ip -eq $r.ip } | Select-Object -First 1
    $teamId = Find-TeamId $r.ip $teams

    if (!$teamId) {
        Write-Host "WARN no-team: $($r.ip)"
        $skipped++
        continue
    }

    if ($exists) {
        $patch = @{}
        if ($exists.name -ne $r.name)      { $patch["name"]   = $r.name }
        if ($r.mac    -and !$exists.mac)   { $patch["mac"]    = $r.mac }
        if ($r.device -and !$exists.device){ $patch["device"] = $r.device }
        if ($r.memo   -and !$exists.memo)  { $patch["memo"]   = $r.memo }

        if ($patch.Count -gt 0) {
            Invoke-Api "$API_URL/ips/$($exists.id)" "Patch" $patch | Out-Null
            Write-Host "UPDATE: $($r.ip) -> $($r.name)"
            $updated++
        } else {
            $skipped++
        }
        continue
    }

    $body = @{
        id     = New-ShortId
        ip     = $r.ip
        status = "used"
        name   = $r.name
        device = $r.device
        mac    = $r.mac
        memo   = $r.memo
        date   = $today
        team   = $teamId
    }
    Invoke-Api "$API_URL/ips" "Post" $body | Out-Null
    Write-Host "ADD: $($r.ip) -> $($r.name)"
    $added++
}

Write-Host ""
Write-Host "Done - Added:$added / Updated:$updated / Skipped:$skipped"
