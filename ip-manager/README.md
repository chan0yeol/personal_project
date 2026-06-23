# IP Manager - 작업 정리

## 개요

Hyper-V 고객사 VM IP 관리 시스템.  
json-server(REST API) + Nginx(프론트 서빙) + PowerShell 자동 동기화 구조.

---

## 시스템 구조

```
[Windows PC]
  sync-vm.ps1          → Hyper-V 호스트에서 VM 목록 수집 → API PATCH/POST
  import-customers.ps1 → 고객사.txt 파싱 → API POST/PATCH

[사내 Linux 서버 Docker]  192.168.12.211
  json-server:18281    → REST API (db.json 파일 기반)
  nginx:18282          → 프론트엔드 서빙 + /api 프록시

[브라우저]
  http://192.168.12.211:18282 → ip-manager.html
```

---

## Docker 구성

### docker-compose.yml 주요 포인트

- json-server **v0.17.4** 고정 필수 (v1.x는 db.json에 persist 안 함)
- **볼륨은 파일이 아닌 디렉토리 단위로 마운트** (파일 단위 마운트 시 atomic write 문제로 저장 안 됨)
- nginx가 `/api` 경로를 json-server로 프록시

```yaml
services:
  json-server:
    image: node:18-alpine
    working_dir: /data
    command: sh -c "npm install -g json-server@0.17.4 && json-server --watch /data/db.json --port 18281 --host 0.0.0.0"
    volumes:
      - ./:/data      # 디렉토리 마운트 필수
    ports:
      - "18281:18281"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "18282:8282"
    volumes:
      - ./html:/usr/share/nginx/html:ro
      - ./nginx.docker.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - json-server
    restart: unless-stopped
```

### 서버 관련 명령어

```bash
# 컨테이너 시작
docker compose up -d

# 재시작
docker compose restart json-server

# 로그 확인
docker compose logs json-server --tail=20
docker compose logs nginx --tail=20

# 컨테이너 상태
docker compose ps
```

---

## db.json 초기화

팀 구성 초기화 (ips는 비움):

```bash
cat > ~/ip-manager/db.json << 'EOF'
{
  "teams": [
    {"id":"t1","name":"1팀","start":1,"end":50,"prefix":"192.168.12","color":"#3fb950"},
    {"id":"t2","name":"2팀","start":51,"end":100,"prefix":"192.168.12","color":"#58a6ff"},
    {"id":"t3","name":"3팀","start":101,"end":150,"prefix":"192.168.12","color":"#bc8cff"},
    {"id":"t4","name":"4팀","start":151,"end":200,"prefix":"192.168.12","color":"#d29922"},
    {"id":"t5","name":"기타","start":201,"end":250,"prefix":"192.168.12","color":"#f85149"}
  ],
  "ips": []
}
EOF
docker compose restart json-server
```

---

## Hyper-V 스캔 명령어

### 기본 VM 목록 (Running + Off 전체)

```powershell
$cred = Get-Credential

Invoke-Command -ComputerName 192.168.11.8, 192.168.11.9 -Credential $cred -ScriptBlock {
    Get-VM | Select-Object Name, State,
        @{N='IP';E={($_.NetworkAdapters | Select-Object -ExpandProperty IPAddresses | Where-Object {$_ -notlike "fe80*"}) -join ', '}},
        @{N='MAC';E={($_.NetworkAdapters | Select-Object -ExpandProperty MacAddress) -join ', '}}
} | Select-Object Name, State, IP, MAC, PSComputerName | Format-Table -AutoSize
```

### Running VM만

```powershell
Invoke-Command -ComputerName 192.168.11.8, 192.168.11.9 -Credential $cred -ScriptBlock {
    Get-VM | Where-Object { $_.State -eq 'Running' }
} | Select-Object Name, State, PSComputerName
```

### Off VM만

```powershell
Invoke-Command -ComputerName 192.168.11.8, 192.168.11.9 -Credential $cred -ScriptBlock {
    Get-VM | Where-Object { $_.State -eq 'Off' }
} | Select-Object Name, State, PSComputerName
```

### 특정 VM IP 확인

```powershell
Invoke-Command -ComputerName 192.168.11.8 -Credential $cred -ScriptBlock {
    (Get-VM "vm이름").NetworkAdapters | Select-Object -ExpandProperty IPAddresses
}
```

### 자격증명 파일로 비대화형 실행 (Task Scheduler용)

```powershell
# 최초 1회: 자격증명 파일 생성
$cred = Get-Credential
$cred.UserName | Out-File ip-manager.cred -Encoding utf8
$cred.Password | ConvertFrom-SecureString | Add-Content ip-manager.cred -Encoding utf8

# 사용
$lines    = Get-Content ip-manager.cred
$username = $lines[0].Trim()
$password = $lines[1].Trim() | ConvertTo-SecureString
$cred     = New-Object System.Management.Automation.PSCredential($username, $password)
```

---

## sync-vm.ps1

Hyper-V VM 상태를 ip-manager에 자동 동기화.

### 동작 방식

- **Phase 1**: Running VM (IP 있음) → `status: used` 처리 / 신규면 추가
- **Phase 2**: Running 목록에 없는 기존 항목 → `status: off` 처리  
  (`reserved` 항목은 보호)

### 실행

```powershell
D:\999.오찬열\00.project\ip-manager\sync-vm.ps1
```

### Task Scheduler 등록 (월~금, 9:00~18:00, 10분 간격)

PS 5.1에서 `New-ScheduledTaskTrigger`의 RepetitionInterval이 동작 안 함 → `schtasks.exe` 사용:

```powershell
# 등록
schtasks /Create /TN "IP-Manager-Sync" /TR "powershell.exe -NonInteractive -File D:\999.오찬열\00.project\ip-manager\sync-vm.ps1" /SC MINUTE /MO 10 /ST 09:00 /ET 18:00 /SD 01/01/2026 /ED 12/31/2030 /RL HIGHEST /F

# 확인
schtasks /Query /TN "IP-Manager-Sync" /FO LIST

# 삭제
schtasks /Delete /TN "IP-Manager-Sync" /F
```

요일 제한(월~금)은 GUI(taskschd.msc) → 트리거 편집에서 설정.

### 작업 스케줄러 확인

```powershell
# 전체 목록
Get-ScheduledTask | Select-Object TaskName, State | Format-Table -AutoSize

# 키워드 검색
Get-ScheduledTask | Where-Object { $_.TaskName -like "*sync*" -or $_.TaskName -like "*ip*" }

# GUI
taskschd.msc
```

---

## import-customers.ps1

고객사.txt → ip-manager 일괄 import.

### 사전 준비

```powershell
# 고객사.txt를 스크립트 폴더에 복사 (한글 경로 문제 회피)
Copy-Item "D:\999.오찬열\고객사.txt" "D:\999.오찬열\00.project\ip-manager\customers.txt"
```

### 실행

```powershell
D:\999.오찬열\00.project\ip-manager\import-customers.ps1
```

### 동작 방식

1. `/teams` API로 팀 목록 조회 → IP 범위 기반 팀 자동 매핑
2. 4줄 블록 파싱: `IP / 한글명 / 영문코드 / 구분\t호스트명\tMAC\tHV서버`
3. 중복 IP → 이름 합쳐서 병합 (`경창산업 / 영원무역` 형태)
4. 기존 IP 있으면 PATCH (이름 업데이트), 없으면 POST

---

## 트러블슈팅

### json-server 데이터가 재시작 후 사라짐 (v1.x)
- 원인: json-server v1.x는 메모리에만 저장
- 해결: `json-server@0.17.4` 고정

### json-server 데이터가 재시작 후 사라짐 (v0.17.4, Docker)
- 원인: json-server가 atomic write 시 `.~db.json` 임시파일 생성 후 rename  
  Docker 파일 단위 바인드 마운트에서 rename 시 inode가 달라져 호스트에 반영 안 됨
- 해결: **디렉토리 단위 마운트** 사용
```yaml
volumes:
  - ./:/data    # 파일 단위(./db.json:/app/db.json) 하면 안 됨
```

### 팀별 필터링 안 됨
- 원인: json-server가 팀 id를 숫자(`1`)로 저장, JS에서 `'1' === 1` → false
- 해결: `String(t.id)` 변환으로 타입 통일

### 파일 인코딩 깨짐 (PowerShell → API)
- 원인: PS 5.1에서 `Invoke-RestMethod -Body` 가 시스템 기본 인코딩(CP949)으로 전송
- 해결: JSON을 UTF-8 바이트로 명시 변환 후 전송
```powershell
$bytes = [System.Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Compress))
Invoke-RestMethod $url -Method Post -Body $bytes -ContentType "application/json; charset=utf-8"
```

### 파일 읽기 인코딩 (고객사.txt)
- 파일 인코딩 확인:
```powershell
[System.IO.File]::ReadAllBytes("파일경로")[0..5] | ForEach-Object { $_.ToString("X2") }
# EF BB BF → UTF-8 BOM
# FF FE    → UTF-16 LE
# 49 50 EC → UTF-8 without BOM (IP 주...)
```
- customers.txt는 UTF-8 without BOM → `[System.IO.File]::ReadAllLines($FILE, [System.Text.Encoding]::UTF8)` 사용

### $host 변수 오류
- PowerShell 예약 변수 (`$host` = PS 호스트 객체)
- 해결: `$vmhost` 등 다른 이름 사용

### Task Scheduler RepetitionInterval 오류 (PS 5.1)
- 원인: PS 5.1의 `New-ScheduledTaskTrigger`는 RepetitionInterval 직접 설정 불가
- 해결: `schtasks.exe /SC MINUTE /MO 10` 사용

### 502 Bad Gateway
- json-server 컨테이너 다운 상태
- `docker compose logs json-server` 로 확인 후 재시작

---

## IP 상태 정의

| 상태 | 색상 | 의미 |
|---|---|---|
| `used` | 초록 | VM 켜짐 / 사용중 |
| `reserved` | 노랑 | 예약됨 (수동) |
| `off` | 빨강 | VM 꺼짐 |
| `free` | 회색 | 미사용 |

---

## 파일 구조

```
ip-manager/
├── docker-compose.yml
├── nginx.docker.conf
├── db.json                  ← json-server 데이터 (디렉토리 마운트로 persist)
├── sync-vm.ps1              ← Hyper-V 자동 동기화
├── import-customers.ps1     ← 고객사.txt 일괄 import
├── customers.txt            ← 고객사 원본 데이터 (고객사.txt 복사본)
├── ip-manager.cred          ← Hyper-V 자격증명 (암호화)
├── sync.log                 ← 동기화 로그
└── html/
    └── ip-manager.html      ← 프론트엔드
```
